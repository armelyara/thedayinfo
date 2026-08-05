// src/app/blog/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getArticleBySlug, getProfile } from '@/lib/data-admin';
import { SITE_URL, excerptFromHtml, articleJsonLd } from '@/lib/seo';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, User } from 'lucide-react';
import AiSummary from '@/components/article/ai-summary';
import RelatedContent from '@/components/article/related-content';
import Feedback from '@/components/article/feedback';
import { ArticleClientWrapper } from '@/components/article/article-client-wrapper';
import { SubscriptionModal } from '@/components/newsletter/subscription-modal';
import ViewTracker from '@/components/article/view-tracker';
import { SanitizedContent } from '@/components/ui/sanitized-content';
import { HtmlArticleFrame } from '@/components/article/html-article-frame';

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};


export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || article.status !== 'published') {
    return { title: 'Article introuvable', robots: { index: false, follow: false } };
  }

  const description = excerptFromHtml(article.content);
  const url = `${SITE_URL}/blog/${article.slug}`;
  const images = article.image?.src ? [{ url: article.image.src, alt: article.image.alt || article.title }] : undefined;

  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url,
      publishedTime: article.publishedAt,
      authors: [article.author],
      section: article.category,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

/** Returns true when the content is a self-contained HTML document (has script/style/html tags). */
function isHtmlArticle(content: string): boolean {
  if (!content) return false;
  return /<script[\s>]/i.test(content) || /<style[\s>]/i.test(content) || /<html[\s>]/i.test(content);
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  // Retrieval of the author's real photo
  const profile = await getProfile();

  if (!article || article.status !== 'published') {
    notFound();
  }

  const displayTitle = article.title;
  const displayContent = article.content;
  const htmlMode = isHtmlArticle(displayContent);

  // Structured data (BlogPosting) for rich results
  const jsonLd = articleJsonLd(article);

  // Utiliser la photo du profil si l'auteur est "Armel Yara"
  const authorAvatar = article.author === 'Armel Yara' && profile?.imageUrl
    ? profile.imageUrl
    : '/default-avatar.png';

  // ─── HTML-mode article: render the full document in an isolated iframe ───
  if (htmlMode) {
    return (
      <div className="w-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Client-side view tracking */}
        <ViewTracker articleSlug={article.slug} />

        {/* Full-width sandboxed iframe — preserves all CSS, JS and animations */}
        <HtmlArticleFrame content={displayContent} title={displayTitle} />

        {/* Standard engagement section below the article */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          <AiSummary articleContent={displayContent} />

          <RelatedContent
            currentArticleTitle={displayTitle}
            articleContent={displayContent}
          />

          <Feedback
            articleSlug={article.slug}
            initialViews={article.views}
            initialComments={article.comments || []}
          />

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg text-center border">
            <h3 className="text-lg font-semibold mb-2">📧 Restez informé</h3>
            <p className="text-muted-foreground mb-4">
              Recevez une notification par email à chaque nouvel article ou modification
            </p>
            <SubscriptionModal />
          </div>

          <ArticleClientWrapper
            articleSlug={article.slug}
            initialComments={article.comments || []}
          />
        </div>
      </div>
    );
  }

  // ─── Normal article: standard prose rendering ───
  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Client-side view tracking with deduplication */}
      <ViewTracker articleSlug={article.slug} />

      <header className="mb-8">
        <Badge variant="secondary" className="mb-4">{article.category}</Badge>
        <h1 className="text-4xl font-headline font-extrabold tracking-tight lg:text-5xl mb-4">
          {displayTitle}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={authorAvatar} alt={article.author} />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
            <span>{article.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC'
              })}
            </time>
          </div>
        </div>
      </header>

      {article.image?.src && (
        <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
          <Image
            src={article.image.src}
            alt={article.image.alt || article.title}
            fill
            priority
            className="object-cover"
            data-ai-hint={article.image.aiHint}
          />
        </div>
      )}

      <SanitizedContent content={displayContent} className="mb-12" />

      <section className="space-y-12">
        <AiSummary articleContent={displayContent} />

        <RelatedContent
          currentArticleTitle={displayTitle}
          articleContent={displayContent}
        />

        <Feedback
          articleSlug={article.slug}
          initialViews={article.views}
          initialComments={article.comments || []}
        />

        {/* Section d'abonnement newsletter */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg text-center border">
          <h3 className="text-lg font-semibold mb-2">📧 Restez informé</h3>
          <p className="text-muted-foreground mb-4">
            Recevez une notification par email à chaque nouvel article ou modification
          </p>
          <SubscriptionModal />
        </div>

        {/* Section des commentaires publics - Wrapper client */}
        <ArticleClientWrapper
          articleSlug={article.slug}
          initialComments={article.comments || []}
        />
      </section>
    </article>
  );
}
