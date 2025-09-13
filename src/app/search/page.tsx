
'use client';

import { useSearchParams } from 'next/navigation';
import { searchArticles, type Article } from '@/lib/data';
import { ArticleCard } from '@/components/article/article-card';
import { Suspense, useEffect, useState } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function performSearch() {
      if (query) {
        setIsLoading(true);
        try {
          const articles = await searchArticles(query);
          setResults(articles);
        } catch (error) {
          console.error("Search failed:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsLoading(false);
      }
    }
    performSearch();
  }, [query]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Recherche en cours...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 border-b pb-6">
        <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">
          Résultats de la Recherche
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {results.length > 0
            ? `${results.length} article(s) trouvé(s) pour `
            : `Aucun article trouvé pour `}
          <span className="font-semibold text-primary">"{query}"</span>
        </p>
      </header>
      <main>
        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {results.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold">Rien n'a été trouvé</h2>
            <p className="text-muted-foreground mt-2">
              Essayez de rechercher autre chose.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SearchResults />
        </Suspense>
    )
}
