'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Eye,
  MessageCircle,
  TrendingUp,
  Trash2,
  Link2,
  Check,
  Search,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Article } from '@/lib/data-types';
import { deleteArticleAction } from '@/app/admin/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ArticlesListProps {
  initialArticles: Article[];
}

export function ArticlesList({ initialArticles }: ArticlesListProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Get unique categories
  const categories = Array.from(new Set(articles.map(a => a.category))).sort();

  // Filter and sort articles
  const filteredArticles = articles
    .filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'date-asc':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'views-desc':
          return b.views - a.views;
        case 'views-asc':
          return a.views - b.views;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  const handleDeleteClick = (article: Article) => {
    setArticleToDelete(article);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!articleToDelete) return;

    const result = await deleteArticleAction(articleToDelete.slug);

    if (result.success) {
      toast({
        title: 'Article supprimé',
        description: `L'article "${articleToDelete.title}" a été supprimé.`,
      });
      setArticles(prev => prev.filter(a => a.slug !== articleToDelete.slug));
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Impossible de supprimer l\'article.',
      });
    }

    setIsDeleteDialogOpen(false);
    setArticleToDelete(null);
  };

  const handleCopyLink = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const baseUrl = window.location.origin;
    const articleUrl = `${baseUrl}/blog/${article.slug}`;

    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopiedSlug(article.slug);
      toast({
        title: 'Lien copié !',
        description: 'Le lien de l\'article a été copié dans le presse-papiers.',
      });

      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de copier le lien.',
      });
    }
  };

  if (initialArticles.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun article</h3>
          <p className="text-muted-foreground">
            Vos articles publiés apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="published">Publiés</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="scheduled">Programmés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (plus récent)</SelectItem>
                <SelectItem value="date-asc">Date (plus ancien)</SelectItem>
                <SelectItem value="views-desc">Vues (plus vu)</SelectItem>
                <SelectItem value="views-asc">Vues (moins vu)</SelectItem>
                <SelectItem value="title-asc">Titre (A-Z)</SelectItem>
                <SelectItem value="title-desc">Titre (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''} trouvé{filteredArticles.length > 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <Card key={article.slug} className="relative group">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={article.status === 'published' ? `/blog/${article.slug}` : `/admin/edit/${article.slug}`}
                      className="hover:underline"
                    >
                      <CardTitle className="text-lg break-words">
                        {article.title}
                      </CardTitle>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                        {article.status === 'published' ? 'Publié' : article.status === 'scheduled' ? 'Programmé' : 'Brouillon'}
                      </Badge>
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>Par {article.author}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{format(new Date(article.publishedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.views.toLocaleString('fr-FR')} vues
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {article.comments?.length || 0} commentaire{(article.comments?.length || 0) > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                    {article.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleCopyLink(article, e)}
                      >
                        {copiedSlug === article.slug ? (
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                        ) : (
                          <Link2 className="w-4 h-4 mr-2" />
                        )}
                        Copier le lien
                      </Button>
                    )}

                    <Link href={`/admin/stats/${article.slug}`}>
                      <Button variant="outline" size="sm">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Statistiques
                      </Button>
                    </Link>

                    <Link href={`/admin/edit/${article.slug}`}>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </Link>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteClick(article);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article "{articleToDelete?.title}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
