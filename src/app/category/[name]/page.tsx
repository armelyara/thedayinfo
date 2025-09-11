import { notFound } from 'next/navigation';
import { getArticlesByCategory, categories } from '@/lib/data';
import { ArticleCard } from '@/components/article/article-card';
import { Badge } from '@/components/ui/badge';

type CategoryPageProps = {
  params: {
    name: string;
  };
};

export async function generateStaticParams() {
  return categories.map((category) => ({
    name: category.slug,
  }));
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const category = categories.find(c => c.slug === params.name);
  const articlesInCategory = getArticlesByCategory(params.name);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 border-b pb-6">
        <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">
          Category: <span className="text-primary">{category.name}</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Browsing {articlesInCategory.length} articles in the "{category.name}" category.
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
            <h2 className="text-2xl font-semibold">No Articles Found</h2>
            <p className="text-muted-foreground mt-2">
              There are no articles in this category yet. Check back soon!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
