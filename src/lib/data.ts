

import {
  addArticle as dbAddArticle,
  updateArticle as dbUpdateArticle,
  deleteArticle as dbDeleteArticle,
  getPublishedArticles as dbGetPublishedArticles,
  getArticleBySlug as dbGetArticleBySlug,
  getArticlesByCategory as dbGetArticlesByCategory,
  searchArticles as dbSearchArticles,
  getAllArticles,
  updateArticleComments as dbUpdateArticleComments,
  seedDatabase
} from './firestore';

export type {
  Comment,
  ViewHistory,
  Article,
  Category,
} from './firestore';

import type { Category } from './firestore';

// We will keep categories in memory for now as they don't change often.
export const categories: Category[] = [
  { name: 'Technologie', slug: 'technologie' },
  { name: 'Actualité', slug: 'actualite' },
];

export const getPublishedArticles = dbGetPublishedArticles;
export const getArticleBySlug = dbGetArticleBySlug;
export const getArticlesByCategory = dbGetArticlesByCategory;
export const searchArticles = dbSearchArticles;
export const addArticle = dbAddArticle;
export const updateArticle = dbUpdateArticle;
export const deleteArticle = dbDeleteArticle;
export const getAdminArticles = getAllArticles;
export const updateArticleComments = dbUpdateArticleComments;
export const seedInitialArticles = seedDatabase;

