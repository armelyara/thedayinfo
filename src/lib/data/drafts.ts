'use server';

import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import type { Article, ArticleImage, Draft } from '../data-types';
import { sendNewsletterNotification } from '../newsletter-service';
import { getDb } from './db';
import { getAllSubscribers } from './subscribers';
import { translateArticleFlow } from '@/ai/flows/translate-article';

/**
 * Publishes an article — either creating a new one or updating an existing one.
 * Guarantees NO duplicates.
 * SENDS EMAILS for both new articles AND updates.
 */
async function publishArticle(
  articleData: Omit<Article, 'slug' | 'publishedAt' | 'status' | 'views' | 'comments' | 'viewHistory'> & { scheduledFor?: string | null },
  existingSlug?: string
): Promise<Article> {
  const db = await getDb();
  const articlesCollection = db.collection('articles');

  const isUpdate = !!existingSlug;
  const now = new Date();
  let slug: string;
  // Internal write payload: publishedAt is still a Timestamp at write time, not yet a string
  type FirestoreArticlePayload = Omit<Article, 'publishedAt' | 'slug'> & {
    publishedAt: ReturnType<typeof AdminTimestamp.fromDate>;
    slug: string;
    scheduledFor?: string | null;
  };
  let finalData: FirestoreArticlePayload;

  if (isUpdate) {
    // =============================================================
    // UPDATE MODE
    // =============================================================
    slug = existingSlug!;

    const existingDoc = await articlesCollection.doc(slug).get();
    if (!existingDoc.exists) {
      throw new Error(`Article avec slug "${slug}" non trouvé pour mise à jour.`);
    }
    const existingData = existingDoc.data()!;

    // Construction explicite des données pour éviter les erreurs de fusion
    finalData = {
      // 1. Use the NEW content data
      title: articleData.title,
      author: articleData.author,
      category: articleData.category,
      content: articleData.content,
      image: articleData.image,

      // 2. Update published date since this is a RE-PUBLICATION
      publishedAt: AdminTimestamp.fromDate(now),
      status: 'published',

      // 3. Preserve historical data from the existing article
      views: existingData.views || 0,
      comments: existingData.comments || [],
      viewHistory: existingData.viewHistory || [],

      // 4. Keep the original slug
      slug: slug,
    };

  } else {
    // =============================================================
    // CREATE MODE
    // =============================================================
    slug = articleData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Anti-duplicate logic for creation
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

  // Remove the 'scheduledFor' field from a published article
  delete (finalData as Record<string, unknown>).scheduledFor;

  // Save the final data to the document
  await articlesCollection.doc(slug).set(finalData);

  // No need to re-read the document — we already have the final data
  const resultArticle: Article = {
    ...finalData,
    publishedAt: (finalData.publishedAt as ReturnType<typeof AdminTimestamp.fromDate>).toDate().toISOString(),
  };

  // SEND EMAILS for ALL articles (new ones AND updates)
  try {
    console.log(`[publishArticle] Getting subscribers for newsletter...`);
    const subscribers = await getAllSubscribers();
    console.log(`[publishArticle] Found ${subscribers.length} subscribers. Sending notification...`);
    await sendNewsletterNotification(resultArticle, subscribers, isUpdate);
    console.log(`[publishArticle] Newsletter sent for ${isUpdate ? 'update' : 'creation'} of article "${resultArticle.title}"`);
  } catch (error) {
    console.error(`[publishArticle] Failed to send newsletter:`, error);
    // Don't block publication if email sending fails, but log the error
  }

  // AUTO-TRANSLATE: Translate French content to English (non-blocking)
  // The article is already published at this point — translation failure will not roll it back.
  try {
    console.log(`[publishArticle] Starting auto-translation for article "${resultArticle.title}"...`);
    const translation = await translateArticleFlow({
      title: resultArticle.title,
      content: resultArticle.content,
    });
    await articlesCollection.doc(slug).update({
      title_en: translation.title_en,
      content_en: translation.content_en,
    });
    resultArticle.title_en = translation.title_en;
    resultArticle.content_en = translation.content_en;
    console.log(`[publishArticle] Auto-translation complete for article "${resultArticle.title}"`);
  } catch (error) {
    console.error(`[publishArticle] Auto-translation failed for article "${resultArticle.title}". Article is still published in French.`, error);
    // Non-blocking: article is published successfully, English version will be missing until next publish
  }

  return resultArticle;
}


/**
 * Creates or updates a draft or scheduled article.
 */
async function saveAsDraftOrScheduled(draftData: Partial<Draft>): Promise<Draft> {
  const db = await getDb();
  const draftsCollection = db.collection('drafts');

  try {
    const id = draftData.id || `draft_${Date.now()}`;

    // ✅ Validation des données requises
    if (!draftData.title || draftData.title.trim() === '') {
      throw new Error('Le titre est requis pour sauvegarder un brouillon');
    }

    if (!draftData.author || draftData.author.trim() === '') {
      throw new Error('L\'auteur est requis pour sauvegarder un brouillon');
    }

    const status: Draft['status'] = draftData.scheduledFor ? 'scheduled' : 'draft';

    let scheduledForTimestamp: AdminTimestamp | null = null;
    if (draftData.scheduledFor) {
      try {
        const scheduledDate = typeof draftData.scheduledFor === 'string'
          ? new Date(draftData.scheduledFor)
          : draftData.scheduledFor;

        if (isNaN(scheduledDate.getTime())) {
          throw new Error('Invalid scheduled date');
        }

        scheduledForTimestamp = AdminTimestamp.fromMillis(scheduledDate.getTime());
      } catch (error) {
        console.error('Error parsing scheduledFor date:', error);
        throw new Error('Invalid date format for scheduling');
      }
    }

    const dataToSave = {
      id,
      title: draftData.title.trim(),
      author: draftData.author.trim(),
      category: draftData.category || '',
      content: draftData.content || '',
      image: draftData.image || { src: '', alt: '' },
      status,
      lastSaved: AdminTimestamp.now(),
      createdAt: draftData.createdAt
        ? AdminTimestamp.fromMillis(new Date(draftData.createdAt).getTime())
        : AdminTimestamp.now(),
      scheduledFor: scheduledForTimestamp,
      originalArticleSlug: draftData.originalArticleSlug || null,
    };

    // Save with merge to avoid overwriting existing data
    await draftsCollection.doc(id).set(dataToSave, { merge: true });

    // Retrieve saved data to verify
    const savedDoc = await draftsCollection.doc(id).get();

    if (!savedDoc.exists) {
      throw new Error('Draft could not be saved correctly');
    }

    const resultData = savedDoc.data()!;

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
  } catch (error) {
    console.error('Erreur dans saveAsDraftOrScheduled:', error);

    // Re-throw with a more explicit message
    if (error instanceof Error) {
      throw new Error(`Failed to save draft: ${error.message}`);
    }

    throw new Error('Failed to save draft: unknown error');
  }
}


/**
 * Save a draft action
 */
export async function saveDraftAction(draftData: Partial<Draft>): Promise<Draft> {
  return saveAsDraftOrScheduled(draftData);
}

/**
 * Save article action - publish, save as draft, or schedule
 */
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

    // SAFETY GUARD: If updating an existing draft (we have an ID)
    // but the frontend doesn't send a slug, check if the draft in the database
    // already had this slug. This prevents accidentally erasing the link.
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

/**
 * Get all drafts
 */
export async function getDrafts(): Promise<Draft[]> {
  const db = await getDb();
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
      lastSaved: data.lastSaved?.toDate().toISOString() || new Date().toISOString(),
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      status: data.status || 'draft',
      originalArticleSlug: data.originalArticleSlug
    } as Draft;
  });
}

