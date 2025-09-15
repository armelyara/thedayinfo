import { getPublishedArticles, seedInitialArticles, type Article } from '@/lib/data';
import { ArticleCard } from '@/components/article/article-card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 3600; // Revalidate every hour

const MissingIndexError = ({ message }: { message: string }) => {
  // Extract the URL from the message
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = message.match(urlRegex);
  const url = match ? match[0] : null;

  return (
    <Alert variant="destructive" className="my-8">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Erreur de Configuration de la Base de Données</AlertTitle>
      <AlertDescription>
        <p>
          La requête pour afficher les articles a échoué car un index composite est manquant dans Firestore.
          Ceci est une étape de configuration requise pour les requêtes complexes.
        </p>
        {url && (
          <p className="mt-2">
            Veuillez cliquer sur le lien ci-dessous pour créer l'index requis. La création peut prendre quelques minutes.
            Une fois l'index créé, cette page fonctionnera correctement.
          </p>
        )}
         {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-destructive-foreground hover:underline mt-4 block break-all">
             Créer l'Index Firestore
            </a>
          ) : (
            <p className='mt-2 break-all'>{message}</p>
          )}
      </AlertDescription>
    </Alert>
  );
};

export default async function Home() {
  // Seed initial articles if the collection is empty.
  // In a real app, this might be a one-time script.
  await seedInitialArticles();

  const articlesResult = await getPublishedArticles();

  // Type guard pour vérifier si c'est une erreur
  const isErrorResult = (result: any): result is { error: string; message: string } => {
    return result && typeof result === 'object' && 'error' in result;
  };

  if (isErrorResult(articlesResult) && articlesResult.error === 'missing_index') {
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
             <MissingIndexError message={articlesResult.message} />
          </main>
       </div>
    )
  }

  // À ce point, TypeScript sait que articlesResult est Article[]
  const articles = articlesResult as Article[];

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
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <p>Aucun article publié pour le moment. Revenez bientôt !</p>
        )}
      </main>
    </div>
  );
}