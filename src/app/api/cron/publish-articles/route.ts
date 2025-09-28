
'use server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledArticlesToPublish,
  publishScheduledArticle,
} from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';
import { initializeFirebaseAdmin } from '@/lib/auth';

// Fonction handler unifiée pour GET et POST
async function handler(request: NextRequest) {
  // 1. Initialiser Firebase Admin (CORRECTION)
  // C'est l'étape qui manquait et qui causait l'erreur 500.
  try {
    await initializeFirebaseAdmin();
  } catch (error) {
    console.error('Échec de l\'initialisation de Firebase Admin:', error);
    return NextResponse.json(
      { error: 'Erreur critique du serveur lors de l\'initialisation.' },
      { status: 500 }
    );
  }

  // 2. Vérifier la sécurité (paramètres de sécurité conservés)
  const cronSecret = process.env.CRON_SECRET;
  const requestHeaderSecret = request.headers.get('x-cron-secret');
  
  if (!cronSecret || requestHeaderSecret !== cronSecret) {
    // Si le secret du Cron Job ne correspond pas, refuser la requête.
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    // 3. Récupérer les articles à publier
    const draftsToPublish = await getScheduledArticlesToPublish();

    if (draftsToPublish.length === 0) {
      return NextResponse.json({
        message: 'Aucun article programmé à publier.',
        publishedCount: 0,
      });
    }

    // 4. Publier chaque article
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

        // 5. Invalider les caches pour mettre le site à jour
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

    // 6. Renvoyer une réponse de succès
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
