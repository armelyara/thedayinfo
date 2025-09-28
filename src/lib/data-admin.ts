
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
    const publishedAt = isScheduled && scheduledDate ? scheduledDate : now;

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
        try {
            const subscribers = await getSubscribers();
            await sendNewsletterNotification(createdArticle, subscribers, false);
            console.log('Newsletter envoyée pour nouvel article:', createdArticle.slug);
        } catch (error) {
            console.error('Erreur envoi newsletter pour création:', error);
        }
    }
    
    return createdArticle;
}

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
            const scheduledDate = new Date(scheduledValue as any);
            const now = new Date();
            dataForFirestore.scheduledFor = AdminTimestamp.fromDate(scheduledDate);
            dataForFirestore.publishedAt = AdminTimestamp.fromDate(scheduledDate);
            dataForFirestore.status = scheduledDate > now ? 'scheduled' : 'published';
        } else {
            delete dataForFirestore.scheduledFor;
            dataForFirestore.status = 'published';
            dataForFirestore.publishedAt = AdminTimestamp.fromDate(new Date());
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
            console.log('Newsletter envoyée pour mise à jour article:', updatedArticle.slug);
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
    
    const docRef = subscribersCollection.doc(email);
    const existingDoc = await docRef.get();
    if (existingDoc.exists) {
        throw new Error('Cette adresse email est déjà abonnée.');
    }
    
    const subscriberData = {
        email,
        name: name || '',
        subscribedAt: AdminTimestamp.now(),
        status: 'active' as const,
        preferences: preferences || {}
    };
    
    await docRef.set(subscriberData);
    
    return {
        email,
        name: subscriberData.name,
        subscribedAt: subscriberData.subscribedAt.toDate().toISOString(),
        status: subscriberData.status,
        preferences: subscriberData.preferences
    };
}

export async function getSubscribers(): Promise<Subscriber[]> {
    const db = await initializeAdminDb();
    const subscribersCollection = db.collection('subscribers');
    const snapshot = await subscribersCollection.get();
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            email: doc.id,
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
    const snapshot = await subscribersCollection.get();
    return snapshot.size;
}

export async function deleteSubscriber(email: string): Promise<boolean> {
    const db = await initializeAdminDb();
    const docRef = db.collection('subscribers').doc(email);
    
    try {
        await docRef.delete();
        return true;
    } catch (error) {
        console.error("Error deleting subscriber:", error);
        return false;
    }
}

export async function updateSubscriberStatus(email: string, status: 'active' | 'inactive' | 'unsubscribed'): Promise<boolean> {
    const db = await initializeAdminDb();
    const docRef = db.collection('subscribers').doc(email);
    
    try {
        await docRef.update({ status });
        return true;
    } catch (error) {
        console.error("Error updating subscriber status:", error);
        return false;
    }
}

export async function searchArticles(query: string): Promise<Article[]> {
    const db = await initializeAdminDb();
    const articlesCollection = db.collection('articles');
    
    const snapshot = await articlesCollection
        .where('status', '==', 'published')
        .orderBy('publishedAt', 'desc')
        .get();
    
    const allArticles = snapshot.docs.map(doc => {
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
    
    const lowerQuery = query.toLowerCase();
    return allArticles.filter(article => 
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

export async function seedInitialArticles(): Promise<void> {
    const db = await initializeAdminDb();
    console.log('Seeding initial articles...');
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

export async function getArticlesByCategory(category: string): Promise<Article[]> {
    const db = await initializeAdminDb();
    const articlesCollection = db.collection('articles');
    const q = articlesCollection
        .where('category', '==', category)
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
            scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
            image: data.image,
            content: data.content,
            views: data.views || 0,
            comments: data.comments || [],
            viewHistory: data.viewHistory || [],
        } as Article;
    });
}

export async function getPublishedArticles(): Promise<Article[]> {
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
            scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
            image: data.image,
            content: data.content,
            views: data.views || 0,
            comments: data.comments || [],
            viewHistory: data.viewHistory || [],
        } as Article;
    });
}
// ======= SYSTÈME DE BROUILLONS CORRIGÉ =======

