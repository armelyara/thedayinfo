'use server';

import type { Article, Comment, ViewHistory } from '../data-types';
import { getDb } from './db';
import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';

// Shared mapper: converts a Firestore admin document snapshot to an Article object
// Accepts both QueryDocumentSnapshot (from queries) and DocumentSnapshot (from .get())
function mapArticle(doc: DocumentSnapshot<DocumentData>): Article {
  const data = doc.data()!;
  return {
    slug: doc.id,
    title: data.title,
    author: data.author,
    category: data.category,
    publishedAt: data.publishedAt?.toDate().toISOString() || new Date().toISOString(),
    status: data.status,
    image: data.image,
    content: data.content,
    views: data.views || 0,
    comments: data.comments || [],
    viewHistory: data.viewHistory
      ? data.viewHistory.map((vh: ViewHistory & { date: { toDate?: () => Date } }) => ({
          ...vh,
          date: vh.date && typeof (vh.date as any).toDate === 'function'
            ? (vh.date as any).toDate().toISOString()
            : vh.date,
        }))
      : [],
  };
}

/**
 * Delete an article by slug
 */
export async function deleteArticle(slug: string): Promise<boolean> {
  const db = await getDb();
  const docRef = db.collection('articles').doc(slug);
  try {
    await docRef.delete();
    return true;
  } catch (e) {
    console.error("Error deleting article:", e);
    return false;
  }
}

/**
 * Get all articles for admin (no filtering)
 */
export async function getAdminArticles(): Promise<Article[]> {
  const db = await getDb();
  const articlesCollection = db.collection('articles');
  const q = articlesCollection.orderBy('publishedAt', 'desc');
  const snapshot = await q.get();

  return snapshot.docs.map(mapArticle);
}

/**
 * Update comments for an article
 */
export async function updateArticleComments(slug: string, comments: Comment[]): Promise<boolean> {
  const db = await getDb();
  const docRef = db.collection('articles').doc(slug);

  try {
    await docRef.update({ comments });
    return true;
  } catch (error) {
    console.error("Error updating article comments:", error);
    return false;
  }
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const db = await getDb();
  const docRef = db.collection('articles').doc(slug);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  return mapArticle(doc);
}

/**
 * Get all published articles
 */
export async function getPublishedArticles(): Promise<Article[] | { error: string, message: string }> {
  const db = await getDb();
  try {
    const articlesCollection = db.collection('articles');
    const q = articlesCollection
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc');

    const snapshot = await q.get();

    return snapshot.docs.map(mapArticle);
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
