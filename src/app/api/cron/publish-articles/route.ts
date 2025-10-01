// src/app/api/cron/publish-articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getScheduledArticlesToPublish, publishScheduledArticle } from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';

async function handler(request: NextRequest) {
  // VÉRIFICATION 1 : Token OIDC (vérifié automatiquement par Firebase Hosting)
  // Firebase Hosting valide le token JWT automatiquement
  
  // VÉRIFICATION 2 : Header p(request.headers.get('X-CloudScheduler-Token'))éfense en profondeur)
  const schedulerToken = request.headers.get('X-CloudScheduler-Token');
  const expectedToken = process.env.CRON_SECRET_TOKEN;

  console.log('=== DEBUG CRON AUTH ===');
  console.log('Header reçu:', schedulerToken?.substring(0, 10) + '...');
  console.log('Token attendu:', expectedToken?.substring(0, 10) + '...');
  console.log('Variable définie?', !!expectedToken);
  console.log('========================');
  
  if (schedulerToken !== expectedToken) {
    console.error('Invalid scheduler token');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }request.headers.get('X-CloudScheduler-Token')

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
        revalidatePath(`/article/${publishedArticle.slug}`);
        revalidatePath(`/category/${publishedArticle.category.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')}`);
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

export const GET = handler;
export const POST = handler;