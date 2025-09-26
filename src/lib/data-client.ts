// src/lib/data-client.ts
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
    increment 
} from 'firebase/firestore';
import type { Article, Profile, Subscriber } from './data-types';

// Fonctions de lecture publique utilisant le SDK client Firebase

export async function getPublishedArticles(): Promise<Article[]> {
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
                scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
                image: data.image,
                content: data.content,
                views: data.views || 0,
                comments: data.comments || [],
                viewHistory: data.viewHistory || [],
            } as Article;
        });
    } catch (error) {
        console.error('Error getting published articles:', error);
        return [];
    }
}

export async function getAllArticles(): Promise<Article[]> {
    return await getPublishedArticles();
}

export async function getArticlesByCategory(category: string, categories: { name: string; slug: string; }[]): Promise<Article[]> {
    try {
        const articlesCollection = collection(db, 'articles');
        const q = query(
            articlesCollection,
            where('category', '==', category),
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
                scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
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

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    try {
        const docRef = doc(db, 'articles', slug);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            return null;
        }
        
        const data = docSnap.data();
        
        // Increment view count
        await updateDoc(docRef, {
            views: increment(1)
        });
        
        return {
            slug: docSnap.id,
            title: data.title,
            author: data.author,
            category: data.category,
            publishedAt: data.publishedAt.toDate().toISOString(),
            status: data.status,
            scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
            image: data.image,
            content: data.content,
            views: (data.views || 0) + 1,
            comments: data.comments || [],
            viewHistory: data.viewHistory || [],
        } as Article;
    } catch (error) {
        console.error('Error getting article by slug:', error);
        return null;
    }
}

export async function searchArticles(query: string): Promise<Article[]> {
    try {
        // Firebase ne supporte pas la recherche full-text native
        // On récupère tous les articles publiés et on filtre côté client
        const articles = await getPublishedArticles();
        const lowerQuery = query.toLowerCase();
        
        return articles.filter(article => 
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

export async function getRecentArticles(limitCount: number = 5): Promise<Article[]> {
    try {
        const articlesCollection = collection(db, 'articles');
        const q = query(
            articlesCollection,
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(limitCount)
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
                scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
                image: data.image,
                content: data.content,
                views: data.views || 0,
                comments: data.comments || [],
                viewHistory: data.viewHistory || [],
            } as Article;
        });
    } catch (error) {
        console.error('Error getting recent articles:', error);
        return [];
    }
}

export async function getPopularArticles(limitCount: number = 5): Promise<Article[]> {
    try {
        const articlesCollection = collection(db, 'articles');
        const q = query(
            articlesCollection,
            where('status', '==', 'published'),
            orderBy('views', 'desc'),
            limit(limitCount)
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
                scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
                image: data.image,
                content: data.content,
                views: data.views || 0,
                comments: data.comments || [],
                viewHistory: data.viewHistory || [],
            } as Article;
        });
    } catch (error) {
        console.error('Error getting popular articles:', error);
        return [];
    }
}

export async function getArticleCategories(): Promise<string[]> {
    try {
        const articles = await getPublishedArticles();
        const categories = [...new Set(articles.map(article => article.category))];
        return categories.sort();
    } catch (error) {
        console.error('Error getting article categories:', error);
        return [];
    }
}

// Fonction pour les statistiques publiques (sans informations sensibles)
export async function getPublicStats(): Promise<{ 
    totalArticles: number; 
    totalViews: number; 
    categories: string[] 
}> {
    try {
        const articles = await getPublishedArticles();
        const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
        const categories = [...new Set(articles.map(article => article.category))];
        
        return {
            totalArticles: articles.length,
            totalViews,
            categories
        };
    } catch (error) {
        console.error('Error getting public stats:', error);
        return {
            totalArticles: 0,
            totalViews: 0,
            categories: []
        };
    }
}