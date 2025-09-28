// src/lib/data-admin.ts
'use server';

import { getFirestore as getAdminFirestore, Timestamp as AdminTimestamp, FieldValue } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from './auth';
import type { Article, ArticleImage, ArticleVersion, Draft, Profile, Subscriber } from './data-types';
import { sendNewsletterNotification } from './newsletter-service';

let adminDb: FirebaseFirestore.Firestore;
const initializeAdminDb = async () => {
  if (!adminDb) {
    await initializeFirebaseAdmin();
    adminDb = getAdminFirestore();
  }
  return adminDb;
};

// ==============================================
// NOUVEAU SYSTÈME DE GESTION DES ARTICLES
// ==============================================

/**
 * Publie un article directement.
 * Crée un document dans la collection 'articles'.
 */
async function publishArticleNow(articleData: Omit<Article, 'slug' | 'publishedAt' | 'status' | 'views' | 'comments' | 'viewHistory'>): Promise<Article> {
    const db = await initializeAdminDb();
    const articlesCollection = db.collection('articles');
    const slug = articleData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const now = new Date();
    const publishedArticleData = {
        ...articleData,
        slug,
        publishedAt: AdminTimestamp.fromDate(now),
        status: 'published' as const,
        views: 0,
        comments: [],
        viewHistory: [],
    };

    await articlesCollection.doc(slug).set(publishedArticleData);
    
    const finalArticle: Article = {
        ...publishedArticleData,
        publishedAt: now.toISOString(),
    };

    // Envoyer la newsletter
    const subscribers = await getSubscribers();
    await sendNewsletterNotification(finalArticle, subscribers, false);

    return finalArticle;
}

/**
 * Crée ou met à jour un brouillon/article programmé.
 * Sauvegarde dans la collection 'drafts'.
 */
async function saveAsDraftOrScheduled(draftData: Partial<Draft>): Promise<Draft> {
    const db = await initializeAdminDb();
    const draftsCollection = db.collection('drafts');
    
    const id = draftData.id || `draft_${Date.now()}`;
    
    const now = new Date();
    let status: 'draft' | 'scheduled' = 'draft';
    let scheduledForTimestamp: AdminTimestamp | null = null;
    
    if (draftData.scheduledFor) {
        const scheduledDate = new Date(draftData.scheduledFor);
        if (scheduledDate > now) {
            status = 'scheduled';
            scheduledForTimestamp = AdminTimestamp.fromDate(scheduledDate);
        }
    }

    const dataToSave = {
        ...draftData,
        id,
        status,
        lastSaved: AdminTimestamp.now(),
        createdAt: draftData.createdAt ? AdminTimestamp.fromMillis(new Date(draftData.createdAt).getTime()) : AdminTimestamp.now(),
        scheduledFor: scheduledForTimestamp
    };

    await draftsCollection.doc(id).set(dataToSave, { merge: true });
    
    return {
        ...dataToSave,
        lastSaved: dataToSave.lastSaved.toDate().toISOString(),
        createdAt: dataToSave.createdAt.toDate().toISOString(),
        scheduledFor: dataToSave.scheduledFor?.toDate().toISOString(),
    } as Draft;
}


// FONCTIONS PRINCIPALES EXPORTÉES (Actions)

export async function saveDraftAction(draftData: Partial<Draft>): Promise<Draft> {
    return saveAsDraftOrScheduled(draftData);
}

export async function saveArticleAction(articleData: {
  title: string;
  author: string;
  category: string;
  content: string;
  image: { src: string; alt: string };
  scheduledFor?: string;
  actionType: 'draft' | 'publish' | 'schedule';
  id?: string; // id for existing drafts
}): Promise<Article | Draft> {
  
  const draftPayload: Partial<Draft> = {
    id: articleData.id,
    title: articleData.title,
    author: articleData.author,
    category: articleData.category,
    content: articleData.content,
    image: articleData.image,
    scheduledFor: articleData.scheduledFor,
  };

  if (articleData.actionType === 'publish') {
    // Publier maintenant -> collection `articles`
    const articleToPublish = {
        title: articleData.title,
        author: articleData.author,
        category: articleData.category,
        content: articleData.content,
        image: articleData.image,
    };
    return publishArticleNow(articleToPublish);
  } else {
    // Sauvegarder comme brouillon ou programmer -> collection `drafts`
    return saveAsDraftOrScheduled(draftPayload);
  }
}

export async function getDrafts(): Promise<Draft[]> {
    const db = await initializeAdminDb();
    const snapshot = await db.collection('drafts').orderBy('lastSaved', 'desc').get();
        
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            author: data.author,
            category: data.category,
            content: data.content,
            image: data.image,
            scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
            lastSaved: data.lastSaved.toDate().toISOString(),
            createdAt: data.createdAt.toDate().toISOString(),
            status: data.status || 'draft',
        } as Draft;
    });
}

