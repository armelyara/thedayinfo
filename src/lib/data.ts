//'use server';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    query,
    where,
    orderBy,
    increment,
    updateDoc,
    setDoc,
    deleteDoc,
    addDoc,
    Timestamp as ClientTimestamp,
} from 'firebase/firestore';
import { db, initializeFirebaseClient } from './firebase-client';
import { getFirestore as getAdminFirestore, Timestamp as AdminTimestamp, FieldValue } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from './auth';

// Data Types
export type Comment = {
    id: number;
    author: string;
    text: string;
    avatar: string;
    parentId?: number | null;
    likes?: number;
};
  
export type ViewHistory = {
    date: string;
    views: number;
};
  
export type ArticleImage = {
    id: string;
    src: string;
    alt: string;
    aiHint: string;
};

export type Article = {
    slug: string;
    title: string;
    author: string;
    category: string;
    publishedAt: string;
    status: 'published' | 'scheduled';
    scheduledFor?: string;
    image: ArticleImage;
    content: string;
    views: number;
    comments: Comment[];
    viewHistory: ViewHistory[];
};

export type Category = {
    name: string;
    slug: string;
};

export type Subscriber = {
    id: string;
    email: string;
    name?: string;
    subscribedAt: string;
    status: 'active' | 'unsubscribed';
    preferences: {
      frequency: 'daily' | 'weekly' | 'monthly';
      categories: string[];
    };
};

const convertDocToArticle = (doc: any): Article => {
    const data = doc.data();
    
    const toISOString = (timestamp: any) => {
        if (!timestamp) return new Date().toISOString();
        if (timestamp instanceof ClientTimestamp || timestamp instanceof AdminTimestamp) {
            return timestamp.toDate().toISOString();
        }
        return new Date(timestamp).toISOString();
    };

    return {
        slug: doc.id,
        title: data.title,
        author: data.author,
        category: data.category,
        publishedAt: toISOString(data.publishedAt),
        status: data.status,
        scheduledFor: data.scheduledFor ? toISOString(data.scheduledFor) : undefined,
        image: data.image,
        content: data.content,
        views: data.views || 0,
        comments: data.comments || [],
        viewHistory: data.viewHistory || [],
    } as Article;
};

const convertDocToSubscriber = (doc: any): Subscriber => {
    const data = doc.data();
    const toISOString = (timestamp: any) => {
        if (!timestamp) return new Date().toISOString();
        if (timestamp instanceof ClientTimestamp || timestamp instanceof AdminTimestamp) {
            return timestamp.toDate().toISOString();
        }
        return new Date(timestamp).toISOString();
    };
    return {
        id: doc.id,
        email: data.email,
        name: data.name,
        subscribedAt: toISOString(data.subscribedAt),
        status: data.status,
        preferences: data.preferences,
    } as Subscriber;
};

