// src/app/article/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getArticleBySlug, getProfile } from '@/lib/data-client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, User } from 'lucide-react';
import AiSummary from '@/components/article/ai-summary';
import RelatedContent from '@/components/article/related-content';
import Feedback from '@/components/article/feedback';
import { ArticleClientWrapper } from '@/components/article/article-client-wrapper';
import { SubscriptionModal } from '@/components/newsletter/subscription-modal';

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 0;

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  
  // Récupérer le profil pour obtenir la vraie photo de l'auteur
  const profile = await getProfile();

  if (!article || article.status !== 'published') {
    notFound();
  }

  // Utiliser la photo du profil si l'auteur est "Armel Yara"
  const authorAvatar = article.author === 'Armel Yara' && profile?.imageUrl 
    ? profile.imageUrl 
    : '/default-avatar.png';

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
          initialComments={article.comments || []} initialLikes={0} initialDislikes={0}        />
        
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