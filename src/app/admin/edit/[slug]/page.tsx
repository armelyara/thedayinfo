'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import EditArticleForm from './edit-article-form';
import { useEffect, useState } from 'react';
import type { Article, Draft } from '@/lib/data-types';
import { getArticleAction, getDraftAction } from './actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const slugOrId = params.slug as string;

  const [articleData, setArticleData] = useState<Article | Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Hypothèse : si le slug contient 'draft_', c'est un brouillon.
      // Une meilleure approche serait d'avoir une URL dédiée comme /edit-draft/:id
      const editingDraft = router.pathname?.includes('/edit-draft/');
      setIsDraft(editingDraft);

      let data: Article | Draft | null = null;
      try {
        if (editingDraft) {
          data = await getDraftAction(slugOrId);
        } else {
          data = await getArticleAction(slugOrId);
        }

        if (!data) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Élément non trouvé.' });
          router.push('/admin');
        } else {
          setArticleData(data);
        }
      } catch (error) {
        console.error("Failed to fetch data for editing", error);
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: 'Impossible de récupérer les données.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [slugOrId, router, toast]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Chargement...</div>;
  }

  if (!articleData) {
    // Redirection gérée dans le useEffect, ceci est un fallback.
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
        <h1 className="text-4xl font-headline font-bold">{isDraft ? "Modifier le Brouillon" : "Modifier l'Article"}</h1>
        <p className="text-muted-foreground mt-2">
          Modifiez les détails ci-dessous.
        </p>
      </header>
      <main>
        <EditArticleForm article={articleData as Article & Draft} isDraft={isDraft} />
      </main>
    </div>
  );
}
