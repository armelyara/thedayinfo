

import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from './auth';
import { revalidatePath } from 'next/cache';
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
    publicationDate: string;
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
    const data = doc.data() as Omit<Article, 'slug'>;
    return {
        slug: doc.id,
        ...data,
        publicationDate: (data.publicationDate as any as Timestamp).toDate().toISOString(),
        scheduledFor: data.scheduledFor ? (data.scheduledFor as any as Timestamp).toDate().toISOString() : undefined,
    } as Article;
}

export async function getAllArticles(): Promise<Article[]> {
    try {
        const db = await initializeDb();
        const articlesCollection = db.collection('articles');
        const q = articlesCollection.orderBy('publicationDate', 'desc');
        const snapshot = await q.get();
        return snapshot.docs.map(convertDocToArticle);
    } catch (error) {
        console.error("Error fetching all articles:", error);
        return [];
    }
}

export async function getPublishedArticles(): Promise<Article[] | { error: 'missing_index', message: string }> {
    try {
        const db = await initializeDb();
        const articlesCollection = db.collection('articles');
        const now = new Date();
        // Simplified query to avoid requiring a composite index.
        const q = articlesCollection
            .where('status', '==', 'published')
            .where('publicationDate', '<=', now);
            // .orderBy('publicationDate', 'desc'); // This part requires the index.

        const snapshot = await q.get();
        // We will sort the results in code instead of in the query.
        const articles = snapshot.docs.map(convertDocToArticle);
        articles.sort((a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime());
        return articles;
    } catch (error) {
        // Firestore error code 9 is FAILED_PRECONDITION, which often means a missing index.
        if ((error as any).code === 9) { 
             console.error("Firestore query failed. This likely means the required composite index is not yet built. Please create it in the Firebase console.");
             return {
                error: 'missing_index',
                message: (error as any).details || 'The query requires an index. Please create it in the Firebase console.'
             }
        }
        console.error("Error fetching published articles:", error);
        // For other errors, we can throw or return a generic error
        throw error;
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
            .where('publicationDate', '<=', now)
            .orderBy('publicationDate', 'desc');
        
        const snapshot = await q.get();
        return snapshot.docs.map(convertDocToArticle);
    } catch (error) {
        console.error(`Error fetching articles for category ${categorySlug}:`, error);
        return [];
    }
}

export async function searchArticles(queryText: string): Promise<Article[]> {
    if (!queryText) return [];
    // This is still a client-side-like implementation on the server side.
    // For a real app, a full-text search engine like Algolia/Elasticsearch would be better.
    const articlesResult = await getPublishedArticles();
    if ('error' in articlesResult) {
      return [];
    }
    
    return articlesResult.filter(article => 
        article.title.toLowerCase().includes(queryText.toLowerCase()) ||
        article.content.toLowerCase().includes(queryText.toLowerCase())
    );
}

export async function addArticle(article: { title: string, author: string, category: string, content: string, scheduledFor?: Date }): Promise<Article> {
    const db = await initializeDb();
    const articlesCollection = db.collection('articles');
    const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const now = new Date();
    const scheduledDate = article.scheduledFor;
  
    const isScheduled = scheduledDate && scheduledDate > now;
    const publicationDate = isScheduled ? scheduledDate : now;

    const dataForFirestore: any = {
      title: article.title,
      author: article.author,
      category: article.category,
      content: article.content,
      publicationDate: publicationDate,
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
    
    if (isScheduled) {
        dataForFirestore.scheduledFor = scheduledDate;
    }

    const docRef = articlesCollection.doc(slug);
    await docRef.set(dataForFirestore);
    
    const createdArticleDoc = await docRef.get();
    if (!createdArticleDoc.exists) {
        throw new Error("Failed to create and retrieve article.");
    }
    return convertDocToArticle(createdArticleDoc);
};

export async function updateArticle(slug: string, data: Partial<Omit<Article, 'slug' | 'scheduledFor'>> & { scheduledFor?: Date | null }): Promise<Article> {
    const db = await initializeDb();
    const docRef = db.collection('articles').doc(slug);

    const dataForFirestore: { [key: string]: any } = { ...data };

    if (data.hasOwnProperty('scheduledFor')) {
        const { firestore } = await import('firebase-admin');
        const scheduledDate = data.scheduledFor;
        if (scheduledDate) {
            const now = new Date();
            dataForFirestore.scheduledFor = scheduledDate;
            dataForFirestore.publicationDate = scheduledDate;
            dataForFirestore.status = scheduledDate > now ? 'scheduled' : 'published';
        } else {
            // Un-scheduling: publish now and remove scheduledFor field
            dataForFirestore.scheduledFor = firestore.FieldValue.delete();
            dataForFirestore.status = 'published';
            dataForFirestore.publicationDate = new Date();
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
        revalidatePath(`/article/${slug}`);
        revalidatePath('/admin');
        return true;
    } catch (error) {
        console.error("Failed to update comments in Firestore:", error);
        return false;
    }
}

// Seeding function
const initialArticles = [
  {
    "slug": "le-futur-de-lia-une-nouvelle-ere-d-innovation",
    "title": "Le Futur de L'IA : Une Nouvelle Ère d'Innovation",
    "author": "L'Auteur",
    "category": "Technologie",
    "publicationDate": "2024-05-01T10:00:00.000Z",
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
    "publicationDate": "2024-05-15T10:00:00.000Z",
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
    "publicationDate": "2024-06-01T10:00:00.000Z",
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
                    publicationDate: new Date(data.publicationDate),
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

export async function getAdminArticles(): Promise<Article[]> {
  const db = await initializeDb();
  const articlesCollection = db.collection('articles');
  const q = articlesCollection.orderBy('publicationDate', 'desc');
  const snapshot = await q.get();
  return snapshot.docs.map(convertDocToArticle);
}