export async function getDraft(id: string): Promise<Draft | null> {
    const db = await initializeAdminDb();
    const doc = await db.collection('drafts').doc(id).get();
    
    if (!doc.exists) return null;
    
    const data = doc.data()!;
    return {
        id: doc.id,
        title: data.title,
        author: data.author,
        category: data.category,
        content: data.content,
        image: data.image,
        scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
        lastSaved: data.lastSaved.toDate().toISOString(),
        createdAt: data.createdAt.toDate().toISOString(),
        status: data.status || 'draft',
    } as Draft;
}

export async function deleteDraft(id: string): Promise<boolean> {
    const db = await initializeAdminDb();
    try {
        await db.collection('drafts').doc(id).delete();
        return true;
    } catch (error) {
        console.error('Error deleting draft:', error);
        return false;
    }
}

/**
 * Trouve les brouillons programmés dont la date est passée.
 */
export async function getScheduledArticlesToPublish(): Promise<Draft[]> {
    const db = await initializeAdminDb();
    const draftsCollection = db.collection('drafts');
    const now = AdminTimestamp.now();

    const q = draftsCollection
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '<=', now);

    const snapshot = await q.get();

    return snapshot.docs.map(doc => getDraft(doc.id) as unknown as Draft);
}

/**
 * Publie un article programmé : le déplace de 'drafts' à 'articles'.
 */
export async function publishScheduledArticle(draftId: string): Promise<Article> {
    const db = await initializeAdminDb();
    const draft = await getDraft(draftId);
    if (!draft || draft.status !== 'scheduled') {
        throw new Error('Brouillon programmé non valide pour la publication.');
    }

    const article = await publishArticleNow({
        title: draft.title,
        author: draft.author,
        category: draft.category,
        content: draft.content,
        image: draft.image as ArticleImage,
    });

    // Supprimer le brouillon après la publication
    await deleteDraft(draftId);

    return article;
}


// ==============================================
// ANCIENNES FONCTIONS (à garder pour compatibilité ou à nettoyer)
// ==============================================

export async function updateArticle(
    slug: string, 
    data: Partial<Omit<Article, 'slug' | 'scheduledFor' | 'image'>> & { 
        scheduledFor?: Date | string | null;
        image?: Partial<ArticleImage>;
    }
): Promise<Article> {
    const db = await initializeAdminDb();
    const docRef = db.collection('articles').doc(slug);

    const currentDoc = await docRef.get();
    if (!currentDoc.exists) {
        throw new Error("Article not found");
    }

    const currentData = currentDoc.data()!;
    const dataForFirestore: { [key: string]: any } = { ...data };

    if (data.publishedAt && typeof data.publishedAt === 'string') {
        dataForFirestore.publishedAt = AdminTimestamp.fromDate(new Date(data.publishedAt));
    }

    if (data.hasOwnProperty('scheduledFor')) {
        const scheduledValue = data.scheduledFor;
        if (scheduledValue) {
             // Si on ajoute une date de programmation à un article PUBLIÉ,
             // cela le dé-publie et le transforme en brouillon programmé.
            const draftData: Draft = {
                id: `draft-from-${slug}`,
                title: data.title || currentData.title,
                author: data.author || currentData.author,
                category: data.category || currentData.category,
                content: data.content || currentData.content,
                image: (data.image || currentData.image) as ArticleImage,
                scheduledFor: new Date(scheduledValue as any).toISOString(),
                status: 'scheduled',
                lastSaved: new Date().toISOString(),
                createdAt: currentData.publishedAt.toDate().toISOString(),
            };
            await saveAsDraftOrScheduled(draftData);
            await deleteArticle(slug); // Supprimer de la collection `articles`
            
            // Cette fonction est censée retourner un Article, mais on a créé un Draft.
            // C'est un point faible du refactoring. Pour l'instant, on retourne l'ancien état.
             return getArticleBySlug(slug).then(a => a!);
        }
    }

    if (data.image) {
        const currentImage = currentData.image || {};
        dataForFirestore.image = {
            id: currentImage.id || String(Date.now()),
            src: data.image.src || currentImage.src || '',
            alt: data.image.alt || currentImage.alt || '',
            aiHint: currentImage.aiHint || 'user uploaded'
        };
    }
    
    await docRef.update(dataForFirestore);
    
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data()!;
    
    const updatedArticle: Article = {
        slug,
        title: updatedData.title,
        author: updatedData.author,
        category: updatedData.category,
        content: updatedData.content,
        publishedAt: updatedData.publishedAt.toDate().toISOString(),
        status: updatedData.status,
        scheduledFor: updatedData.scheduledFor ? updatedData.scheduledFor.toDate().toISOString() : undefined,
        image: updatedData.image,
        views: updatedData.views || 0,
        comments: updatedData.comments || [],
        viewHistory: updatedData.viewHistory || [],
    };

    if (updatedArticle.status === 'published') {
        try {
            const subscribers = await getSubscribers();
            await sendNewsletterNotification(updatedArticle, subscribers, true);
        } catch (error) {
            console.error('Erreur envoi newsletter pour mise à jour:', error);
        }
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

export async function addSubscriber(email: string, name?: string, preferences?: any): Promise<Subscriber> {
    const db = await initializeAdminDb();
    const subscribersCollection = db.collection('subscribers');
    
    const querySnapshot = await subscribersCollection.where('email', '==', email.toLowerCase()).limit(1).get();
    if (!querySnapshot.empty) {
        throw new Error("Cette adresse email est déjà abonnée.");
    }
    
    const docRef = subscribersCollection.doc(); // Let Firestore generate ID
    
    const subscriberData = {
        email: email.toLowerCase(),
        name: name || '',
        subscribedAt: AdminTimestamp.now(),
        status: 'active' as const,
        preferences: preferences || {}
    };
    
    await docRef.set(subscriberData);
    
    return {
        ...subscriberData,
        subscribedAt: subscriberData.subscribedAt.toDate().toISOString(),
    };
}


export async function getSubscribers(): Promise<Subscriber[]> {
    const db = await initializeAdminDb();
    const subscribersCollection = db.collection('subscribers');
    const snapshot = await subscribersCollection.get();
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            email: data.email,
            name: data.name || '',
            subscribedAt: data.subscribedAt.toDate().toISOString(),
            status: (data.status as 'active' | 'inactive' | 'unsubscribed') || 'active',
            preferences: data.preferences
        };
    });
}


