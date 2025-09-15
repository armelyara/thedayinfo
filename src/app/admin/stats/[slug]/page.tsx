'use client';

import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types définis localement pour éviter d'importer data.ts
type ViewHistory = {
  date: string;
  views: number;
};

type Comment = {
  id: number;
  author: string;
  text: string;
  avatar: string;
};

type Article = {
  slug: string;
  title: string;
  author: string;
  category: string;
  publicationDate: string;
  status: 'published' | 'scheduled';
  scheduledFor?: string;
  image: {
    id: string;
    src: string;
    alt: string;
    aiHint: string;
  };
  content: string;
  views: number;
  comments: Comment[];
  viewHistory: ViewHistory[];
};

type StatsPageProps = {
  params: {
    slug: string;
  };
};

type ChartDataItem = {
  date: Date;
  views: number;
};

export default function StatsPage({ params }: StatsPageProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/articles/${params.slug}`);
        
        if (response.status === 404) {
          setError('Article non trouvé');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement');
        }
        
        const fetchedArticle = await response.json();
        setArticle(fetchedArticle);
        
      } catch (err) {
        console.error('Erreur lors du chargement de l\'article:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    }

    if (params.slug) {
      fetchArticle();
    }
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Chargement des statistiques...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    notFound();
  }

  // Vérification de la sécurité pour viewHistory
  const viewHistory = article.viewHistory || [];
  
  const chartData: ChartDataItem[] = viewHistory.map(item => ({
    ...item,
    date: typeof item.date === 'string' ? parseISO(item.date) : new Date(item.date),
  }));

  const totalViews = viewHistory.reduce((acc, item) => acc + (item.views || 0), 0);

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
        <h1 className="text-2xl font-headline font-bold text-foreground">
          Statistiques pour : <span className="text-primary">{article.title}</span>
        </h1>
      </header>

      <main>
        <div className="grid gap-6 mb-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total des Vues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{article.views.toLocaleString('fr-FR')}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Vues Historiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews.toLocaleString('fr-FR')}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Commentaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{article.comments?.length || 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des Vues</CardTitle>
            <CardDescription>
              Évolution des vues dans le temps
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => {
                      try {
                        return format(new Date(date), 'MMM yy', { locale: fr });
                      } catch {
                        return 'Invalid Date';
                      }
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(label) => {
                      try {
                        return format(new Date(label), 'd MMMM yyyy', { locale: fr });
                      } catch {
                        return 'Date invalide';
                      }
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    name="Vues"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Aucune donnée historique disponible</p>
                  <p className="text-sm text-muted-foreground">
                    Les données de vue s'accumuleront au fil du temps
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}