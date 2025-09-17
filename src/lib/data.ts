import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from './auth';
import type { Timestamp } from 'firebase-admin/firestore';

// Data Types
export type Comment = {
    id: number;
    author: string;
    text: string;
    avatar: string;
};
  
export type ViewHistory = {
    date: string;
    views: number;
};
  
export type Article = {
    slug: string;
    title: string;
    author: string;
    category: string;
    publishedAt: string; // UNIFIÉ - plus de publicationDate
    status: 'published' | 'scheduled';
    scheduledFor?: string;
    image: {
      id: string;
      src: string;
      alt: string;
      aiHint: string;
    };
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

// Use the admin SDK
let db: FirebaseFirestore.Firestore;
const initializeDb = async () => {
  if (!db) {
    await initializeFirebaseAdmin();
    db = getFirestore();
  }
  return db;
};

const convertDocToArticle = (doc: FirebaseFirestore.DocumentSnapshot): Article => {
    const data = doc.data() as any;
    
    // NETTOYÉ - Plus de gestion de publicationDate, uniquement publishedAt
    const publishedAt = data.publishedAt;
    const scheduledFor = data.scheduledFor;

    return {
        slug: doc.id,
        title: data.title,
        author: data.author,
        category: data.category,
        publishedAt: publishedAt instanceof Date 
            ? publishedAt.toISOString() 
            : (publishedAt?.toDate?.() || new Date(publishedAt)).toISOString(),
        status: data.status,
        scheduledFor: scheduledFor 
            ? (scheduledFor instanceof Date 
                ? scheduledFor.toISOString() 
                : (scheduledFor?.toDate?.() || new Date(scheduledFor)).toISOString())
            : undefined,
        image: data.image,
        content: data.content,
        views: data.views || 0,
        comments: data.comments || [],
        viewHistory: data.viewHistory || [],
    } as Article;
};

const convertDocToSubscriber = (doc: FirebaseFirestore.DocumentSnapshot): Subscriber => {
    const data = doc.data() as any;
    return {
        id: doc.id,
        email: data.email,
        name: data.name,
        subscribedAt: data.subscribedAt instanceof Date 
            ? data.subscribedAt.toISOString()
            : (data.subscribedAt?.toDate?.() || new Date(data.subscribedAt)).toISOString(),
        status: data.status,
        preferences: data.preferences,
    } as Subscriber;
};

export async function getAllArticles(): Promise<Article[]> {
    try {
        const db = await initializeDb();
        const articlesCollection = db.collection('articles');
        const q = articlesCollection.orderBy('publishedAt', 'desc');
        const snapshot = await q.get();
        return snapshot.docs.map(convertDocToArticle);
    } catch (error) {
        console.error("Error fetching all articles:", error);
        return [];
    }
}

export async function getPublishedArticles(): Promise<Article[]> {
    try {
        const db = await initializeDb();
        const articlesCollection = db.collection('articles');
        const now = new Date();
        
        const q = articlesCollection
            .where('status', '==', 'published')
            .where('publishedAt', '<=', now);

        const snapshot = await q.get();
        
        const articles = snapshot.docs.map(convertDocToArticle);
        articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
        return articles;
    } catch (error) {
        console.error("Error fetching published articles:", error);
        return [];
    }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    try {
        const db = await initializeDb();
        const docRef = db.collection('articles').doc(slug);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return null;
        }
        const article = convertDocToArticle(docSnap);

        // Increment views - this is a server-side effect
        try {
            const { firestore } = await import('firebase-admin');
            await docRef.update({ views: firestore.FieldValue.increment(1) });
        } catch (e) {
            console.error("Failed to increment views", e);
        }

        return article;
    } catch (error) {
        console.error(`Error fetching article by slug ${slug}:`, error);
        return null;
    }
}

export async function getArticlesByCategory(categorySlug: string, categories: Category[]): Promise<Article[]> {
    try {
        const db = await initializeDb();
        const articlesCollection = db.collection('articles');
        const category = categories.find(c => c.slug === categorySlug);
        if (!category) return [];

        const now = new Date();
        
        const q = articlesCollection
            .where('category', '==', category.name)
            .where('status', '==', 'published')
            .where('publishedAt', '<=', now);
        
        const snapshot = await q.get();
        
        const articles = snapshot.docs.map(convertDocToArticle);
        articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
        return articles;
    } catch (error) {
        console.error(`Error fetching articles for category ${categorySlug}:`, error);
        return [];
    }
}

