// src/app/api/articles/[slug]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateArticleComments, getArticleBySlug, getSubscriberByEmail } from '@/lib/data-admin';
import type { Comment } from '@/lib/data-types';
import { z } from 'zod';
import { checkRateLimitFirestore } from '@/lib/rate-limit-firestore';
import { verifySession } from '@/lib/auth';
import DOMPurify from 'isomorphic-dompurify';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: { slug: string }
}

const commentSchema = z.object({
  id: z.number(),
  author: z.string().min(1, "Le nom est requis").max(100, "Le nom est trop long").trim(),
  text: z.string().min(1, "Le commentaire ne peut pas être vide").max(1000, "Le commentaire est trop long (max 1000 caractères)").trim(),
  avatar: z.string().refine(
    val => val === '' || val.startsWith('https://'),
    { message: 'Avatar doit être une URL HTTPS valide ou vide' }
  ),
  email: z.string().email("Email invalide").trim(),
  parentId: z.number().nullable().optional(),
  likes: z.number().optional()
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Check for valid session — admin if authenticated
    const sessionValue = request.cookies.get('session')?.value;
    let isAdmin = false;
    if (sessionValue) {
      const decoded = await verifySession(sessionValue);
      isAdmin = !!decoded;
    }

    // 2. Rate limiting (applies to non-admin requests)
    if (!isAdmin) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';

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
            headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
          }
        );
      }
    }

    // 3. Parse the body
    const body = await request.json();
    const { comments: incomingComments }: { comments: Comment[] } = body;

    if (!incomingComments || !Array.isArray(incomingComments)) {
      return NextResponse.json(
        { error: 'Le tableau de commentaires est requis' },
        { status: 400 }
      );
    }

    // 4. Fetch current comments from Firestore
    const article = await getArticleBySlug(params.slug);
    const currentComments: Comment[] = article?.comments || [];

    // 5. Compute diff
    const currentIds = new Set(currentComments.map(c => c.id));
    const incomingIds = new Set(incomingComments.map(c => c.id));

    const removedComments = currentComments.filter(c => !incomingIds.has(c.id));
    const addedComments = incomingComments.filter(c => !currentIds.has(c.id));
    const modifiedComments = incomingComments.filter(c => {
      if (!currentIds.has(c.id)) return false;
      const existing = currentComments.find(ec => ec.id === c.id);
      return existing && (
        existing.text !== c.text ||
        existing.author !== c.author ||
        existing.email !== c.email
      );
    });

    // 6. Enforce non-admin rules
    if (!isAdmin) {
      if (removedComments.length > 0) {
        return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
      }
      if (modifiedComments.length > 0) {
        return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
      }
      if (addedComments.length > 1) {
        return NextResponse.json(
          { error: 'Un seul commentaire peut être ajouté à la fois' },
          { status: 400 }
        );
      }
      if (addedComments.length === 0) {
        return NextResponse.json(
          { error: 'Aucun nouveau commentaire détecté' },
          { status: 400 }
        );
      }
    }

    // 7. Validate and sanitize each comment
    const validatedComments: Comment[] = [];

    for (const comment of incomingComments) {
      try {
        const validated = commentSchema.parse(comment);

        // For non-admin: verify subscriber status for new comments
        if (!isAdmin && addedComments.some(c => c.id === validated.id)) {
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

        // Sanitize text with DOMPurify (strips all HTML)
        const sanitizedText = DOMPurify.sanitize(validated.text, { ALLOWED_TAGS: [] });

        if (!sanitizedText || sanitizedText.length === 0) {
          return NextResponse.json(
            { error: 'Le commentaire contient du contenu invalide' },
            { status: 400 }
          );
        }

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
          const errorMessages = error.errors.map(e => e.message).join(', ');
          return NextResponse.json(
            { error: `Validation échouée: ${errorMessages}` },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // 8. Save validated comments
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