// Utilitaire pour déterminer le statut et la date de publication
function determinePublicationStatus(scheduledFor?: string) {
    const now = new Date();
    let scheduledDate: Date | undefined;
    
    if (scheduledFor) {
        scheduledDate = new Date(scheduledFor);
    }
    
    if (scheduledDate && scheduledDate > now) {
        // Programmé dans le futur
        return {
            status: 'scheduled' as const,
            publishedAt: scheduledDate,
            shouldSendNewsletter: false
        };
    } else if (scheduledDate && scheduledDate <= now) {
        // Date dans le passé = publication immédiate
        return {
            status: 'published' as const,
            publishedAt: now,
            shouldSendNewsletter: true
        };
    } else {
        // Pas de date = brouillon
        return {
            status: 'draft' as const,
            publishedAt: now,
            shouldSendNewsletter: false
        };
    }
}

// Sauvegarder version d'un article (pour historique)
async function saveArticleVersion(article: Article, reason: 'creation' | 'update' | 'schedule') {
    const db = await initializeAdminDb();
    const versionsCollection = db.collection('article-versions');
    
    const versionId = `${article.slug}_v${article.version || 1}_${Date.now()}`;
    
    await versionsCollection.doc(versionId).set({
        versionId,
        articleSlug: article.slug,
        version: article.version || 1,
        title: article.title,
        content: article.content,
        author: article.author,
        category: article.category,
        image: article.image,
        createdAt: AdminTimestamp.now(),
        publishedAt: AdminTimestamp.fromDate(new Date(article.publishedAt)),
        reason
    });
}

