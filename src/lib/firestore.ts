
'use server';

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

// Initialize Firebase Admin SDK
try {
    if (!getApps().length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
        initializeApp({
            credential: cert(serviceAccount)
        });
    }
} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK", error);
}

const db = getFirestore();
const articlesCollection = db.collection('articles');

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestamps = (docData: any) => {
    const data = { ...docData };
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        } else if (key === 'scheduledFor' && data[key]) {
            data[key] = (data[key] as Timestamp).toDate().toISOString();
        }
    }
    return data as Article;
}


export async function getAllArticles(): Promise<Article[]> {
    const snapshot = await articlesCollection.orderBy('publicationDate', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => convertTimestamps(doc.data()));
}

export async function getPublishedArticles(): Promise<Article[]> {
    const now = new Date();
    const snapshot = await articlesCollection
        .where('status', '==', 'published')
        .where('publicationDate', '<=', now.toISOString())
        .orderBy('publicationDate', 'desc')
        .get();

    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => convertTimestamps(doc.data()));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    const snapshot = await articlesCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    return convertTimestamps(doc.data());
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
    // This assumes categories are stored by name in the articles.
    // In a real app you might store slug as well.
    const categories: Category[] = [
        { name: 'Technologie', slug: 'technologie' },
        { name: 'Actualité', slug: 'actualite' },
    ];
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return [];

    const now = new Date();
    const snapshot = await articlesCollection
        .where('category', '==', category.name)
        .where('status', '==', 'published')
        .where('publicationDate', '<=', now.toISOString())
        .orderBy('publicationDate', 'desc')
        .get();
    
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => convertTimestamps(doc.data()));
}

export async function searchArticles(query: string): Promise<Article[]> {
    if (!query) return [];
    const allArticles = await getPublishedArticles();
    
    // Firestore doesn't support full-text search out of the box.
    // For a small number of articles, client-side filtering is acceptable.
    // For a larger scale app, a dedicated search service like Algolia or Elasticsearch is recommended.
    return allArticles.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase())
    );
}

export async function addArticle(article: Omit<Article, 'slug' | 'publicationDate' | 'image' | 'views' | 'comments' | 'status' | 'viewHistory'> & { scheduledFor?: string }): Promise<Article> {
    const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const now = new Date();
    const scheduledDate = article.scheduledFor ? new Date(article.scheduledFor) : null;
  
    const isScheduled = scheduledDate && scheduledDate > now;
  
    const newArticle: Article = {
      ...article,
      slug,
      publicationDate: (isScheduled ? scheduledDate : now).toISOString(),
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
    
    await articlesCollection.doc(slug).set(newArticle);
    return newArticle;
};

export async function updateArticle(slug: string, data: Partial<Omit<Article, 'slug' | 'publicationDate' | 'image' | 'status' | 'views' | 'comments' | 'viewHistory'>> & { scheduledFor?: string }): Promise<Article> {
    const existingArticle = await getArticleBySlug(slug);
    if (!existingArticle) {
      throw new Error("Article not found");
    }
  
    const newSlug = data.title ? data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : slug;
  
    const now = new Date();
    const scheduledDate = data.scheduledFor ? new Date(data.scheduledFor) : (existingArticle.scheduledFor ? new Date(existingArticle.scheduledFor) : null);
  
    const isScheduled = scheduledDate && scheduledDate > now;
    
    const updatedData = {
      ...data,
      slug: newSlug,
      status: isScheduled ? 'scheduled' : 'published',
      publicationDate: (isScheduled && scheduledDate ? scheduledDate : new Date(existingArticle.publicationDate)).toISOString(),
      scheduledFor: data.scheduledFor || existingArticle.scheduledFor,
    };
  
    const docRef = articlesCollection.doc(slug);
    await docRef.update(updatedData);

    // If slug changed, we need to rename the document
    if (newSlug !== slug) {
        const newDocRef = articlesCollection.doc(newSlug);
        const currentDoc = await docRef.get();
        await newDocRef.set(currentDoc.data()!);
        await docRef.delete();
    }
  
    const updatedArticle = await getArticleBySlug(newSlug);
    if (!updatedArticle) throw new Error("Failed to retrieve updated article");

    return updatedArticle;
}

export async function deleteArticle(slug: string): Promise<boolean> {
    const snapshot = await articlesCollection.where('slug', '==', slug).limit(1).get();
    if (snapshot.empty) {
        return false;
    }
    await snapshot.docs[0].ref.delete();
    return true;
}

export async function updateArticleComments(slug: string, comments: Comment[]): Promise<Article> {
    const docRef = articlesCollection.doc(slug);
    await docRef.update({ comments });
    const updatedArticle = await getArticleBySlug(slug);
    if (!updatedArticle) throw new Error("Failed to retrieve updated article");
    return updatedArticle;
}
