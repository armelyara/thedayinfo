
import { getArticleBySlug } from '@/lib/data';
import { notFound } from 'next/navigation';
import EditArticleForm from './edit-article-form';

type EditArticlePageProps = {
  params: {
    slug: string;
  };
};

export default function EditArticlePage({ params }: EditArticlePageProps) {
  const article = getArticleBySlug(params.slug);

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
