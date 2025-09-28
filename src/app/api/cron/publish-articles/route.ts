
'use server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledArticlesToPublish,
  publishScheduledArticle,
} from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';

async function handler(request: NextRequest) {
  // NOTE: La vérification de sécurité a été temporairement retirée pour le débogage.
  // Elle devra être réactivée en s'assurant que le secret correspond
  // entre le Cron Job et les variables d'environnement du backend.

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
          title: publishedArticle.title,
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
    const successCount = publicationResults.filter(r => r.status === 'success').length;
    
    return NextResponse.json({
      message: `${successCount} article(s) publié(s).`,
      results: publicationResults,
      publishedCount: successCount,
    });

  } catch (error) {
    console.error('Erreur dans le cron de publication:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne lors du traitement du cron.' },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