export async function searchArticles(queryText: string): Promise<Article[]> {
    if (!queryText) return [];
    
    const articlesResult = await getPublishedArticles();
    
    return articlesResult.filter(article => 
        article.title.toLowerCase().includes(queryText.toLowerCase()) ||
        article.content.toLowerCase().includes(queryText.toLowerCase())
    );
}

export async function addArticle(article: { 
    title: string, 
    author: string, 
    category: string, 
    content: string, 
    scheduledFor?: string 
}): Promise<Article> {
    const db = await initializeDb();
    const articlesCollection = db.collection('articles');
    const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const now = new Date();
    
    // Gérer la date de programmation
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
        publishedAt: publishedAt,
        status: isScheduled ? 'scheduled' : 'published',
        image: {
            id: String(Date.now()),
            src: `https://picsum.photos/seed/${slug}/600/400`,
            alt: article.title,
            aiHint: 'placeholder image'
        },
        views: 0,
        comments: [],
        viewHistory: [],
    };
    
    if (isScheduled && scheduledDate) {
        dataForFirestore.scheduledFor = scheduledDate;
    }

    const docRef = articlesCollection.doc(slug);
    await docRef.set(dataForFirestore);
    
    const createdArticleDoc = await docRef.get();
    if (!createdArticleDoc.exists) {
        throw new Error("Failed to create and retrieve article.");
    }
    return convertDocToArticle(createdArticleDoc);
}

export async function updateArticle(
    slug: string, 
    data: Partial<Omit<Article, 'slug' | 'scheduledFor'>> & { scheduledFor?: string }
): Promise<Article> {
    const db = await initializeDb();
    const docRef = db.collection('articles').doc(slug);

    const dataForFirestore: { [key: string]: any } = { ...data };

    // Gérer la conversion des dates
    if (data.publishedAt) {
        dataForFirestore.publishedAt = new Date(data.publishedAt);
    }

    if (data.hasOwnProperty('scheduledFor')) {
        const { firestore } = await import('firebase-admin');
        const scheduledDateStr = data.scheduledFor;
        
        if (scheduledDateStr) {
            const scheduledDate = new Date(scheduledDateStr);
            const now = new Date();
            dataForFirestore.scheduledFor = scheduledDate;
            dataForFirestore.publishedAt = scheduledDate;
            dataForFirestore.status = scheduledDate > now ? 'scheduled' : 'published';
        } else {
            // Un-scheduling: publish now and remove scheduledFor field
            dataForFirestore.scheduledFor = firestore.FieldValue.delete();
            dataForFirestore.status = 'published';
            dataForFirestore.publishedAt = new Date();
        }
    }
    
    await docRef.update(dataForFirestore);
    
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) throw new Error("Failed to retrieve updated article");

    return convertDocToArticle(updatedDoc);
}

export async function deleteArticle(slug: string): Promise<boolean> {
    const db = await initializeDb();
    const docRef = db.collection('articles').doc(slug);
    try {
        await docRef.delete();
        return true;
    } catch(e) {
        console.error("Error deleting article:", e);
        return false;
    }
}

export async function updateArticleComments(slug: string, comments: Comment[]): Promise<boolean> {
    const db = await initializeDb();
    const docRef = db.collection('articles').doc(slug);
    try {
        await docRef.update({ comments });
        return true;
    } catch (error) {
        console.error("Failed to update comments in Firestore:", error);
        return false;
    }
}

// Fonctions pour les abonnés
export async function addSubscriber(subscriberData: {
    email: string;
    name?: string;
    preferences?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      categories: string[];
    };
}): Promise<Subscriber> {
    const db = await initializeDb();
    const subscribersCollection = db.collection('subscribers');
    
    // Vérifier si l'email existe déjà
    const existingQuery = subscribersCollection.where('email', '==', subscriberData.email);
    const existingSnapshot = await existingQuery.get();
    
    if (!existingSnapshot.empty) {
        throw new Error('Cette adresse email est déjà abonnée');
    }

    const newSubscriber = {
        email: subscriberData.email,
        name: subscriberData.name || '',
        subscribedAt: new Date(),
        status: 'active' as const,
        preferences: subscriberData.preferences || {
            frequency: 'weekly' as const,
            categories: ['Technologie', 'Actualité']
        }
    };

    const docRef = await subscribersCollection.add(newSubscriber);
    const createdDoc = await docRef.get();
    
    return convertDocToSubscriber(createdDoc);
}

