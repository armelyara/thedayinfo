// src/app/api/articles/route.ts
import { NextResponse } from 'next/server';
import { getPublishedArticles } from '@/lib/data-client';

// Nouvelle route publique pour obtenir tous les articles publiés
export async function GET() {
  try {
    const articles = await getPublishedArticles();
    
    if ('error' in articles) {
      // Si getPublishedArticles retourne une erreur, la propager
      return NextResponse.json(
        { error: articles.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Erreur API articles:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
