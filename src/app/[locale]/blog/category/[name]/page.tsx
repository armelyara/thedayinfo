import { notFound } from 'next/navigation';
import { getArticlesByCategory } from '@/lib/data-client';
import { ArticleCard } from '@/components/article/article-card';
import { categories } from '@/components/layout/main-layout';
import type { Article } from '@/lib/data-types';

type CategoryPageProps = {
  params: {
    name: string;
  };
};

export const revalidate = 3600; // Revalidate every hour

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params;
  const category = categories.find(c => c.slug === name);
  
  if (!category) {
    notFound();
  }
  
  const articlesInCategory = await getArticlesByCategory(name, categories); // Corrigé: utilisez 'name' au lieu de 'params.name'

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 border-b pb-6">
        <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">
          Catégorie : <span className="text-primary">{category.name}</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Affichage de {articlesInCategory.length} articles dans la catégorie "{category.name}".
        </p>
      </header>
      <main>
        {articlesInCategory.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articlesInCategory.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold">Aucun Article Trouvé</h2>
            <p className="text-muted-foreground mt-2">
              Il n'y a pas encore d'articles dans cette catégorie. Revenez bientôt !
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
