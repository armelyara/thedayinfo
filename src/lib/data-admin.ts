// src/lib/data-admin.ts
'use server';

import { getFirestore as getAdminFirestore, Timestamp as AdminTimestamp, FieldValue } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from './auth';
import type { Article, Profile, Subscriber } from './data-types';

let adminDb: FirebaseFirestore.Firestore;
const initializeAdminDb = async () => {
  if (!adminDb) {
    await initializeFirebaseAdmin();
    adminDb = getAdminFirestore();
  }
  return adminDb;
};

// Fonction pour déclencher l'envoi de newsletter
async function sendNewsletterNotification(
    article: Article, 
    isUpdate: boolean = false
) {
    // Ensure this runs in an environment where NEXT_PUBLIC_SITE_URL is available
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';
    try {
        const response = await fetch(`${siteUrl}/api/send-newsletter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                articleTitle: article.title,
                articleSlug: article.slug,
                articleAuthor: article.author,
                isUpdate
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Newsletter sent:', result);
        } else {
            console.error('Error sending newsletter:', await response.text());
        }
    } catch (error) {
        console.error('Fetch error sending newsletter:', error);
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
        publishedAt: AdminTimestamp.fromDate(publishedAt),
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
    
    const createdArticle: Article = {
        ...article,
        slug,
        status: dataForFirestore.status,
        publishedAt: publishedAt.toISOString(),
        scheduledFor: scheduledDate?.toISOString(),
        image: dataForFirestore.image,
        views: 0,
        comments: [],
        viewHistory: [],
    };
    
    if (!isScheduled) {
        await sendNewsletterNotification(createdArticle, false);
    }
    
    return createdArticle;
}

export async function updateArticle(
    slug: string, 
    data: Partial<Omit<Article, 'slug' | 'scheduledFor'>> & { scheduledFor?: Date | string | null }
): Promise<Article> {
    const db = await initializeAdminDb();
    const docRef = db.collection('articles').doc(slug);

    const currentDoc = await docRef.get();
    if (!currentDoc.exists) {
        throw new Error("Article not found");
    }

    const dataForFirestore: { [key: string]: any } = { ...data };

    if (data.publishedAt && typeof data.publishedAt === 'string') {
        dataForFirestore.publishedAt = AdminTimestamp.fromDate(new Date(data.publishedAt));
    }

    if (data.hasOwnProperty('scheduledFor')) {
        const scheduledValue = data.scheduledFor;
        if (scheduledValue) {
            const scheduledDate = new Date(scheduledValue as any);
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
    
    // Remove slug from data to prevent trying to update it
    delete (dataForFirestore as any).slug;

    await docRef.update(dataForFirestore);
    
    const updatedDocSnap = await docRef.get();
    const updatedData = updatedDocSnap.data()!;
    const updatedArticle: Article = {
        slug: updatedDocSnap.id,
        title: updatedData.title,
        author: updatedData.author,
        category: updatedData.category,
        publishedAt: updatedData.publishedAt.toDate().toISOString(),
        status: updatedData.status,
        scheduledFor: updatedData.scheduledFor ? updatedData.scheduledFor.toDate().toISOString() : null,
        image: updatedData.image,
        content: updatedData.content,
        views: updatedData.views,
        comments: updatedData.comments,
        viewHistory: updatedData.viewHistory,
    };
    
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
            viewHistory: data.viewHistory ? data.viewHistory.map((vh: any) => ({...vh, date: vh.date.toDate().toISOString()})) : [],
        } as Article;
    };
    return snapshot.docs.map(convertAdminDocToArticle);
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
    const db = await initializeAdminDb();
    const docRef = db.collection('site-config').doc('profile');
    
    await docRef.set(data, { merge: true });
    
    const updatedDoc = await docRef.get();
    return updatedDoc.data() as Profile;
}
