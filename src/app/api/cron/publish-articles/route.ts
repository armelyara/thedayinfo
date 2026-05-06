import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledArticlesToPublish,
  publishScheduledArticle,
} from '@/lib/data-admin';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  const isInternal = request.headers.get('x-internal-request') === 'true';
  const expectedSecret = process.env.CRON_SECRET_TOKEN;
  
  let isAuthorized = false;

  if (cronSecret === expectedSecret) {
    isAuthorized = true;
  } else if (isInternal) {
    const sessionCookie = request.cookies.get('session');
    if (sessionCookie) {
      const decodedUser = await verifySession(sessionCookie.value).catch(() => null);
      if (decodedUser) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    console.error('Unauthorized cron access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const draftsToPublish = await getScheduledArticlesToPublish();

    if (draftsToPublish.length === 0) {
      return NextResponse.json({
        message: 'Aucun article programmé à publier.',
        publishedCount: 0,
      });
    }

    const publicationResults = [];

    for (const draft of draftsToPublish) {
      try {
        const publishedArticle = await publishScheduledArticle(draft);

        publicationResults.push({
          draftId: draft.id,
          status: 'success',
          slug: publishedArticle.slug,
          title: publishedArticle.title,
        });
        revalidatePath('/');
        revalidatePath('/admin/drafts');
        revalidatePath(`/blog/${publishedArticle.slug}`);
        if (publishedArticle.category) {
            revalidatePath(`/category/${publishedArticle.category.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')}`);
        }

      } catch (error) {
        console.error(`Échec publication brouillon ${draft.id}:`, error);
        publicationResults.push({
          draftId: draft.id,
          status: 'failed',
          error: (error as Error).message,
        });
      }
    }

    const successCount = publicationResults.filter(r => r.status === 'success').length;
    
    return NextResponse.json({
      message: `${successCount} article(s) publié(s).`,
      results: publicationResults,
      publishedCount: successCount,
    });

  } catch (error) {
    console.error('Erreur cron publication:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export const POST = handler;