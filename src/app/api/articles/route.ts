// src/app/api/articles/route.ts
import { NextResponse } from 'next/server';
import { getPublishedArticles } from '@/lib/data-admin'; // ✅ Utiliser data-admin pour les routes API

// Route publique pour obtenir tous les articles publiés
export async function GET() {
  try {
    const articles = await getPublishedArticles();
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Erreur API articles:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}