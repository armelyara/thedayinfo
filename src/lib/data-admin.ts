
'use server';

import { getFirestore as getAdminFirestore, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from './auth';
import type { Article, ArticleImage, Draft, Profile, Subscriber } from './data-types';
import { sendNewsletterNotification } from './newsletter-service';

let adminDb: FirebaseFirestore.Firestore;
const initializeAdminDb = async () => {
  if (!adminDb) {
    await initializeFirebaseAdmin();
    adminDb = getAdminFirestore();
  }
  return adminDb;
};


/**
 * Publie un article, soit en créant un nouveau, soit en mettant à jour un existant.
 * Garantit AUCUN doublon.
 */
async function publishArticle(
    articleData: Omit<Article, 'slug' | 'publishedAt' | 'status' | 'views' | 'comments' | 'viewHistory'> & { scheduledFor?: string | null }, 
    existingSlug?: string
): Promise<Article> {
    const db = await initializeAdminDb();
    const articlesCollection = db.collection('articles');
    
    const isUpdate = !!existingSlug;
    
    // LOGIQUE CRITIQUE : Toujours utiliser existingSlug si fourni
    let slug: string;
    
    if (isUpdate) {
        // MODE MISE À JOUR : utiliser exactement le slug existant
        slug = existingSlug;
        
        // Vérifier que l'article existe
        const existingDoc = await articlesCollection.doc(slug).get();
        if (!existingDoc.exists) {
            throw new Error(`Article avec slug "${slug}" non trouvé pour mise à jour`);
        }
    } else {
        // MODE CRÉATION : générer un nouveau slug
        slug = articleData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        
        // Vérifier les doublons et ajuster si nécessaire
        let counter = 1;
        let originalSlug = slug;
        
        while (true) {
            const docSnapshot = await articlesCollection.doc(slug).get();
            if (!docSnapshot.exists) {
                break; // Slug disponible
            }
            slug = `${originalSlug}-${counter}`;
            counter++;
        }
    }

    const now = new Date();
    
    // Récupérer les données existantes seulement en mode mise à jour
    const existingArticleData = isUpdate ? (await articlesCollection.doc(slug).get()).data() : {};

    // Préparer les données pour Firestore
    const firestoreData: any = {
        // En mise à jour : garder les données existantes et appliquer les nouvelles
        ...existingArticleData,
        // En création : utiliser les nouvelles données
        ...articleData,
        // Métadonnées systématiques
        publishedAt: isUpdate ? existingArticleData?.publishedAt : AdminTimestamp.fromDate(now),
        status: 'published',
        // Garder les données historiques en mise à jour
        views: existingArticleData?.views || 0,
        comments: existingArticleData?.comments || [],
        viewHistory: existingArticleData?.viewHistory || [],
    };

    // IMPORTANT : Supprimer scheduledFor car on publie maintenant
    delete firestoreData.scheduledFor;

    // Sauvegarder - SET avec merge pour créer ou mettre à jour
    await articlesCollection.doc(slug).set(firestoreData, { merge: true });
    
    // Construire la réponse
    const finalArticle: Article = {
        slug: slug,
        title: firestoreData.title,
        author: firestoreData.author,
        category: firestoreData.category,
        content: firestoreData.content,
        image: firestoreData.image,
        publishedAt: firestoreData.publishedAt.toDate().toISOString(),
        status: 'published',
        views: firestoreData.views || 0,
        comments: firestoreData.comments || [],
        viewHistory: firestoreData.viewHistory || [],
    };

    // Newsletter
    if (!isUpdate) { // Only for new articles, not updates
        try {
            const subscribers = await getSubscribers();
            await sendNewsletterNotification(finalArticle, subscribers, isUpdate);
        } catch (error) {
            console.error(`Échec newsletter:`, error);
        }
    }

    return finalArticle;
}


/**
 * Crée ou met à jour un brouillon/article programmé.
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
        title: draftData.title || '',
        author: draftData.author || '',
        category: draftData.category || '',
        content: draftData.content || '',
        image: draftData.image || null,
        id,
        status,
        lastSaved: AdminTimestamp.now(),
        createdAt: draftData.createdAt ? AdminTimestamp.fromMillis(new Date(draftData.createdAt).getTime()) : AdminTimestamp.now(),
        scheduledFor: scheduledForTimestamp,
        originalArticleSlug: draftData.originalArticleSlug || null,
    };

    await draftsCollection.doc(id).set(dataToSave, { merge: true });
    
    const savedData = await draftsCollection.doc(id).get();
    const resultData = savedData.data()!;

    return {
        id: resultData.id,
        title: resultData.title,
        author: resultData.author,
        category: resultData.category,
        content: resultData.content,
        image: resultData.image,
        lastSaved: resultData.lastSaved.toDate().toISOString(),
        createdAt: resultData.createdAt.toDate().toISOString(),
        status: resultData.status,
        scheduledFor: resultData.scheduledFor?.toDate().toISOString() || null,
        originalArticleSlug: resultData.originalArticleSlug,
    } as Draft;
}


export async function saveDraftAction(draftData: Partial<Draft>): Promise<Draft> {
    await initializeAdminDb();
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
    id?: string;
    slug?: string;
  }): Promise<Article | Draft> {
    await initializeAdminDb();
    
    const payload = {
      title: articleData.title,
      author: articleData.author,
      category: articleData.category,
      content: articleData.content,
      image: articleData.image,
      scheduledFor: articleData.scheduledFor,
    };
  
    if (articleData.actionType === 'publish') {
      // 🔥 LOGIQUE ANTI-DOUBLONS :
      let existingSlug: string | undefined;
      
      // RÈGLE : Si on a un slug → MISE À JOUR de l'article existant
      if (articleData.slug) {
        existingSlug = articleData.slug;
      }
      // RÈGLE : Si brouillon lié à un article → MISE À JOUR de l'article existant  
      else if (articleData.id) {
        const draft = await getDraft(articleData.id);
        if (draft?.originalArticleSlug) {
          existingSlug = draft.originalArticleSlug;
        }
      }
      // RÈGLE : Aucun slug → CRÉATION nouvel article
      
      const result = await publishArticle(payload, existingSlug);
      
      if (articleData.id) {
        await deleteDraft(articleData.id);
      }
      
      return result;
  
    } else {
      // Pour brouillons/programmation
      const draftPayload = { 
        ...payload, 
        id: articleData.id,
        originalArticleSlug: articleData.slug
      };
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
            originalArticleSlug: data.originalArticleSlug
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
        originalArticleSlug: data.originalArticleSlug,
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


export async function getScheduledArticlesToPublish(): Promise<Draft[]> {
    const db = await initializeAdminDb();
    const draftsCollection = db.collection('drafts');
    const now = AdminTimestamp.now();

    const q = draftsCollection
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '<=', now);

    try {
      const snapshot = await q.get();

      if (snapshot.empty) {
          return [];
      }
      
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
              originalArticleSlug: data.originalArticleSlug
          } as Draft;
      });
    } catch(e) {
      console.error(e);
      throw e;
    }
}


export async function publishScheduledArticle(draftId: string): Promise<Article> {
    const db = await initializeAdminDb();
    const draft = await getDraft(draftId);

    if (!draft || (draft.status !== 'scheduled' && draft.status !== 'draft')) {
        throw new Error('Brouillon invalide pour la publication.');
    }

    const article = await publishArticle({
        title: draft.title,
        author: draft.author,
        category: draft.category,
        content: draft.content,
        image: draft.image as ArticleImage,
    }, draft.originalArticleSlug);

    // Supprimer le brouillon après la publication
    await deleteDraft(draftId);

    return article;
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
    
    return snapshot.docs.map((doc): Article => {
        const data = doc.data();
        return {
            slug: doc.id,
            title: data.title,
            author: data.author,
            category: data.category,
            publishedAt: data.publishedAt.toDate().toISOString(),
            status: 'published',
            image: data.image,
            content: data.content,
            views: data.views || 0,
            comments: data.comments || [],
            viewHistory: data.viewHistory ? data.viewHistory.map((vh: any) => ({...vh, date: vh.date.toDate().toISOString()})) : [],
        } as Article;
    });
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
        image: data.image,
        content: data.content,
        views: data.views || 0,
        comments: data.comments || [],
        viewHistory: data.viewHistory || [],
    } as Article;
}

export async function getPublishedArticles(): Promise<Article[] | { error: string, message: string }> {
    const db = await initializeAdminDb();
    try {
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
    const snapshot = await subscribersCollection.orderBy('subscribedAt', 'desc').get();
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            email: data.email,
            name: data.name || '',
            subscribedAt: data.subscribedAt.toDate().toISOString(),
            status: data.status || 'active',
            preferences: data.preferences
        };
    });
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

    