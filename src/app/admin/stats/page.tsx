
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart2, Eye, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, YAxis } from 'recharts';
import type { Article } from '@/lib/data-types';

type CategoryStats = {
  name: string;
  views: number;
};

export default function AdvancedStatsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/articles');
        if (!response.ok) throw new Error('Failed to fetch articles');
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error('Error fetching stats data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const popularArticles = useMemo(() => {
    return [...articles]
      .filter(a => a.status === 'published')
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [articles]);

  const categoryViews = useMemo(() => {
    const views: Record<string, number> = {};
    articles.forEach(article => {
      if (article.status === 'published') {
        views[article.category] = (views[article.category] || 0) + article.views;
      }
    });
    return Object.entries(views)
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views);
  }, [articles]);

  const chartConfig = useMemo(() => ({
    views: {
      label: "Vues",
    },
    Technologie: {
      label: "Technologie",
      color: "hsl(var(--primary))", // Bleu
    },
    Actualité: {
      label: "Actualité",
      color: "hsl(var(--secondary))", // Orange
    },
  }), []);


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Chargement des statistiques...</p>
      </div>
    );
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
        <h1 className="text-3xl font-headline font-bold text-foreground">
          Statistiques Avancées
        </h1>
        <p className="text-muted-foreground mt-2">
          Analyse des performances de votre contenu.
        </p>
      </header>

      <main className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Articles les Plus Populaires
            </CardTitle>
            <CardDescription>
              Les 5 articles les plus vus sur votre site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre de l'article</TableHead>
                  <TableHead className="text-right">Vues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularArticles.map(article => (
                  <TableRow key={article.slug}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/stats/${article.slug}`} className="hover:underline">
                        {article.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {article.views.toLocaleString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              Vues par Catégorie
            </CardTitle>
            <CardDescription>
              Répartition des vues totales pour chaque catégorie d'articles publiés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryViews.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer>
                  <BarChart data={categoryViews} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={100}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'hsl(var(--accent))' }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="views" layout="vertical" radius={4}>
                      {categoryViews.map((entry) => (
                        <Bar
                          key={`bar-${entry.name}`}
                          dataKey="views"
                          name={entry.name}
                          fill={chartConfig[entry.name as keyof typeof chartConfig]?.color}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>Aucune donnée de vue disponible pour les catégories.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
