
'use client';

import { notFound } from 'next/navigation';
import { type Article, getArticleBySlug } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

type StatsPageProps = {
  params: {
    slug: string;
  };
};

export default function StatsPage({ params }: StatsPageProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
        const fetchedArticle = await getArticleBySlug(params.slug);
        if (fetchedArticle) {
            setArticle(fetchedArticle);
        }
        setIsLoading(false);
    }
    fetchArticle();
  }, [params.slug]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Chargement des statistiques...</div>
  }

  if (!article) {
    notFound();
  }

  const chartData = article.viewHistory.map(item => ({
    ...item,
    date: parseISO(item.date),
  }));

  const totalViews = article.viewHistory.reduce((acc, item) => acc + item.views, 0);

  return (
    <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au Tableau de Bord
            </Link>
            <h1 className="text-2xl font-headline font-bold text-foreground">
                Statistiques pour : <span className="text-primary">{article.title}</span>
            </h1>
        </header>

      <main>
        <Card>
            <CardHeader>
                <CardTitle>Historique des Vues</CardTitle>
                <CardDescription>
                    Total des vues pour cet article : <span className="font-bold text-foreground">{totalViews.toLocaleString('fr-FR')}</span>
                </CardDescription>
            </CardHeader>
          <CardContent className="h-96 w-full">
            <ResponsiveContainer>
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
                  tickFormatter={(date) => format(date, 'MMM yy', { locale: fr })}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                    }}
                    labelFormatter={(label) => format(new Date(label), 'd MMMM yyyy', { locale: fr })}
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