export async function getSubscribersCount(): Promise<number> {
    const db = await initializeAdminDb();
    const subscribersCollection = db.collection('subscribers');
    const snapshot = await subscribersCollection.where('status', '==', 'active').get();
    return snapshot.size;
}

export async function deleteSubscriber(email: string): Promise<boolean> {
    const db = await initializeAdminDb();
    const q = db.collection('subscribers').where('email', '==', email.toLowerCase());
    const snapshot = await q.get();

    if (snapshot.empty) {
        console.warn(`Subscriber with email ${email} not found for deletion.`);
        return false;
    }
    
    try {
        const docRef = snapshot.docs[0].ref;
        await docRef.delete();
        return true;
    } catch (error) {
        console.error("Error deleting subscriber:", error);
        return false;
    }
}

export async function updateSubscriberStatus(email: string, status: 'active' | 'inactive' | 'unsubscribed'): Promise<boolean> {
    const db = await initializeAdminDb();
    const q = db.collection('subscribers').where('email', '==', email.toLowerCase());
    const snapshot = await q.get();

    if (snapshot.empty) {
        console.warn(`Subscriber with email ${email} not found for status update.`);
        return false;
    }
    
    try {
        const docRef = snapshot.docs[0].ref;
        await docRef.update({ status });
        return true;
    } catch (error) {
        console.error("Error updating subscriber status:", error);
        return false;
    }
}

export async function searchArticles(query: string): Promise<Article[]> {
    const articles = await getPublishedArticles();
    const lowerQuery = query.toLowerCase();
    return articles.filter(article => 
        article.title.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery) ||
        article.category.toLowerCase().includes(lowerQuery)
    );
}

export async function updateArticleComments(slug: string, comments: any[]): Promise<boolean> {
    const db = await initializeAdminDb();
    const docRef = db.collection('articles').doc(slug);
    
    try {
        await docRef.update({ comments });
        return true;
    } catch (error) {
        console.error("Error updating article comments:", error);
        return false;
    }
}

export async function getAllArticles(): Promise<Article[]> {
    return await getAdminArticles();
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    const db = await initializeAdminDb();
    const docRef = db.collection('articles').doc(slug);
    const doc = await docRef.get();
    
    if (!doc.exists) {
        return null;
    }
    
    const data = doc.data()!;
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
}

export async function getPublishedArticles(): Promise<Article[] | { error: string, message: string }> {
    try {
        const db = await initializeAdminDb();
        const articlesCollection = db.collection('articles');
        const q = articlesCollection
            .where('status', '==', 'published')
            .orderBy('publishedAt', 'desc');
        
        const snapshot = await q.get();
        
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
    } catch (e: any) {
        if (e.code === 'FAILED_PRECONDITION' && e.message.includes('index')) {
            return {
                error: 'missing_index',
                message: e.message
            };
        }
        console.error("Error fetching published articles:", e);
        return {
            error: 'unknown',
            message: 'An unexpected error occurred while fetching articles.'
        };
    }
}