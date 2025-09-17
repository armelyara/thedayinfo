// src/app/admin/page.tsx - Mise à jour avec les abonnés
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  FileText, 
  Users, 
  TrendingUp, 
  Eye, 
  MessageCircle,
  Mail,
  UserCheck,
  Calendar,
  BarChart3,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Article } from '@/lib/data';

type DashboardStats = {
  totalArticles: number;
  publishedArticles: number;
  totalViews: number;
  totalComments: number;
  totalSubscribers: number;
  activeSubscribers: number;
};

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    publishedArticles: 0,
    totalViews: 0,
    totalComments: 0,
    totalSubscribers: 0,
    activeSubscribers: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Récupérer les articles
      const articlesResponse = await fetch('/api/admin/articles');
      const articlesData = await articlesResponse.json();
      setArticles(articlesData);

      // Récupérer les stats des abonnés
      const subscribersResponse = await fetch('/api/subscribers');
      const subscribersData = await subscribersResponse.json();

      // Calculer les statistiques
      const totalViews = articlesData.reduce((sum: number, article: Article) => sum + article.views, 0);
      const totalComments = articlesData.reduce((sum: number, article: Article) => sum + (article.comments?.length || 0), 0);
      const publishedArticles = articlesData.filter((article: Article) => article.status === 'published').length;
      const activeSubscribers = subscribersData.filter((sub: any) => sub.status === 'active').length;

      setStats({
        totalArticles: articlesData.length,
        publishedArticles,
        totalViews,
        totalComments,
        totalSubscribers: subscribersData.length,
        activeSubscribers
      });
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des statistiques...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            Tableau de Bord Admin
          </h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de votre site d'actualités
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/subscribers">
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Gérer les Abonnés
            </Button>
          </Link>
          <Link href="/admin/create-article">
            <Button className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Nouvel Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedArticles} publiés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vues</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString('fr-FR')}</div>
            <p className="text-xs text-muted-foreground">
              Toutes les pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnés Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSubscribers} au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commentaires</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">
              Toutes interactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/admin/create-article">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Créer un Article
              </CardTitle>
              <CardDescription>
                Rédigez et publiez un nouvel article
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/admin/subscribers">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Gérer les Abonnés
              </CardTitle>
              <CardDescription>
                Consultez et gérez votre liste d'abonnés
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistiques Avancées
            </CardTitle>
            <CardDescription>
              Analysez les performances de votre site
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Articles récents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Articles Récents
          </CardTitle>
          <CardDescription>
            Gérez vos derniers articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun article trouvé</p>
              <Link href="/admin/create-article">
                <Button className="mt-4">Créer votre premier article</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.slice(0, 5).map((article) => (
                <div
                  key={article.slug}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{article.title}</h3>
                      <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                        {article.status === 'published' ? 'Publié' : 'Programmé'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>Par {article.author}</span>
                      <span className="mx-2">•</span>
                      <span>{article.category}</span>
                      <span className="mx-2">•</span>
                      <span>{format(new Date(article.publishedAt), 'dd/MM/yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.views.toLocaleString('fr-FR')} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {article.comments?.length || 0} commentaires
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/stats/${article.slug}`}>
                      <Button variant="outline" size="sm">
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/edit/${article.slug}`}>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              {articles.length > 5 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Et {articles.length - 5} autres articles...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}