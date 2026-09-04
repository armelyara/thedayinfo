// src/app/api/articles/route.ts
import { NextResponse } from 'next/server';
import { getPublishedArticles } from '@/lib/data-admin'; // ✅ Utiliser data-admin pour les routes API
import { toPublicArticle } from '@/lib/data/articles';

// Mark as dynamic to prevent static generation during build
export const dynamic = 'force-dynamic';

// Route publique pour obtenir tous les articles publiés
export async function GET() {
  try {
    const articles = await getPublishedArticles();
    // Error union from the data layer: pass through as-is (no PII involved).
    if (!Array.isArray(articles)) {
      return NextResponse.json(articles);
    }
    // Strip commenter emails before exposing publicly.
    const publicArticles = await Promise.all(articles.map(toPublicArticle));
    return NextResponse.json(publicArticles);
  } catch (error) {
    console.error('Erreur API articles:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}