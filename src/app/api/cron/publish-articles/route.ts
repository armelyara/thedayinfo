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
    // 1. Sécuriser la route (déclenché par un admin authentifié)
    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        const decodedClaims = await verifySession(sessionCookie);
        if (!decodedClaims) {
            return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
        }

        // 2. Récupérer les brouillons programmés à publier
        const draftsToPublish = await getScheduledArticlesToPublish();
        
        if (draftsToPublish.length === 0) {
            return NextResponse.json({ message: 'Aucun article programmé à publier.' });
        }

        // 3. Publier chaque article
        const publicationResults = [];
        for (const draft of draftsToPublish) {
            try {
                // La fonction `publishScheduledArticle` déplace le brouillon vers la collection `articles`
                await publishScheduledArticle(draft.id);
                publicationResults.push({ draftId: draft.id, status: 'success' });
            } catch (error) {
                console.error(`Échec de la publication du brouillon ${draft.id}:`, error);
                publicationResults.push({ draftId: draft.id, status: 'failed', error: (error as Error).message });
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
