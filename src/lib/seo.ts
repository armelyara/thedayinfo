import type { Article, Project } from './data-types';

/** Canonical production origin (no trailing slash, non-www). Mirrors metadataBase. */
export const SITE_URL = 'https://thedayinfo.com';

export const SITE_NAME = 'The Day Info';
export const SITE_DESCRIPTION = 'Initiative axée sur la recherche appliquée : IA, développement logiciel et solutions technologiques.';

/** Strips HTML tags (and script/style blocks) to plain text for descriptions. */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Builds a meta-description-length excerpt (default 160 chars) from HTML content. */
export function excerptFromHtml(html: string, maxLength = 160): string {
  const text = stripHtmlToText(html);
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}

/** JSON-LD BlogPosting for an article page. Returned as a plain object, serialize before injecting. */
export function articleJsonLd(article: Article): Record<string, unknown> {
  const url = `${SITE_URL}/blog/${article.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: excerptFromHtml(article.content),
    image: article.image?.src ? [article.image.src] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    articleSection: article.category,
  };
}

/** JSON-LD Organization + WebSite for the homepage. */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
    sameAs: [
      'https://x.com/the_day_info',
      'https://www.facebook.com/thedayinfo/',
      'https://www.linkedin.com/company/thedayinfo',
      'https://github.com/armelyara',
    ],
  };
}

/** JSON-LD for a project page (CreativeWork). */
export function projectJsonLd(project: Project): Record<string, unknown> {
  const url = `${SITE_URL}/projets/${project.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    image: project.image?.src ? [project.image.src] : undefined,
    url,
    keywords: project.technologies?.join(', '),
    dateCreated: project.startDate,
  };
}
