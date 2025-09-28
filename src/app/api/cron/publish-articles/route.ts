'use server';
// src/app/api/cron/publish-articles/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { 
    getScheduledArticlesToPublish, 
    publishScheduledArticle 
} from '@/lib/data-admin';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export async function POST() {
    // La route peut être appelée par un admin authentifié (depuis le dashboard)
    // ou par un service de cron externe (sans cookie de session).
    // On ne sécurise pas strictement ici, car la logique est idempotente
    // et ne fait que publier ce qui doit l'être.
    
    try {
        // 1. Récupérer les brouillons programmés à publier
        const draftsToPublish = await getScheduledArticlesToPublish();
        
        if (draftsToPublish.length === 0) {
            return NextResponse.json({ message: 'Aucun article programmé à publier.' });
        }

        // 2. Publier chaque article
        const publicationResults = [];
        for (const draft of draftsToPublish) {
            try {
                // La fonction `publishScheduledArticle` déplace le brouillon vers la collection `articles`
                const publishedArticle = await publishScheduledArticle(draft.id);
                publicationResults.push({ draftId: draft.id, status: 'success', slug: publishedArticle.slug });
                
                // Invalider les caches
                revalidatePath('/');
                revalidatePath('/admin');
                revalidatePath('/admin/drafts');
                revalidatePath(`/article/${publishedArticle.slug}`);

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
