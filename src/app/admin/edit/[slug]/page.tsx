
'use client';

import { notFound, useParams } from 'next/navigation';
import EditArticleForm from './edit-article-form';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/data';
import { getArticleAction } from './actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';


type EditArticlePageProps = {
  params: {
    slug: string;
  };
};

export default function EditArticlePage() {
  const params = useParams(); // Utiliser le hook
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchArticle() {
        const fetchedArticle = await getArticleAction(slug);
        setArticle(fetchedArticle);
        setIsLoading(false);
    }
    fetchArticle();
  }, [slug]);


  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Chargement...</div>
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au Tableau de Bord
        </Link>
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

    