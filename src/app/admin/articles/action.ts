'use server';

import { getAdminArticles } from '@/lib/data-admin';

export async function getArticlesAction() {
    try {
        const articles = await getAdminArticles();
        return articles;
    } catch (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
}
