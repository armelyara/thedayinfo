import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getArticleBySlug, getProfile } from '@/lib/data-client';
import type { Comment } from '@/lib/data-types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, User } from 'lucide-react';
import AiSummary from '@/components/article/ai-summary';
import RelatedContent from '@/components/article/related-content';
import Feedback from '@/components/article/feedback';
import { parseISO } from 'date-fns';
import { PublicCommentsSection } from '@/components/article/public-comments-section';
import { ArticleClientWrapper } from '@/components/article/article-client-wrapper';
import { SubscriptionModal } from '@/components/newsletter/subscription-modal';
import { getAuthorAvatar, getAuthorAvatarFromProfile } from '@/lib/avatar-utils';

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 0;

export default async function ArticlePage({ params }: ArticlePageProps) {
  // Await params before using its properties
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || article.status !== 'published') {
    notFound();
  }

  // Récupérer le profil pour avoir la photo
  const profile = await getProfile();
  const authorAvatar = getAuthorAvatarFromProfile(
    article.author === profile?.name ? profile?.imageUrl : undefined,
    article.author
  );

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <Badge variant="secondary" className="mb-4">{article.category}</Badge>
        <h1 className="text-4xl font-headline font-extrabold tracking-tight lg:text-5xl mb-4">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAuthorAvatar(article.author)} />
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

      <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
        <Image
          src={article.image.src}
          alt={article.image.alt}
          fill
          priority
          className="object-cover"
          data-ai-hint={article.image.aiHint}
        />
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none mb-12"
           dangerouslySetInnerHTML={{ __html: article.content }} />

      <section className="space-y-12">
        <AiSummary articleContent={article.content} />
        <RelatedContent
          currentArticleTitle={article.title}
          articleContent={article.content}
        />
        <Feedback
          articleSlug={article.slug}
          initialViews={article.views}
          initialComments={article.comments || []}
          initialLikes={article.likes || 0}      // Valeur par défaut
          initialDislikes={article.dislikes || 0}
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
