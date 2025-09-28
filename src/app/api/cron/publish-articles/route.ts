
'use server';
// src/app/api/cron/publish-articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledArticlesToPublish,
  publishScheduledArticle,
} from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';

async function handler(request: NextRequest) {
  // 1. Sécurité : Vérifier le secret du cron job
  const cronSecret = process.env.CRON_SECRET;
  const requestSecret = request.nextUrl.searchParams.get('secret');

  // Une alternative est de vérifier un header, plus sécurisé
  const requestHeaderSecret = request.headers.get('x-cron-secret');
  
  if (!cronSecret || (requestSecret !== cronSecret && requestHeaderSecret !== cronSecret)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // 2. Récupérer les articles à publier
    const draftsToPublish = await getScheduledArticlesToPublish();

    if (draftsToPublish.length === 0) {
      return NextResponse.json({
        message: 'Aucun article programmé à publier.',
        publishedCount: 0,
      });
    }

    // 3. Publier chaque article
    const publicationResults = [];
    for (const draft of draftsToPublish) {
      try {
        const publishedArticle = await publishScheduledArticle(draft.id);
        publicationResults.push({
          draftId: draft.id,
          status: 'success',
          slug: publishedArticle.slug,
        });

        // 4. Invalider les caches pour mettre le site à jour
        revalidatePath('/');
        revalidatePath('/admin/drafts');
        revalidatePath(`/article/${publishedArticle.slug}`);
        revalidatePath(`/category/${publishedArticle.category.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')}`);

      } catch (error) {
        console.error(`Échec de la publication du brouillon ${draft.id}:`, error);
        publicationResults.push({
          draftId: draft.id,
          status: 'failed',
          error: (error as Error).message,
        });
      }
    }

    // 5. Renvoyer une réponse de succès
    return NextResponse.json({
      message: `${publicationResults.filter(r => r.status === 'success').length} article(s) publié(s).`,
      results: publicationResults,
      publishedCount: publicationResults.filter(r => r.status === 'success').length,
    });

  } catch (error) {
    console.error('Erreur dans le cron de publication:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne lors du traitement du cron.' },
      { status: 500 }
    );
  }
}

// Autoriser à la fois GET et POST pour plus de flexibilité avec les services de cron
export const GET = handler;
export const POST = handler;