export async function getAllArticles(): Promise<Article[]> {
    try {
        await initializeFirebaseClient();
        if (!db) return [];
        
        const articlesCollection = collection(db, 'articles');
        const q = query(articlesCollection, orderBy('publishedAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(convertDocToArticle);
    } catch (error) {
        console.error("Error fetching all articles:", error);
        return [];
    }
}

export async function getPublishedArticles(): Promise<Article[] | { error: string; message: string }> {
    try {
        await initializeFirebaseClient();
        if (!db) throw new Error('Firebase client db non initialisé');
        
        const articlesCollection = collection(db, 'articles');
        const now = new Date();

        const q = query(
            articlesCollection,
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const articles = snapshot.docs
            .map(convertDocToArticle)
            .filter(article => new Date(article.publishedAt) <= now);

        return articles;
    } catch (error: any) {
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            const urlRegex = /(https?:\/\/[^\s]+)/;
            const match = error.message.match(urlRegex);
            const indexCreationUrl = match ? match[0] : null;

            return {
                error: 'missing_index',
                message: indexCreationUrl ? `Index manquant. Veuillez créer l'index Firestore en visitant : ${indexCreationUrl}` : error.message
            };
        }
        return {
            error: 'database_error',
            message: `Une erreur est survenue lors de la récupération des articles: ${error.message}`
        };
    }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    try {
        await initializeFirebaseClient();
        if (!db) return null;
        
        const docRef = doc(db, 'articles', slug);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        
        try {
            await updateDoc(docRef, { views: increment(1) });
        } catch (e) {
            console.error("Failed to increment views:", e);
        }

        return convertDocToArticle(docSnap);
    } catch (error) {
        console.error(`Error fetching article by slug ${slug}:`, error);
        return null;
    }
}

export async function getArticlesByCategory(categorySlug: string, categories: Category[]): Promise<Article[]> {
    try {
        await initializeFirebaseClient();
        if (!db) return [];
        
        const category = categories.find(c => c.slug === categorySlug);
        if (!category) return [];

        const articlesCollection = collection(db, 'articles');
        const now = new Date();
        
        const q = query(articlesCollection,
            where('category', '==', category.name),
            where('status', '==', 'published'),
            where('publishedAt', '<=', now),
            orderBy('publishedAt', 'desc'));
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(convertDocToArticle);
    } catch (error) {
        console.error(`Error fetching articles for category ${categorySlug}:`, error);
        return [];
    }
}

export async function searchArticles(queryText: string): Promise<Article[]> {
    if (!queryText) return [];
    
    const articlesResult = await getPublishedArticles();

    if ('error' in articlesResult) {
        console.error("Search failed due to DB error:", articlesResult.message);
        return [];
    }
    
    return articlesResult.filter(article => 
        article.title.toLowerCase().includes(queryText.toLowerCase()) ||
        article.content.toLowerCase().includes(queryText.toLowerCase())
    );
}

export async function updateArticleComments(slug: string, comments: Comment[]): Promise<boolean> {
    try {
        await initializeFirebaseClient();
        if (!db) return false;
        
        const docRef = doc(db, 'articles', slug);
        await updateDoc(docRef, { comments });
        return true;
    } catch (error) {
        console.error("Failed to update comments in Firestore:", error);
        return false;
    }
}

// Fonctions Admin SDK
let adminDb: FirebaseFirestore.Firestore;
const initializeAdminDb = async () => {
  if (!adminDb) {
    await initializeFirebaseAdmin();
    adminDb = getAdminFirestore();
  }
  return adminDb;
};

async function sendNewsletterNotification(article: Article, isUpdate: boolean = false) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/send-newsletter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                articleTitle: article.title,
                articleSlug: article.slug,
                articleAuthor: article.author,
                isUpdate
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Newsletter envoyée:', result);
        } else {
            console.error('Erreur envoi newsletter:', await response.text());
        }
    } catch (error) {
        console.error('Erreur envoi newsletter:', error);
    }
}

export async function addArticle(article: { 
    title: string, 
    author: string, 
    category: string, 
    content: string, 
    image: { src: string, alt: string },
    scheduledFor?: string 
}): Promise<Article> {
    const db = await initializeAdminDb();
    const articlesCollection = db.collection('articles');
    const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const now = new Date();
    
    let scheduledDate: Date | undefined;
    if (article.scheduledFor) {
        scheduledDate = new Date(article.scheduledFor);
    }

    const isScheduled = scheduledDate && scheduledDate > now;
    const publishedAt = isScheduled ? scheduledDate : now;

    const dataForFirestore: any = {
        title: article.title,
        author: article.author,
        category: article.category,
        content: article.content,
        publishedAt: AdminTimestamp.fromDate(publishedAt || now),
        status: isScheduled ? 'scheduled' : 'published',
        image: {
            id: String(Date.now()),
            src: article.image.src,
            alt: article.image.alt,
            aiHint: 'user uploaded'
        },
        views: 0,
        comments: [],
        viewHistory: [],
    };
    
    if (isScheduled && scheduledDate) {
        dataForFirestore.scheduledFor = AdminTimestamp.fromDate(scheduledDate);
    }

    const docRef = articlesCollection.doc(slug);
    await docRef.set(dataForFirestore);
    
    const createdArticle = {
        ...article,
        slug,
        status: dataForFirestore.status,
        publishedAt: (isScheduled && scheduledDate ? scheduledDate : now).toISOString(),
        scheduledFor: scheduledDate?.toISOString(),
        image: dataForFirestore.image,
        views: 0,
        comments: [],
        viewHistory: [],
    } as Article;
    
    if (!isScheduled) {
        await sendNewsletterNotification(createdArticle, false);
    }
    
    return createdArticle;
}