export async function getSubscribers(): Promise<Subscriber[]> {
    try {
        const db = await initializeDb();
        const subscribersCollection = db.collection('subscribers');
        const snapshot = await subscribersCollection.orderBy('subscribedAt', 'desc').get();
        
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
    const db = await initializeDb();
    await db.collection('subscribers').doc(subscriberId).update({ status });
}

export async function deleteSubscriber(subscriberId: string): Promise<void> {
    const db = await initializeDb();
    await db.collection('subscribers').doc(subscriberId).delete();
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
    const db = await initializeDb();
    const articlesCollection = db.collection('articles');
    const q = articlesCollection.orderBy('publishedAt', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map(convertDocToArticle);
}

// Données initiales pour le seeding - CORRIGÉ publishedAt
const initialArticles = [
    {
        "slug": "le-futur-de-lia-une-nouvelle-ere-d-innovation",
        "title": "Le Futur de L'IA : Une Nouvelle Ère d'Innovation",
        "author": "L'Auteur",
        "category": "Technologie",
        "publishedAt": "2024-05-01T10:00:00.000Z",
        "status": "published" as const,
        "image": { "id": "1", "src": "https://picsum.photos/seed/1/600/400", "alt": "Visualisation abstraite de l'IA", "aiHint": "abstract AI" },
        "content": "L'intelligence artificielle est en train de remodeler notre monde. De la médecine à la finance, ses applications sont infinies. Cet article explore les avancées récentes et ce que l'avenir nous réserve.",
        "views": 1500,
        "comments": [],
        "viewHistory": [
            { "date": "2024-05-01T00:00:00.000Z", "views": 800 },
            { "date": "2024-06-01T00:00:00.000Z", "views": 700 }
        ]
    },
    {
        "slug": "exploration-spatiale-les-prochaines-frontieres",
        "title": "Exploration Spatiale : Les Prochaines Frontières",
        "author": "L'Auteur",
        "category": "Actualité",
        "publishedAt": "2024-05-15T10:00:00.000Z",
        "status": "published" as const,
        "image": { "id": "2", "src": "https://picsum.photos/seed/2/600/400", "alt": "Une nébuleuse colorée dans l'espace lointain", "aiHint": "nebula space" },
        "content": "Avec les récentes missions vers Mars et au-delà, l'humanité est à l'aube d'une nouvelle ère d'exploration spatiale. Découvrez les défis et les merveilles qui nous attendent.",
        "views": 850,
        "comments": [],
        "viewHistory": [
            { "date": "2024-05-01T00:00:00.000Z", "views": 400 },
            { "date": "2024-06-01T00:00:00.000Z", "views": 450 }
        ]
    },
    {
        "slug": "la-revolution-quantique-est-elle-pour-demain",
        "title": "La Révolution Quantique est-elle pour Demain ?",
        "author": "L'Auteur",
        "category": "Technologie",
        "publishedAt": "2024-06-01T10:00:00.000Z",
        "status": "published" as const,
        "image": { "id": "6", "src": "https://picsum.photos/seed/6/600/400", "alt": "Représentation abstraite de bits quantiques", "aiHint": "quantum computing" },
        "content": "L'informatique quantique promet de résoudre des problèmes aujourd'hui insolubles. Mais où en sommes-nous réellement ? Cet article fait le point sur les avancées et les obstacles de cette technologie de rupture.",
        "views": 2300,
        "comments": [],
        "viewHistory": [
            { "date": "2024-06-01T00:00:00.000Z", "views": 1200 },
            { "date": "2024-07-01T00:00:00.000Z", "views": 1100 }
        ]
    }
];

export async function seedInitialArticles() {
    const db = await initializeDb();
    const articlesCollection = db.collection('articles');
    const articlesSnapshot = await articlesCollection.limit(1).get();
    if (articlesSnapshot.empty) {
        console.log('No articles found, seeding database...');
        try {
            const batch = db.batch();
            initialArticles.forEach(article => {
                const docRef = articlesCollection.doc(article.slug);
                const { slug, ...data } = article;
                const dataForFirestore = {
                    ...data,
                    publishedAt: new Date(data.publishedAt),
                };
                batch.set(docRef, dataForFirestore);
            });
            await batch.commit();
            console.log('Database seeded successfully.');
        } catch (error) {
            console.error("Error seeding database:", error);
        }
    }
}