// Fonction principale pour sauvegarder un article (création ou modification)
export async function saveArticle(articleData: {
    title: string,
    author: string,
    category: string,
    content: string,
    image: { src: string, alt: string },
    scheduledFor?: string,
    originalSlug?: string,
    forceStatus?: 'draft' | 'published' | 'scheduled'
}): Promise<Article> {
    const db = await initializeAdminDb();
    const articlesCollection = db.collection('articles');
    
    let slug: string;
    let isEditing = false;
    let currentVersion = 1;
    
    if (articleData.originalSlug) {
        // Mode édition - garder le slug existant
        slug = articleData.originalSlug;
        isEditing = true;
        
        // Récupérer la version actuelle
        const existingDoc = await articlesCollection.doc(slug).get();
        if (existingDoc.exists) {
            const existingData = existingDoc.data();
            currentVersion = (existingData?.version || 1) + 1;
        }
    } else {
        // Mode création - générer nouveau slug
        slug = articleData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    
    // Déterminer le statut et la date de publication
    const publicationInfo = articleData.forceStatus 
        ? { 
            status: articleData.forceStatus, 
            publishedAt: new Date(), 
            shouldSendNewsletter: articleData.forceStatus === 'published' 
          }
        : determinePublicationStatus(articleData.scheduledFor);

    const dataForFirestore: any = {
        title: articleData.title,
        author: articleData.author,
        category: articleData.category,
        content: articleData.content,
        publishedAt: AdminTimestamp.fromDate(publicationInfo.publishedAt),
        status: publicationInfo.status,
        image: {
            id: String(Date.now()),
            src: articleData.image.src,
            alt: articleData.image.alt,
            aiHint: 'user uploaded'
        },
        views: 0,
        comments: [],
        viewHistory: [],
        lastSaved: AdminTimestamp.now(),
        version: currentVersion
    };
    
    if (articleData.scheduledFor) {
        dataForFirestore.scheduledFor = AdminTimestamp.fromDate(new Date(articleData.scheduledFor));
    }

    // Sauvegarder l'article
    const docRef = articlesCollection.doc(slug);
    
    if (isEditing) {
        await docRef.update(dataForFirestore);
    } else {
        await docRef.set(dataForFirestore);
    }
    
    const savedArticle: Article = {
        ...articleData,
        slug,
        status: publicationInfo.status as 'drafts' | 'published' | 'scheduled',
        publishedAt: publicationInfo.publishedAt.toISOString(),
        scheduledFor: dataForFirestore.scheduledFor?.toDate().toISOString(),
        image: dataForFirestore.image,
        views: 0,
        comments: [],
        viewHistory: [],
        version: currentVersion
    };
    
    // Sauvegarder la version pour l'historique
    await saveArticleVersion(savedArticle, isEditing ? 'update' : 'creation');
    
    // Déclencher newsletter si nécessaire
    if (publicationInfo.shouldSendNewsletter) {
        const subscribers = await getSubscribers();
        await sendNewsletterNotification(savedArticle, subscribers, isEditing);
    }
    
    return savedArticle;
}

// Sauvegarder en brouillon (brouillon externe dans collection drafts)
export async function saveDraft(draftData: Partial<Draft>): Promise<Draft> {
    const db = await initializeAdminDb();
    const draftsCollection = db.collection('drafts');
    
    const autoSaveId = draftData.autoSaveId || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let editingVersion: number | undefined;
    if (draftData.isEditing && draftData.originalArticleSlug) {
        // Récupérer la version de l'article en cours d'édition
        const originalDoc = await db.collection('articles').doc(draftData.originalArticleSlug).get();
        if (originalDoc.exists) {
            editingVersion = originalDoc.data()?.version || 1;
        }
    }
    
    const draftDoc = {
        autoSaveId,
        title: draftData.title || '',
        author: draftData.author || 'Armel Yara',
        category: draftData.category || '',
        content: draftData.content || '',
        image: draftData.image || undefined,
        scheduledFor: draftData.scheduledFor || null,
        lastSaved: AdminTimestamp.now(),
        createdAt: draftData.createdAt ? AdminTimestamp.fromDate(new Date(draftData.createdAt)) : AdminTimestamp.now(),
        status: 'draft' as const,
        originalArticleSlug: draftData.originalArticleSlug || null,
        isEditing: draftData.isEditing || false,
        editingVersion
    };
    
    await draftsCollection.doc(autoSaveId).set(draftDoc, { merge: true });
    
    return {
        autoSaveId,
        title: draftDoc.title,
        author: draftDoc.author,
        category: draftDoc.category,
        content: draftDoc.content,
        image: draftDoc.image,
        scheduledFor: draftDoc.scheduledFor,
        lastSaved: draftDoc.lastSaved.toDate().toISOString(),
        createdAt: draftDoc.createdAt.toDate().toISOString(),
        status: 'draft',
        originalArticleSlug: draftData.originalArticleSlug || undefined,
        isEditing: draftDoc.isEditing,
        editingVersion: draftDoc.editingVersion
    };
}

// Publier un article depuis un brouillon externe
export async function publishFromDraft(autoSaveId: string, publicationType: 'publish' | 'schedule' | 'draft' = 'publish'): Promise<Article> {
    const draft = await getDraft(autoSaveId);
    if (!draft) {
        throw new Error('Brouillon non trouvé');
    }
    
    const forceStatus = publicationType === 'publish' ? 'published' as const 
                     : publicationType === 'schedule' ? 'scheduled' as const
                     : 'draft' as const;
    
    // Construire correctement l'objet articleData
    const articleData = {
        title: draft.title,
        author: draft.author,
        category: draft.category,
        content: draft.content,
        image: draft.image && draft.image.src ? 
            { src: draft.image.src, alt: draft.image.alt || '' } : 
            { src: '', alt: '' },
        scheduledFor: draft.scheduledFor || undefined,
        originalSlug: draft.originalArticleSlug,
        forceStatus
    };
    
    const publishedArticle = await saveArticle(articleData);
    
    // Supprimer le brouillon après publication réussie
    await deleteDraft(autoSaveId);
    
    return publishedArticle;
}

// Récupérer l'historique des versions d'un article
export async function getArticleVersions(articleSlug: string): Promise<ArticleVersion[]> {
    const db = await initializeAdminDb();
    const versionsCollection = db.collection('article-versions');
    
    const snapshot = await versionsCollection
        .where('articleSlug', '==', articleSlug)
        .orderBy('version', 'desc')
        .get();
    
    return snapshot.docs.map(doc => {
        const data = doc.data();

        return {
            versionId: doc.id,
            articleSlug: data.articleSlug,
            version: data.version,
            title: data.title,
            content: data.content,
            author: data.author,
            category: data.category,
            image: data.image,
            createdAt: data.createdAt.toDate().toISOString(),
            publishedAt: data.publishedAt.toDate().toISOString(),
            reason: data.reason

        } as ArticleVersion;
    });
}

// Fonctions existantes modifiées
export async function getDrafts(): Promise<Draft[]> {
    const db = await initializeAdminDb();
    const snapshot = await db.collection('drafts')
        .where('status', '==', 'draft')
        .orderBy('lastSaved', 'desc')
        .get();
        
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            autoSaveId: doc.id,
            title: data.title,
            author: data.author,
            category: data.category,
            content: data.content,
            image: data.image,
            scheduledFor: data.scheduledFor,
            lastSaved: data.lastSaved.toDate().toISOString(),
            createdAt: data.createdAt.toDate().toISOString(),
            status: 'draft',
            originalArticleSlug: data.originalArticleSlug,
            isEditing: data.isEditing || false,
            editingVersion: data.editingVersion
        } as Draft;
    });
}