export async function updateArticle(
    slug: string, 
    data: Partial<Omit<Article, 'slug' | 'scheduledFor'>> & { scheduledFor?: Date | null }
): Promise<Article> {
    const db = await initializeAdminDb();
    const docRef = db.collection('articles').doc(slug);

    const currentDoc = await docRef.get();
    if (!currentDoc.exists) {
        throw new Error("Article not found");
    }

    const dataForFirestore: { [key: string]: any } = { ...data };

    if (data.publishedAt) {
        dataForFirestore.publishedAt = AdminTimestamp.fromDate(new Date(data.publishedAt));
    }

    if (data.hasOwnProperty('scheduledFor')) {
        const scheduledDate = data.scheduledFor;
        if (scheduledDate && scheduledDate instanceof Date) {
            const now = new Date();
            dataForFirestore.scheduledFor = AdminTimestamp.fromDate(scheduledDate);
            dataForFirestore.publishedAt = AdminTimestamp.fromDate(scheduledDate);
            dataForFirestore.status = scheduledDate > now ? 'scheduled' : 'published';
        } else {
            dataForFirestore.scheduledFor = FieldValue.delete();
            dataForFirestore.status = 'published';
            dataForFirestore.publishedAt = AdminTimestamp.now();
        }
    }
    
    if (data.image) {
        dataForFirestore.image = {
            id: data.image.id || String(Date.now()),
            src: data.image.src,
            alt: data.image.alt,
            aiHint: data.image.aiHint || 'user uploaded'
        }
    }

    await docRef.update(dataForFirestore);
    
    const updatedDocSnap = await docRef.get();
    const updatedData = updatedDocSnap.data()!;
    const updatedArticle = {
        slug: updatedDocSnap.id,
        title: updatedData.title,
        author: updatedData.author,
        category: updatedData.category,
        publishedAt: updatedData.publishedAt.toDate().toISOString(),
        status: updatedData.status,
        scheduledFor: updatedData.scheduledFor ? updatedData.scheduledFor.toDate().toISOString() : undefined,
        image: updatedData.image,
        content: updatedData.content,
        views: updatedData.views,
        comments: updatedData.comments,
        viewHistory: updatedData.viewHistory,
    } as Article;
    
    if (updatedArticle.status === 'published') {
        await sendNewsletterNotification(updatedArticle, true);
    }
    
    return updatedArticle;
}

export async function deleteArticle(slug: string): Promise<boolean> {
    const db = await initializeAdminDb();
    const docRef = db.collection('articles').doc(slug);
    try {
        await docRef.delete();
        return true;
    } catch(e) {
        console.error("Error deleting article:", e);
        return false;
    }
}

export async function addSubscriber(subscriberData: {
    email: string;
    name?: string;
    preferences?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      categories: string[];
    };
}): Promise<Subscriber> {
    await initializeFirebaseClient();
    if (!db) throw new Error('Firebase client non initialisé');
    
    const subscribersCollection = collection(db, 'subscribers');
    
    const q = query(subscribersCollection, where('email', '==', subscriberData.email));
    const existingSnapshot = await getDocs(q);
    
    if (!existingSnapshot.empty) {
        throw new Error('Cette adresse email est déjà abonnée');
    }

    const newSubscriber = {
        ...subscriberData,
        name: subscriberData.name || '',
        subscribedAt: new Date(),
        status: 'active' as const,
        preferences: subscriberData.preferences || {
            frequency: 'weekly' as const,
            categories: ['Technologie', 'Actualité']
        }
    };

    const docRef = await addDoc(subscribersCollection, newSubscriber);
    const createdDoc = await getDoc(docRef);
    
    return convertDocToSubscriber(createdDoc);
}

export async function getSubscribers(): Promise<Subscriber[]> {
    try {
        await initializeFirebaseClient();
        if (!db) return [];
        
        const subscribersCollection = collection(db, 'subscribers');
        const snapshot = await getDocs(query(subscribersCollection, orderBy('subscribedAt', 'desc')));
        return snapshot.docs.map(convertDocToSubscriber);
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        return [];
    }
}

export async function updateSubscriberStatus(
    subscriberId: string, 
    status: 'active' | 'unsubscribed'
): Promise<void> {
    await initializeFirebaseClient();
    if (!db) throw new Error('Firebase client non initialisé');
    
    const docRef = doc(db, 'subscribers', subscriberId);
    await updateDoc(docRef, { status });
}

export async function deleteSubscriber(subscriberId: string): Promise<void> {
    await initializeFirebaseClient();
    if (!db) throw new Error('Firebase client non initialisé');
    
    const docRef = doc(db, 'subscribers', subscriberId);
    await deleteDoc(docRef);
}

export async function getSubscribersCount(): Promise<{
    total: number;
    active: number;
    unsubscribed: number;
}> {
    try {
        const subscribers = await getSubscribers();
        const active = subscribers.filter(s => s.status === 'active').length;
        const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed').length;
        
        return {
            total: subscribers.length,
            active,
            unsubscribed
        };
    } catch (error) {
        console.error("Error getting subscribers count:", error);
        return { total: 0, active: 0, unsubscribed: 0 };
    }
}

export async function getAdminArticles(): Promise<Article[]> {
    const db = await initializeAdminDb();
    const articlesCollection = db.collection('articles');
    const q = articlesCollection.orderBy('publishedAt', 'desc');
    const snapshot = await q.get();
    
    const convertAdminDocToArticle = (doc: FirebaseFirestore.DocumentSnapshot): Article => {
        const data = doc.data() as any;
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
    };
    return snapshot.docs.map(convertAdminDocToArticle);
}