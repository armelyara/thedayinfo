'use server';
// src/app/api/cron/publish-articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledArticlesToPublish,
  publishScheduledArticle,
} from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';

async function handler(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const requestSecret = request.nextUrl.searchParams.get('secret');
    const internalRequestHeader = request.headers.get('X-Internal-Request');

    if (requestSecret !== cronSecret && internalRequestHeader !== 'true') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const draftsToPublish = await getScheduledArticlesToPublish();

    if (draftsToPublish.length === 0) {
      return NextResponse.json({
        message: 'Aucun article programmé à publier.',
      });
    }

    const publicationResults = [];
    for (const draft of draftsToPublish) {
      try {
        const publishedArticle = await publishScheduledArticle(draft.id);
        publicationResults.push({
          draftId: draft.id,
          status: 'success',
          slug: publishedArticle.slug,
        });

        // Invalider les caches
        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath('/admin/drafts');
        revalidatePath(`/article/${publishedArticle.slug}`);
      } catch (error) {
        console.error(
          `Échec de la publication du brouillon ${draft.id}:`,
          error
        );
        publicationResults.push({
          draftId: draft.id,
          status: 'failed',
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      message: `${draftsToPublish.length} article(s) traité(s).`,
      results: publicationResults,
    });
  } catch (error) {
    console.error('Erreur dans le cron de publication:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
