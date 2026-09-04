// src/app/api/articles/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/data-admin';
import { toPublicArticle } from '@/lib/data/articles';
import { checkRateLimitFirestore } from '@/lib/rate-limit-firestore';
import { getClientIp } from '@/lib/client-ip';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    if (!params.slug) {
      return NextResponse.json(
        { error: 'Slug manquant' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);

    const rateLimitResult = await checkRateLimitFirestore(
      `article-view:${ip}`,
      30,
      60 * 1000
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer dans un instant.' },
        {
          status: 429,
          headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
        }
      );
    }

    const article = await getArticleBySlug(params.slug);

    if (!article) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(await toPublicArticle(article));
  } catch (error) {
    console.error('Erreur API articles:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
