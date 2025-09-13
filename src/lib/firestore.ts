
'use server';

import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, addDoc, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';

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

const articlesCollection = collection(db, 'articles');

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestamps = (docData: any) => {
    const data = { ...docData };
    if (data.publicationDate && data.publicationDate instanceof Timestamp) {
        data.publicationDate = data.publicationDate.toDate().toISOString();
    }
    if (data.scheduledFor && data.scheduledFor instanceof Timestamp) {
        data.scheduledFor = data.scheduledFor.toDate().toISOString();
    }
    return data as Article;
};

export async function getAllArticles(): Promise<Article[]> {
    const q = query(articlesCollection, orderBy('publicationDate', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => convertTimestamps({ slug: doc.id, ...doc.data() }));
}

export async function getPublishedArticles(): Promise<Article[]> {
    const now = new Date();
    const q = query(
        articlesCollection,
        where('status', '==', 'published'),
        where('publicationDate', '<=', now.toISOString()),
        orderBy('publicationDate', 'desc')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => convertTimestamps({ slug: doc.id, ...doc.data() }));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    const docRef = doc(db, 'articles', slug);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return null;
    }
    return convertTimestamps({ slug: docSnap.id, ...docSnap.data() });
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
    const categoriesList: Category[] = [
        { name: 'Technologie', slug: 'technologie' },
        { name: 'Actualité', slug: 'actualite' },
    ];
    const category = categoriesList.find(c => c.slug === categorySlug);
    if (!category) return [];

    const now = new Date();
    const q = query(
        articlesCollection,
        where('category', '==', category.name),
        where('status', '==', 'published'),
        where('publicationDate', '<=', now.toISOString()),
        orderBy('publicationDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => convertTimestamps({ slug: doc.id, ...doc.data() }));
}

export async function searchArticles(queryText: string): Promise<Article[]> {
    if (!queryText) return [];
    const allArticles = await getPublishedArticles();
    
    // Firestore doesn't support full-text search out of the box on the client SDK for server-side rendering easily.
    // For a small number of articles, filtering after fetching is acceptable.
    // For a larger scale app, a dedicated search service like Algolia or Elasticsearch is recommended.
    return allArticles.filter(article => 
        article.title.toLowerCase().includes(queryText.toLowerCase()) ||
        article.content.toLowerCase().includes(queryText.toLowerCase())
    );
}

export async function addArticle(article: Omit<Article, 'slug' | 'publicationDate' | 'image' | 'views' | 'comments' | 'status' | 'viewHistory'> & { scheduledFor?: string }): Promise<Article> {
    const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const now = new Date();
    const scheduledDate = article.scheduledFor ? new Date(article.scheduledFor) : null;
  
    const isScheduled = scheduledDate && scheduledDate > now;
  
    const newArticleData = {
      ...article,
      publicationDate: isScheduled ? Timestamp.fromDate(scheduledDate) : Timestamp.fromDate(now),
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
    
    const docRef = doc(db, 'articles', slug);
    await setDoc(docRef, newArticleData);
    
    return {
        ...newArticleData,
        slug,
        publicationDate: (isScheduled ? scheduledDate ?? now : now).toISOString(),
    };
};

export async function updateArticle(slug: string, data: Partial<Article>): Promise<Article> {
    const docRef = doc(db, 'articles', slug);
    await updateDoc(docRef, data);
    const updatedArticle = await getArticleBySlug(slug);
    if (!updatedArticle) throw new Error("Failed to retrieve updated article");
    return updatedArticle;
}

export async function deleteArticle(slug: string): Promise<boolean> {
    const docRef = doc(db, 'articles', slug);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return false;
    }
    await deleteDoc(docRef);
    return true;
}


export async function updateArticleComments(slug: string, comments: Comment[]): Promise<boolean> {
    const docRef = doc(db, 'articles', slug);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return false;
    }
    await updateDoc(docRef, { comments });
    return true;
}