export async function getDraft(autoSaveId: string): Promise<Draft | null> {
    const db = await initializeAdminDb();
    const doc = await db.collection('drafts').doc(autoSaveId).get();
    
    if (!doc.exists) return null;
    
    const data = doc.data()!;
    return {
        autoSaveId: doc.id,
        title: data.title,
        author: data.author,
        category: data.category,
        content: data.content,
        image: data.image,
        scheduledFor: data.scheduledFor,
        lastSaved: data.lastSaved.toDate().toISOString(),
        createdAt: data.createdAt.toDate().toISOString(),
        status: 'draft',
        originalArticleSlug: data.originalArticleSlug,
        isEditing: data.isEditing || false,
        editingVersion: data.editingVersion
    };
}

export async function deleteDraft(autoSaveId: string): Promise<boolean> {
    const db = await initializeAdminDb();
    try {
        await db.collection('drafts').doc(autoSaveId).delete();
        return true;
    } catch (error) {
        console.error('Error deleting draft:', error);
        return false;
    }
}

// Fonction pour forcer la publication d'un article programmé (utile pour cron job)
export async function publishScheduledArticle(slug: string): Promise<Article> {
    const db = await initializeAdminDb();
    const docRef = db.collection('articles').doc(slug);
    
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new Error('Article non trouvé');
    }
    
    const data = doc.data()!;
    if (data.status !== 'scheduled') {
        throw new Error('Article non programmé');
    }
    
    // Mettre à jour vers publié
    await docRef.update({
        status: 'published',
        publishedAt: AdminTimestamp.now()
    });
    
    const publishedArticle = {
        slug,
        title: data.title,
        author: data.author,
        category: data.category,
        publishedAt: new Date().toISOString(),
        status: 'published',
        scheduledFor: data.scheduledFor ? data.scheduledFor.toDate().toISOString() : undefined,
        image: data.image,
        content: data.content,
        views: data.views || 0,
        comments: data.comments || [],
        viewHistory: data.viewHistory || [],
        version: data.version
    } as Article;
    
    // Déclencher newsletter
    const subscribers = await getSubscribers();
    await sendNewsletterNotification(publishedArticle, subscribers, false);
    
    return publishedArticle;
}

    