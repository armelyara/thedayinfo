// src/app/api/articles/[slug]/comments/route.ts
import { NextResponse } from 'next/server';
import { updateArticleComments } from '@/lib/data-admin';
import type { Comment } from '@/lib/data-types';
import { z } from 'zod';

type RouteParams = {
  params: { slug: string }
}

// Schéma de validation pour un commentaire
const commentSchema = z.object({
  id: z.number(),
  author: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long").trim(),
  text: z.string().min(1, "Le commentaire ne peut pas être vide").max(1000, "Le commentaire est trop long (max 1000 caractères)").trim(),
  avatar: z.string(),
  parentId: z.number().nullable().optional(),
  likes: z.number().optional()
});

// Map pour le rate limiting simple (en mémoire)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Fonction de rate limiting
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  // Si pas d'entrée ou si la fenêtre est expirée, on réinitialise
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + 15 * 60 * 1000 // 15 minutes
    });
    return true;
  }

  // Si la limite est atteinte (max 5 commentaires par 15 minutes)
  if (limit.count >= 5) {
    return false;
  }

  // Incrémenter le compteur
  limit.count++;
  return true;
}

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
    // 1. Rate limiting basé sur l'IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de commentaires. Veuillez réessayer dans 15 minutes.' },
        { status: 429 }
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