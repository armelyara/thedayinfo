// src/app/api/articles/[slug]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateArticleComments, getArticleBySlug, getSubscriberByEmail } from '@/lib/data-admin';
import type { Comment } from '@/lib/data-types';
import { z } from 'zod';
import { checkRateLimitFirestore } from '@/lib/rate-limit-firestore';
import { getClientIp } from '@/lib/client-ip';
import { requireAdmin } from '@/lib/auth';
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

/** Server-generated numeric id (avoids trusting client-supplied ids). */
function newCommentId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Session → admin if authenticated
    const sessionValue = request.cookies.get('session')?.value;
    let isAdmin = false;
    if (sessionValue) {
      const decoded = await requireAdmin(sessionValue);
      isAdmin = !!decoded;
    }

    // 2. Rate limiting for non-admins (IP taken from the trusted proxy hop)
    if (!isAdmin) {
      const ip = getClientIp(request);
      const rateLimitResult = await checkRateLimitFirestore(`comment:${ip}`, 5, 15 * 60 * 1000);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Trop de commentaires. Veuillez réessayer dans 15 minutes.', retryAfter: rateLimitResult.retryAfter },
          { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
        );
      }
    }

    // 3. Parse body
    const body = await request.json();
    const { comments: incomingComments }: { comments: Comment[] } = body;
    if (!incomingComments || !Array.isArray(incomingComments)) {
      return NextResponse.json({ error: 'Le tableau de commentaires est requis' }, { status: 400 });
    }

    // 4. Authoritative current comments from Firestore (source of truth, with PII)
    const article = await getArticleBySlug(params.slug);
    if (!article) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }
    const currentComments: Comment[] = article.comments || [];

    // =========================================================================
    // ADMIN PATH: trusted full-array replace (moderation: edit/remove/add).
    // =========================================================================
    if (isAdmin) {
      const validated: Comment[] = [];
      for (const comment of incomingComments) {
        try {
          const c = commentSchema.parse(comment);
          const sanitizedText = DOMPurify.sanitize(c.text, { ALLOWED_TAGS: [] });
          if (!sanitizedText) {
            return NextResponse.json({ error: 'Le commentaire contient du contenu invalide' }, { status: 400 });
          }
          validated.push({
            id: c.id,
            author: c.author.trim(),
            text: sanitizedText,
            avatar: c.avatar,
            email: c.email.toLowerCase(),
            parentId: c.parentId ?? null,
            likes: c.likes ?? 0,
          });
        } catch (error) {
          if (error instanceof z.ZodError) {
            return NextResponse.json({ error: `Validation échouée: ${error.errors.map(e => e.message).join(', ')}` }, { status: 400 });
          }
          throw error;
        }
      }
      const ok = await updateArticleComments(params.slug, validated);
      return ok
        ? NextResponse.json({ success: true, message: 'Commentaires mis à jour' })
        : NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 });
    }

    // =========================================================================
    // PUBLIC PATH: never trust the client's copy of existing comments (they no
    // longer carry emails anyway). Rebuild from Firestore + apply ONE change.
    // =========================================================================
    const currentById = new Map(currentComments.map((c) => [c.id, c]));
    const added = incomingComments.filter((c) => !currentById.has(c.id));

    // --- Case A: exactly one NEW comment (the commenter's own) ---
    if (added.length === 1) {
      // Validate only the new comment. Its email must be the commenter's own
      // (from their localStorage); it is verified against an active subscriber.
      const newCommentSchema = z.object({
        author: z.string().min(1).max(100).trim(),
        text: z.string().min(1).max(1000).trim(),
        avatar: z.string().refine((v) => v === '' || v.startsWith('https://'), 'Avatar invalide'),
        email: z.string().email().toLowerCase().trim(),
        parentId: z.number().nullable().optional(),
      });

      let parsed;
      try {
        parsed = newCommentSchema.parse(added[0]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: `Validation échouée: ${error.errors.map(e => e.message).join(', ')}` }, { status: 400 });
        }
        throw error;
      }

      // Parent must exist if it's a reply
      if (parsed.parentId != null && !currentById.has(parsed.parentId)) {
        return NextResponse.json({ error: 'Commentaire parent introuvable' }, { status: 400 });
      }

      const subscriber = await getSubscriberByEmail(parsed.email);
      if (!subscriber || subscriber.status !== 'active') {
        return NextResponse.json(
          { error: 'Vous devez être abonné pour commenter', requiresSubscription: true },
          { status: 403 }
        );
      }

      const sanitizedText = DOMPurify.sanitize(parsed.text, { ALLOWED_TAGS: [] });
      if (!sanitizedText) {
        return NextResponse.json({ error: 'Le commentaire contient du contenu invalide' }, { status: 400 });
      }

      const newComment: Comment = {
        id: newCommentId(),
        author: parsed.author.trim(),
        text: sanitizedText,
        avatar: parsed.avatar,
        email: parsed.email,
        parentId: parsed.parentId ?? null,
        likes: 0,
      };

      const ok = await updateArticleComments(params.slug, [...currentComments, newComment]);
      return ok
        ? NextResponse.json({ success: true, message: 'Commentaire ajouté avec succès', comment: { ...newComment, email: undefined } })
        : NextResponse.json({ error: 'Échec de l\'ajout du commentaire' }, { status: 500 });
    }

    // --- Case B: no new comment → treat as a single "like" (+1) ---
    if (added.length === 0) {
      // Find exactly one existing comment whose likes increased by 1 in the payload.
      const bumped = incomingComments.filter((c) => {
        const cur = currentById.get(c.id);
        return cur && (c.likes ?? 0) === (cur.likes ?? 0) + 1;
      });
      if (bumped.length !== 1) {
        return NextResponse.json({ error: 'Aucune modification valide détectée' }, { status: 400 });
      }
      const targetId = bumped[0].id;
      const updated = currentComments.map((c) =>
        c.id === targetId ? { ...c, likes: (c.likes ?? 0) + 1 } : c
      );
      const ok = await updateArticleComments(params.slug, updated);
      return ok
        ? NextResponse.json({ success: true, message: 'Like enregistré' })
        : NextResponse.json({ error: 'Échec de la mise à jour' }, { status: 500 });
    }

    // --- More than one new comment: rejected ---
    return NextResponse.json({ error: 'Un seul commentaire peut être ajouté à la fois' }, { status: 400 });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}
