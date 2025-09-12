
import { articles } from '@/lib/data';
import { ArticleCard } from '@/components/article/article-card';
import { Separator } from '@/components/ui/separator';

export default function Home() {

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          The Day Info
        </h1>
        <p className="mt-3 text-lg text-muted-foreground sm:text-xl">
          Votre dose quotidienne d'information, organisée pour les esprits curieux.
        </p>
      </header>

      <main>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </main>
    </div>
  );
}
