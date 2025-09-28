
// src/app/api/cron/publish-articles/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { 
    getScheduledArticlesToPublish, 
    publishScheduledArticle 
} from '@/lib/data-admin';

export const revalidate = 0;

export async function POST() {
    // 1. Sécuriser la route
    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const decodedClaims = await verifySession(sessionCookie);
        if (!decodedClaims) {
            return NextResponse.json({ error: 'Session invalide' }, { status unauthorized: 401 });
        }

        // 2. Récupérer les articles à publier
        const articlesToPublish = await getScheduledArticlesToPublish();
        
        if (articlesToPublish.length === 0) {
            return NextResponse.json({ message: 'Aucun article à publier.' });
        }

        // 3. Publier chaque article
        const publicationResults = [];
        for (const article of articlesToPublish) {
            try {
                await publishScheduledArticle(article.slug);
                publicationResults.push({ slug: article.slug, status: 'success' });
            } catch (error) {
                console.error(`Échec de la publication de l'article ${article.slug}:`, error);
                publicationResults.push({ slug: article.slug, status: 'failed', error: (error as Error).message });
            }
        }
        
        return NextResponse.json({
            message: `${articlesToPublish.length} article(s) traité(s).`,
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
