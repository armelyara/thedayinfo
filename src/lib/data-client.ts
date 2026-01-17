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
import type { Article, Profile, Project } from './data-types';

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
                likes: data.likes || 0,
                dislikes: data.dislikes || 0,
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

        // Fetch the article without incrementing views
        // View tracking is now handled client-side by ViewTracker component
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data();
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
            slug: docSnap.id,
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
            likes: data.likes || 0,
            dislikes: data.dislikes || 0,
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

export async function incrementViews(slug: string): Promise<Article | null> {
    try {
        const docRef = doc(db, 'articles', slug);
        
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) {
                throw new Error("Document does not exist!");
            }
            
            const currentData = docSnap.data();
            const newViews = (currentData.views || 0) + 1;
            const currentHistory = currentData.viewHistory || [];
            
            // AJOUT : Créer l'entrée d'historique pour aujourd'hui
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Réinitialiser à minuit
            const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            // Vérifier si on a déjà une entrée pour aujourd'hui
            const todayEntryIndex = currentHistory.findIndex((entry: any) => {
                const entryDate = typeof entry.date === 'string' 
                    ? entry.date.split('T')[0] 
                    : new Date(entry.date).toISOString().split('T')[0];
                return entryDate === todayString;
            });
            
            let updatedHistory;
            if (todayEntryIndex >= 0) {
                // Mettre à jour l'entrée existante
                updatedHistory = [...currentHistory];
                updatedHistory[todayEntryIndex] = {
                    date: todayString,
                    views: (updatedHistory[todayEntryIndex].views || 0) + 1
                };
            } else {
                // Ajouter une nouvelle entrée
                updatedHistory = [
                    ...currentHistory,
                    {
                        date: todayString,
                        views: 1
                    }
                ];
            }
            
            // Mettre à jour à la fois views ET viewHistory
            transaction.update(docRef, { 
                views: newViews,
                viewHistory: updatedHistory
            });
        });

        // Relire le document pour retourner les données à jour
        const updatedDoc = await getDoc(docRef);
        if (!updatedDoc.exists()) {
            return null;
        }

        const data = updatedDoc.data();
        
        // Vérifier que l'article est publié
        if (data.status !== 'published') {
            const now = new Date();
            const scheduledFor = data.scheduledFor ? data.scheduledFor.toDate() : null;
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
            views: data.views || 0,
            comments: data.comments || [],
            viewHistory: data.viewHistory || [],
            likes: data.likes || 0,
            dislikes: data.dislikes || 0,
        } as Article;
    } catch (error) {
        console.error('Error incrementing views:', error);
        return null;
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

// ===============================================
// Fonctions pour les Projets
// ===============================================

// Récupérer tous les projets, triés par date de création
export async function getProjects(): Promise<Project[]> {
    try {
        const projectsCollection = collection(db, 'projects');
        const q = query(projectsCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            return [];
        }
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                slug: doc.id,
                createdAt: data.createdAt.toDate().toISOString(),
                updatedAt: data.updatedAt.toDate().toISOString(),
            } as Project;
        });
    } catch (error) {
        console.error('Error getting projects:', error);
        return [];
    }
}

// Récupérer un projet spécifique par son slug
export async function getProjectBySlug(slug: string): Promise<Project | null> {
    try {
        const docRef = doc(db, 'projects', slug);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            return null;
        }
        
        const data = docSnap.data();
        return {
            ...data,
            slug: docSnap.id,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
        } as Project;
    } catch (error) {
        console.error(`Error getting project by slug ${slug}:`, error);
        return null;
    }
}
