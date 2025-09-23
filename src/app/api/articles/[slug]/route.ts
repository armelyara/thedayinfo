// src/app/api/articles/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/data';

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

    const article = await getArticleBySlug(params.slug);
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Erreur API articles:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
