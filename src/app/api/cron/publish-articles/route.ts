
import { NextRequest, NextResponse } from 'next/server';
import { getScheduledArticlesToPublish, publishScheduledArticle } from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';

async function handler(request: NextRequest) {
  // Security check for cron job
  const cronSecret = request.headers.get('cron_secret_token');
  const expectedSecret = process.env.CRON_JOB_SECRET;
  
  if (!expectedSecret) {
    console.error('[CRON-HANDLER] CRON_JOB_SECRET is not set in the environment.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (cronSecret !== expectedSecret) {
    console.error(`[CRON-HANDLER] Invalid cron secret. Received: ${cronSecret}`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON-HANDLER] Cron job authorized. Starting process.');

  try {
    const draftsToPublish = await getScheduledArticlesToPublish();

    if (draftsToPublish.length === 0) {
      console.log('[CRON-HANDLER] No scheduled articles to publish.');
      return NextResponse.json({
        message: 'Aucun article programmé à publier.',
        publishedCount: 0,
      });
    }

    console.log(`[CRON-HANDLER] Found ${draftsToPublish.length} article(s) to publish.`);
    const publicationResults = [];

    for (const draft of draftsToPublish) {
      try {
        console.log(`[CRON-HANDLER] Publishing draft ID: ${draft.id}`);
        const publishedArticle = await publishScheduledArticle(draft);
        
        publicationResults.push({
          draftId: draft.id,
          status: 'success',
          slug: publishedArticle.slug,
          title: publishedArticle.title,
        });
        console.log(`[CRON-HANDLER] Successfully published article: ${publishedArticle.slug}`);

        // Revalidation paths
        revalidatePath('/');
        revalidatePath('/admin/drafts');
        revalidatePath(`/article/${publishedArticle.slug}`);
        revalidatePath(`/category/${publishedArticle.category.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')}`);
        console.log(`[CRON-HANDLER] Revalidated paths for article: ${publishedArticle.slug}`);

      } catch (error) {
        console.error(`[CRON-HANDLER-LOOP] Failed to publish draft ${draft.id}:`, error);
        publicationResults.push({
          draftId: draft.id,
          status: 'failed',
          error: (error as Error).message,
        });
      }
    }

    const successCount = publicationResults.filter(r => r.status === 'success').length;
    console.log(`[CRON-HANDLER] Process finished. Published ${successCount} article(s).`);
    
    return NextResponse.json({
      message: `${successCount} article(s) publié(s).`,
      results: publicationResults,
      publishedCount: successCount,
    });
  } catch (error) {
    console.error('[CRON-HANDLER-MAIN] A critical error occurred in the cron handler:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Handler for both GET and POST to match the scheduler's configuration
export const GET = handler;
export const POST = handler;
