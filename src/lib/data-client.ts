// src/app/lib/data-client.ts
import { db } from './firebase-client';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    updateDoc,
    increment, 
    runTransaction
} from 'firebase/firestore';
import type { Article, Profile, Subscriber } from './data-types';

export async function getPublishedArticles(): Promise<Article[] | { error: string; message: string; }> {
    try {
        const articlesCollection = collection(db, 'articles');
        const q = query(
            articlesCollection,
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                slug: doc.id,
                title: data.title,
                author: data.author,
                category: data.category,
                publishedAt: data.publishedAt.toDate().toISOString(),
                status: data.status,
                image: data.image,
                content: data.content,
                views: data.views || 0,
                comments: data.comments || [],
                viewHistory: data.viewHistory || [],
            } as Article;
        });
    } catch (error: any) {
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            return {
                error: 'missing_index',
                message: error.message
            };
        }
        console.error('Error getting published articles:', error);
        return {
            error: 'unknown',
            message: 'An unexpected error occurred while fetching articles.'
        };
    }
}


export async function getArticleBySlug(slug: string): Promise<Article | null> {
    try {
        const docRef = doc(db, 'articles', slug);
        
        // Use a transaction to safely increment the view count
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) {
                throw new Error("Document does not exist!");
            }
            const newViews = (docSnap.data().views || 0) + 1;
            transaction.update(docRef, { views: newViews });
        });

        const updatedDoc = await getDoc(docRef);
        if (!updatedDoc.exists()) {
            return null;
        }

        const data = updatedDoc.data();
        // Check if the article is actually published
        if (data.status !== 'published') {
            const now = new Date();
            const scheduledFor = data.scheduledFor ? data.scheduledFor.toDate() : null;
            // Allow access only if it was scheduled and the time has passed (should have been published by cron)
            if (!scheduledFor || scheduledFor > now) {
                return null;
            }
        }
        
        return {
            slug: updatedDoc.id,
            title: data.title,
            author: data.author,
            category: data.category,
            publishedAt: data.publishedAt.toDate().toISOString(),
            status: data.status,
            image: data.image,
            content: data.content,
            views: data.views || 0, // The updated view count
            comments: data.comments || [],
            viewHistory: data.viewHistory || [],
        } as Article;
    } catch (error) {
        console.error('Error getting article by slug:', error);
        return null;
    }
}


export async function getArticlesByCategory(categorySlug: string, categories: { name: string; slug: string; }[]): Promise<Article[]> {
    try {
        const category = categories.find(c => c.slug === categorySlug);
        if (!category) return [];

        const articlesCollection = collection(db, 'articles');
        const q = query(
            articlesCollection,
            where('category', '==', category.name),
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                slug: doc.id,
                title: data.title,
                author: data.author,
                category: data.category,
                publishedAt: data.publishedAt.toDate().toISOString(),
                status: data.status,
                image: data.image,
                content: data.content,
                views: data.views || 0,
                comments: data.comments || [],
                viewHistory: data.viewHistory || [],
            } as Article;
        });
    } catch (error) {
        console.error('Error getting articles by category:', error);
        return [];
    }
}

export async function searchArticles(queryText: string): Promise<Article[]> {
    try {
        const articlesResult = await getPublishedArticles();
        if ('error' in articlesResult) {
            return [];
        }

        const lowerQuery = queryText.toLowerCase();
        
        return articlesResult.filter(article => 
            article.title.toLowerCase().includes(lowerQuery) ||
            article.content.toLowerCase().includes(lowerQuery) ||
            article.category.toLowerCase().includes(lowerQuery) ||
            article.author.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching articles:', error);
        return [];
    }
}

export async function getProfile(): Promise<Profile | null> {
    try {
        const docRef = doc(db, 'site-config', 'profile');
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            return null;
        }
        
        return docSnap.data() as Profile;
    } catch (error) {
        console.error('Error getting profile:', error);
        return null;
    }
}
