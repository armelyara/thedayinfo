
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
 * ENVOIE DES EMAILS pour les nouveaux articles ET les modifications.
 */
async function publishArticle(
    articleData: Omit<Article, 'slug' | 'publishedAt' | 'status' | 'views' | 'comments' | 'viewHistory'> & { scheduledFor?: string | null },
    existingSlug?: string
): Promise<Article> {
    const db = await initializeAdminDb();
    const articlesCollection = db.collection('articles');

    const isUpdate = !!existingSlug;
    const now = new Date();
    let slug: string;
    let finalData: any;

    if (isUpdate) {
        // =============================================================
        // MODE MISE À JOUR
        // =============================================================
        slug = existingSlug!;

        const existingDoc = await articlesCollection.doc(slug).get();
        if (!existingDoc.exists) {
            throw new Error(`Article avec slug "${slug}" non trouvé pour mise à jour.`);
        }
        const existingData = existingDoc.data()!;

        // Construction explicite des données pour éviter les erreurs de fusion
        finalData = {
            // 1. On prend les NOUVELLES données de contenu
            title: articleData.title,
            author: articleData.author,
            category: articleData.category,
            content: articleData.content,
            image: articleData.image,

            // 2. On met à jour la date de publication, car c'est une RE-PUBLICATION
            publishedAt: AdminTimestamp.fromDate(now),
            status: 'published',

            // 3. On préserve les données historiques de l'ancien article
            views: existingData.views || 0,
            comments: existingData.comments || [],
            viewHistory: existingData.viewHistory || [],
            
            // 4. On garde le slug original
            slug: slug,
        };

    } else {
        // =============================================================
        // MODE CRÉATION
        // =============================================================
        slug = articleData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        
        // Logique anti-doublon pour la création
        let counter = 1;
        let originalSlug = slug;
        while (true) {
            const docSnapshot = await articlesCollection.doc(slug).get();
            if (!docSnapshot.exists) break;
            slug = `${originalSlug}-${counter}`;
            counter++;
        }

        finalData = {
            ...articleData,
            publishedAt: AdminTimestamp.fromDate(now),
            status: 'published',
            views: 0,
            comments: [],
            viewHistory: [],
            slug: slug,
        };
    }

    // Supprimer le champ 'scheduledFor' qui n'a plus lieu d'être dans un article publié
    delete finalData.scheduledFor;

    // Sauvegarder les données finales dans le document
    await articlesCollection.doc(slug).set(finalData);

    // Pas besoin de re-lire le document, on a déjà les données finales
    const resultArticle: Article = {
        ...finalData,
        publishedAt: finalData.publishedAt.toDate().toISOString(),
    };

    // ✅ CORRECTION : Envoyer des emails pour TOUS les articles (nouveaux ET modifiés)
    try {
        const subscribers = await getSubscribers();
        await sendNewsletterNotification(resultArticle, subscribers, isUpdate);
        console.log(`Newsletter envoyée pour ${isUpdate ? 'modification' : 'création'} de l'article "${resultArticle.title}"`);
    } catch (error) {
        console.error(`Échec envoi newsletter:`, error);
        // Ne pas bloquer la publication si l'envoi d'email échoue
    }

    return resultArticle;
}

export async function getSubscriberByEmail(email: string): Promise<Subscriber | null> {
    const db = await initializeAdminDb();
    const q = db.collection('subscribers').where('email', '==', email.toLowerCase());
    const snapshot = await q.get();

    if (snapshot.empty) {
        return null;
    }
    
    const data = snapshot.docs[0].data();
    return {
        email: data.email,
        name: data.name || '',
        subscribedAt: data.subscribedAt.toDate().toISOString(),
        status: data.status || 'active',
        unsubscribeToken: data.unsubscribeToken,
        preferences: data.preferences
    };
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
    id?: string; // L'ID du brouillon
    slug?: string; // Le slug de l'article original (si on modifie un article publié)
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
      // La logique de publication directe semble correcte, on la garde.
      let existingSlug: string | undefined;
      
      if (articleData.slug) {
        existingSlug = articleData.slug;
      }
      else if (articleData.id) {
        const draft = await getDraft(articleData.id);
        if (draft?.originalArticleSlug) {
          existingSlug = draft.originalArticleSlug;
        }
      }
      
      const result = await publishArticle(payload, existingSlug);
      
      if (articleData.id) {
        await deleteDraft(articleData.id);
      }
      
      return result;
  
    } else {
      // CORRECTION APPLIQUÉE ICI pour 'draft' et 'schedule'
      // Le but est de créer/mettre à jour un brouillon.
      // Il est vital de préserver le lien vers l'article original si on est en mode "modification".
      
      // On récupère le slug de l'article original qui doit être passé par le frontend.
      let originalArticleSlugToSave: string | undefined | null = articleData.slug;

      // GARDE-FOU : Si on met à jour un brouillon existant (on a un ID)
      // mais que le frontend n'envoie pas de slug, on vérifie si le brouillon
      // en base de données ne possédait pas déjà ce slug.
      // Cela évite d'effacer le lien accidentellement.
      if (articleData.id && !originalArticleSlugToSave) {
        const existingDraft = await getDraft(articleData.id);
        if (existingDraft?.originalArticleSlug) {
          originalArticleSlugToSave = existingDraft.originalArticleSlug;
        }
      }
      
      const draftPayload: Partial<Draft> = { 
        ...payload, 
        id: articleData.id,
        // On s'assure que le slug de l'article original est bien inclus.
        originalArticleSlug: originalArticleSlugToSave,
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


// Note : La fonction accepte maintenant l'objet Draft complet pour éviter une lecture redondante.
export async function publishScheduledArticle(draft: Draft): Promise<Article> {
    // La lecture getDraft(draftId) a été supprimée car inutile.

    if (!draft || (draft.status !== 'scheduled' && draft.status !== 'draft')) {
        throw new Error('Brouillon invalide pour la publication.');
    }

    const article = await publishArticle({
        title: draft.title,
        author: draft.author,
        category: draft.category,
        content: draft.content,
        image: draft.image as ArticleImage,
    }, draft.originalArticleSlug); // On utilise directement le slug de l'objet draft passé en argument

    // Supprimer le brouillon après la publication en utilisant son ID
    await deleteDraft(draft.id);

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
    
    // Générer un token unique pour le désabonnement
    const crypto = require('crypto');
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    
    const subscriberData = {
        email: email.toLowerCase(),
        name: name || '',
        subscribedAt: AdminTimestamp.now(),
        status: 'active' as const,
        unsubscribeToken: unsubscribeToken, // ← Ajouter le token
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

    