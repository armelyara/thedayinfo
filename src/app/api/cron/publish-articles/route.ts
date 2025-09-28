
'use server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledArticlesToPublish,
  publishScheduledArticle,
} from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';

// La sécurité est maintenant gérée par l'authentification OIDC de Cloud Scheduler.
// Le code est simplifié et n'a plus besoin d'initialiser Firebase Admin ici.

async function handler(request: NextRequest) {
  try {
    // 1. Récupérer les articles à publier
    const draftsToPublish = await getScheduledArticlesToPublish();

    if (draftsToPublish.length === 0) {
      return NextResponse.json({
        message: 'Aucun article programmé à publier.',
        publishedCount: 0,
      });
    }

    // 2. Publier chaque article
    const publicationResults = [];
    for (const draft of draftsToPublish) {
      try {
        const publishedArticle = await publishScheduledArticle(draft.id);
        
        publicationResults.push({
          draftId: draft.id,
          status: 'success',
          slug: publishedArticle.slug,
          title: publishedArticle.title,
        });

        // 3. Invalider les caches pour mettre le site à jour
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

    // 4. Renvoyer une réponse de succès
    const successCount = publicationResults.filter(r => r.status === 'success').length;
    
    return NextResponse.json({
      message: `${successCount} article(s) publié(s).`,
      results: publicationResults,
      publishedCount: successCount,
    });

  } catch (error) {
    // Cette erreur se déclenchera si, par exemple, getScheduledArticlesToPublish échoue
    // à cause d'un problème d'initialisation ou de base de données.
    console.error('Erreur dans le cron de publication:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne lors du traitement du cron.' },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;

    