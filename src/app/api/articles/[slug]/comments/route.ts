// src/app/api/articles/[slug]/comments/route.ts
import { NextResponse } from 'next/server';
import { updateArticleComments, getSubscriberByEmail } from '@/lib/data-admin';
import type { Comment } from '@/lib/data-types';
import { z } from 'zod';
import { checkRateLimitFirestore } from '@/lib/rate-limit-firestore';

type RouteParams = {
  params: { slug: string }
}

// Schéma de validation pour un commentaire
const commentSchema = z.object({
  id: z.number(),
  author: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long").trim(),
  text: z.string().min(1, "Le commentaire ne peut pas être vide").max(1000, "Le commentaire est trop long (max 1000 caractères)").trim(),
  avatar: z.string(),
  email: z.string().email("Email invalide").trim(),
  parentId: z.number().nullable().optional(),
  likes: z.number().optional()
});

// Fonction simple de sanitization (supprime les balises HTML dangereuses)
function sanitizeText(text: string): string {
  // Supprime les balises script, style, iframe, etc.
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Supprime les handlers JS (onclick, etc.)
    .trim();
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    // 1. Rate limiting basé sur l'IP avec Firestore
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Vérifier le rate limit : 5 commentaires par 15 minutes
    const rateLimitResult = await checkRateLimitFirestore(
      `comment:${ip}`,
      5,
      15 * 60 * 1000
    );
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Trop de commentaires. Veuillez réessayer dans 15 minutes.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        }
      );
    }

    // 2. Parser le body
    const body = await request.json();
    const { comments }: { comments: Comment[] } = body;

    if (!comments || !Array.isArray(comments)) {
      return NextResponse.json(
        { error: 'Le tableau de commentaires est requis' },
        { status: 400 }
      );
    }

    // 3. Valider chaque commentaire avec Zod
    const validatedComments: Comment[] = [];

    for (const comment of comments) {
      try {
        // Valider avec Zod
        const validated = commentSchema.parse(comment);

        // IMPORTANT: Vérifier que l'email appartient à un abonné actif
        // Exception: l'admin peut toujours commenter
        const isAdmin = validated.email.toLowerCase() === 'admin@thedayinfo.com';

        if (!isAdmin) {
          const subscriber = await getSubscriberByEmail(validated.email.toLowerCase());
          if (!subscriber || subscriber.status !== 'active') {
            return NextResponse.json(
              {
                error: 'Vous devez être abonné pour commenter',
                requiresSubscription: true
              },
              { status: 403 }
            );
          }
        }

        // Sanitizer le texte
        const sanitizedText = sanitizeText(validated.text);

        // Vérifier que le texte n'est pas vide après sanitization
        if (!sanitizedText || sanitizedText.length === 0) {
          return NextResponse.json(
            { error: 'Le commentaire contient du contenu invalide' },
            { status: 400 }
          );
        }

        // Ajouter le commentaire validé et nettoyé
        validatedComments.push({
          id: validated.id,
          author: validated.author.trim(),
          text: sanitizedText,
          avatar: validated.avatar,
          email: validated.email.toLowerCase(),
          parentId: validated.parentId ?? null,
          likes: validated.likes ?? 0
        });
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Retourner les erreurs de validation de manière claire
          const errorMessages = error.errors.map(e => e.message).join(', ');
          return NextResponse.json(
            { error: `Validation échouée: ${errorMessages}` },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // 4. Sauvegarder les commentaires validés
    const success = await updateArticleComments(params.slug, validatedComments);

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Commentaire ajouté avec succès' 
      });
    } else {
      return NextResponse.json(
        { error: 'Échec de l\'ajout du commentaire' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}