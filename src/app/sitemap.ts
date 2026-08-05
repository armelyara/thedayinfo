import type { MetadataRoute } from 'next';
import { getPublishedArticles, getProjects } from '@/lib/data-admin';
import { SITE_URL } from '@/lib/seo';

// Firestore-backed: must run at request time, never at build (getDb throws when IS_BUILD=true).
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/projets`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let articleRoutes: MetadataRoute.Sitemap = [];
  let projectRoutes: MetadataRoute.Sitemap = [];

  try {
    const articles = await getPublishedArticles();
    if (Array.isArray(articles)) {
      articleRoutes = articles.map((article) => ({
        url: `${SITE_URL}/blog/${article.slug}`,
        lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('[sitemap] Failed to load articles:', error);
  }

  try {
    const projects = await getProjects();
    projectRoutes = projects.map((project) => ({
      url: `${SITE_URL}/projets/${project.slug}`,
      lastModified: project.updatedAt ? new Date(project.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch (error) {
    console.error('[sitemap] Failed to load projects:', error);
  }

  return [...staticRoutes, ...articleRoutes, ...projectRoutes];
}