/**
 * Get draft by ID
 */
export async function getDraft(id: string): Promise<Draft | null> {
  const db = await getDb();
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
    lastSaved: data.lastSaved?.toDate().toISOString() || new Date().toISOString(),
    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    status: data.status || 'draft',
    originalArticleSlug: data.originalArticleSlug,
  } as Draft;
}

/**
 * Delete a draft by ID
 */
export async function deleteDraft(id: string): Promise<boolean> {
  const db = await getDb();
  try {
    await db.collection('drafts').doc(id).delete();
    return true;
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
}


/**
 * Get scheduled articles ready to be published
 */
export async function getScheduledArticlesToPublish(): Promise<Draft[]> {
  console.log('[data-admin] getScheduledArticlesToPublish: Starting function.');
  const db = await getDb();
  console.log('[data-admin] getScheduledArticlesToPublish: Database connection obtained.');
  const draftsCollection = db.collection('drafts');
  const now = AdminTimestamp.now();

  const q = draftsCollection
    .where('status', '==', 'scheduled')
    .where('scheduledFor', '<=', now);

  try {
    const snapshot = await q.get();
    console.log(`[data-admin] getScheduledArticlesToPublish: Query executed. Found ${snapshot.size} documents.`);

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
        lastSaved: data.lastSaved?.toDate().toISOString() || new Date().toISOString(),
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        status: data.status || 'draft',
        originalArticleSlug: data.originalArticleSlug
      } as Draft;
    });
  } catch (e) {
    console.error('[data-admin] getScheduledArticlesToPublish: Firestore query failed.', e);
    // Re-throwing the error is crucial for the calling handler to catch it.
    throw e;
  }
}


// Note : La fonction accepte maintenant l'objet Draft complet pour éviter une lecture redondante.
/**
 * Publish a scheduled article
 */
export async function publishScheduledArticle(draft: Draft): Promise<Article> {
  console.log(`[data-admin] publishScheduledArticle: Publishing draft ID ${draft.id}`);

  if (!draft || (draft.status !== 'scheduled' && draft.status !== 'draft')) {
    console.error(`[data-admin] publishScheduledArticle: Invalid draft object for publication. Status is ${draft.status}`);
    throw new Error('Brouillon invalide pour la publication.');
  }

  try {
    const article = await publishArticle({
      title: draft.title,
      author: draft.author,
      category: draft.category,
      content: draft.content,
      image: draft.image as ArticleImage,
    }, draft.originalArticleSlug); // On utilise directement le slug de l'objet draft passé en argument
    console.log(`[data-admin] publishScheduledArticle: Article created/updated with slug ${article.slug}`);

    // Supprimer le brouillon après la publication en utilisant son ID
    await deleteDraft(draft.id);
    console.log(`[data-admin] publishScheduledArticle: Draft ${draft.id} deleted.`);

    return article;
  } catch (error) {
    console.error(`[data-admin] publishScheduledArticle: Error publishing draft ${draft.id}`, error);
    throw error;
  }
}
