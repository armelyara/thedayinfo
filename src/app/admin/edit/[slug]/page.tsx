'use client';

import { getArticleBySlug } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import EditArticleForm from './edit-article-form';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/data';


type EditArticlePageProps = {
  params: {
    slug: string;
  };
};

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchArticle() {
        const fetchedArticle = await getArticleBySlug(params.slug);
        setArticle(fetchedArticle);
        setIsLoading(false);
    }
    fetchArticle();
  }, [params.slug]);


  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Chargement...</div>
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold">Modifier l'Article</h1>
        <p className="text-muted-foreground mt-2">
          Modifiez les détails de votre article ci-dessous.
        </p>
      </header>
      <main>
        <EditArticleForm article={article} />
      </main>
    </div>
  );
}
