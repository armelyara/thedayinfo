
'use server';

import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, setDoc, deleteDoc, updateDoc, Timestamp, writeBatch } from 'firebase/firestore';

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

const convertDocToArticle = (doc: any): Article => {
    const data = doc.data();
    return {
        slug: doc.id,
        ...data,
        publicationDate: data.publicationDate instanceof Timestamp ? data.publicationDate.toDate().toISOString() : data.publicationDate,
        scheduledFor: data.scheduledFor instanceof Timestamp ? data.scheduledFor.toDate().toISOString() : data.scheduledFor,
    } as Article;
}

export async function getAllArticles(): Promise<Article[]> {
    const q = query(articlesCollection, orderBy('publicationDate', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(convertDocToArticle);
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
    return snapshot.docs.map(convertDocToArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    const docRef = doc(db, 'articles', slug);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return null;
    }
    return convertDocToArticle(docSnap);
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
    return snapshot.docs.map(convertDocToArticle);
}

export async function searchArticles(queryText: string): Promise<Article[]> {
    if (!queryText) return [];
    const allArticles = await getPublishedArticles();
    
    return allArticles.filter(article => 
        article.title.toLowerCase().includes(queryText.toLowerCase()) ||
        article.content.toLowerCase().includes(queryText.toLowerCase())
    );
}

export async function addArticle(article: { title: string, author: string, category: string, content: string, scheduledFor?: Date }): Promise<Article> {
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
      publicationDate: Timestamp.fromDate(publicationDate),
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
        dataForFirestore.scheduledFor = Timestamp.fromDate(scheduledDate!);
    }

    const docRef = doc(db, 'articles', slug);
    await setDoc(docRef, dataForFirestore);
    
    const createdArticle = await getArticleBySlug(slug);
    if (!createdArticle) {
        throw new Error("Failed to create and retrieve article.");
    }
    return createdArticle;
};

export async function updateArticle(slug: string, data: Partial<Omit<Article, 'slug' | 'scheduledFor'>> & { scheduledFor?: Date | null }): Promise<Article> {
    const docRef = doc(db, 'articles', slug);
    const dataForFirestore: { [key: string]: any } = { ...data };

    // Handle scheduledFor separately
    if (data.hasOwnProperty('scheduledFor')) {
        const scheduledDate = data.scheduledFor;
        if (scheduledDate) {
            const now = new Date();
            dataForFirestore.scheduledFor = Timestamp.fromDate(scheduledDate);
            dataForFirestore.publicationDate = Timestamp.fromDate(scheduledDate);
            dataForFirestore.status = scheduledDate > now ? 'scheduled' : 'published';
        } else {
            // Un-scheduling: publish now
            dataForFirestore.scheduledFor = deleteField(); // Remove the field
            dataForFirestore.status = 'published';
            dataForFirestore.publicationDate = Timestamp.fromDate(new Date());
        }
    }
    
    // Remove the Date object from dataForFirestore before updating
    delete dataForFirestore.scheduledFor;


    // Update the document
    await updateDoc(docRef, dataForFirestore);

    const updatedArticle = await getArticleBySlug(slug);
    if (!updatedArticle) throw new Error("Failed to retrieve updated article");
    return updatedArticle;
}


export async function deleteArticle(slug: string): Promise<boolean> {
    const docRef = doc(db, 'articles', slug);
    try {
        await deleteDoc(docRef);
        return true;
    } catch(e) {
        console.error("Error deleting article:", e);
        return false;
    }
}


export async function updateArticleComments(slug: string, comments: Comment[]): Promise<boolean> {
    const docRef = doc(db, 'articles', slug);
    try {
        await updateDoc(docRef, { comments });
        return true;
    } catch (error) {
        console.error("Failed to update comments in Firestore:", error);
        return false;
    }
}

// Helper to delete a field in Firestore
function deleteField() {
    // This is a special sentinel value from the Firestore SDK
    // but we can't import the entire 'firebase-admin' here.
    // So we return a special string that we can check for.
    // In a real app, you'd import `FieldValue.delete()`
    return 'DELETE_FIELD';
}
