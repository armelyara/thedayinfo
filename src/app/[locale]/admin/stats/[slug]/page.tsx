// src/app/admin/stats/[slug]/page.tsx
'use client';

import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, Eye, MessageCircle, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Article } from '@/lib/data-types';

type StatsPageProps = {
  params: {
    slug: string;
  };
};

type ChartDataItem = {
  date: Date;
  views: number;
  formattedDate: string;
};

export default function StatsPage() {
  const params = useParams(); // Utiliser le hook
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/articles/${slug}`);
        
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

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

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

  // Préparation des données pour le graphique
  const viewHistory = article.viewHistory || [];
  
  const chartData: ChartDataItem[] = viewHistory.map(item => ({
    ...item,
    date: typeof item.date === 'string' ? parseISO(item.date) : new Date(item.date),
    formattedDate: format(
      typeof item.date === 'string' ? parseISO(item.date) : new Date(item.date),
      'dd/MM',
      { locale: fr }
    )
  }));

  const totalViewsFromHistory = viewHistory.reduce((acc, item) => acc + (item.views || 0), 0);

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Vues Actuelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{article.views.toLocaleString('fr-FR')}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Vues Historiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViewsFromHistory.toLocaleString('fr-FR')}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Commentaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{article.comments?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Publication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {format(new Date(article.publishedAt), 'dd/MM/yyyy', { locale: fr })}
                </div>
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
                    dataKey="formattedDate"
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
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return format(data.date, 'dd MMMM yyyy', { locale: fr });
                      }
                      return label;
                    }}
                    formatter={(value: number) => [value.toLocaleString('fr-FR'), 'Vues']}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    name="Vues"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune donnée d'historique disponible</p>
                  <p className="text-sm">Les statistiques apparaîtront ici au fur et à mesure des visites</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auteur:</span>
                <span className="font-medium">{article.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catégorie:</span>
                <span className="font-medium">{article.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut:</span>
                <span className="font-medium">{article.status === 'published' ? 'Publié' : 'Programmé'}</span>
              </div>
              {article.scheduledFor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Programmé pour:</span>
                  <span className="font-medium">
                    {format(new Date(article.scheduledFor), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Résumé des interactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vues totales:</span>
                <span className="font-medium">{article.views.toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commentaires:</span>
                <span className="font-medium">{article.comments?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Données historiques:</span>
                <span className="font-medium">{viewHistory.length} points</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
