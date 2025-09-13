'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { categories, type Comment as CommentType, type Article } from '@/lib/data';
import { Book, LayoutGrid, Users, FilePenLine, Trash2, Eye, BarChart2, MessageSquare, Send, Reply } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { deleteArticleAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { getAdminArticles } from '@/lib/data';
import { updateArticleComments } from '@/lib/data';


function CommentSection({ article, onCommentsUpdate }: { article: Article, onCommentsUpdate: (slug: string, comments: CommentType[]) => void }) {
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, startTransition] = useTransition();
    
    const handleReplySubmit = async (e: React.FormEvent, parentCommentId: number) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        const parentComment = article.comments.find(c => c.id === parentCommentId);
        if (!parentComment) return;

        const newComment: CommentType = {
            id: Date.now(),
            author: 'L\'Auteur', 
            text: `En réponse à ${parentComment.author}: ${replyText.trim()}`,
            avatar: 'https://picsum.photos/seed/author-pic/40/40' 
        };
        
        const parentIndex = article.comments.findIndex(c => c.id === parentCommentId);
        const newComments = [...article.comments];
        newComments.splice(parentIndex + 1, 0, newComment);
        
        startTransition(async () => {
          try {
              await updateArticleComments(article.slug, newComments);
              onCommentsUpdate(article.slug, newComments);
              setReplyText('');
              setReplyingTo(null);
          } catch (error) {
              console.error("Failed to submit reply:", error);
              // Optionally show a toast error
          }
        });
    };

    const toggleReply = (commentId: number) => {
        if (replyingTo === commentId) {
            setReplyingTo(null);
        } else {
            setReplyingTo(commentId);
            setReplyText('');
        }
    };

    return (
        <div className="p-4">
             <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-4">
                {article.comments.length > 0 ? article.comments.map(comment => (
                    <div key={comment.id}>
                        <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 border">
                                <AvatarImage src={comment.avatar} />
                                <AvatarFallback><User size={16}/></AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted/50 p-3 rounded-md">
                                <p className="font-semibold text-sm">{comment.author}</p>
                                <p className="text-sm text-muted-foreground">{comment.text}</p>
                                 <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="mt-2 text-xs h-auto px-2 py-1"
                                    onClick={() => toggleReply(comment.id)}
                                >
                                    <Reply className="mr-1 h-3 w-3" />
                                    Répondre
                                </Button>
                            </div>
                        </div>

                        {replyingTo === comment.id && (
                             <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex gap-2 items-start mt-2 ml-11">
                                <Textarea
                                    placeholder={`Répondre à ${comment.author}...`}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="flex-1"
                                    rows={2}
                                />
                                <Button type="submit" size="sm" disabled={!replyText.trim() || isSubmitting}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {isSubmitting ? 'Envoi...' : 'Envoyer'}
                                </Button>
                            </form>
                        )}
                    </div>
                )) : <p className="text-sm text-muted-foreground">Aucun commentaire pour cet article.</p>}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingCommentsOf, setViewingCommentsOf] = useState<Article | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchArticles() {
      try {
        const fetchedArticles = await getAdminArticles();
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        toast({
            variant: 'destructive',
            title: 'Erreur de chargement',
            description: 'Impossible de charger les articles depuis la base de données.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticles();
  }, [toast]);
  
  const totalArticles = articles.length;
  const totalCategories = categories.length;
  const authors = new Set(articles.map((a) => a.author));
  const totalAuthors = authors.size;

  const sortedArticles = [...articles].sort((a, b) => parseISO(b.publicationDate).getTime() - parseISO(a.publicationDate).getTime());

  const handleCommentsUpdate = (slug: string, updatedComments: CommentType[]) => {
    setArticles(currentArticles => 
      currentArticles.map(a => 
        a.slug === slug ? { ...a, comments: updatedComments } : a
      )
    );
    // Also update the article in the dialog
    if (viewingCommentsOf?.slug === slug) {
        setViewingCommentsOf(prev => prev ? {...prev, comments: updatedComments} : null);
    }
  };

  const handleDelete = (slug: string) => {
    startTransition(async () => {
        const result = await deleteArticleAction(slug);
        if (result.success) {
            setArticles(currentArticles => currentArticles.filter(a => a.slug !== slug));
            toast({
                title: 'Article Supprimé',
                description: 'L\'article a été supprimé avec succès.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: result.error || 'Impossible de supprimer l\'article.',
            });
        }
    });
  };

  if (isLoading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-headline font-bold mb-8">Chargement du Tableau de Bord...</h1>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold">Tableau de Bord Admin</h1>
          <p className="text-muted-foreground mt-2">
            Un aperçu de votre contenu publié.
          </p>
        </div>
        <Link href="/admin/create-article">
          <Button className="w-full sm:w-auto">Écrire un Nouvel Article</Button>
        </Link>
      </header>
      <main className="grid gap-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des Articles</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalArticles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories</CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des Auteurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAuthors}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Articles Publiés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {sortedArticles.map((article) => (
                    <div key={article.slug} className="group flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Link href={`/article/${article.slug}`} className="flex-shrink-0">
                            <Image
                                src={article.image.src}
                                alt={article.image.alt}
                                width={80}
                                height={60}
                                className="rounded-md object-cover aspect-[4/3]"
                            />
                        </Link>
                        <div className="flex-1">
                            <Link href={`/article/${article.slug}`} className="hover:underline">
                                <h3 className="font-medium">{article.title}</h3>
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{format(parseISO(article.publicationDate), 'd MMM yyyy', { locale: fr })}</span>
                                &middot;
                                <span>{article.category}</span>
                                &middot;
                                <Badge variant={article.status === 'published' ? 'secondary' : 'default'} className="text-xs px-1.5 py-0">
                                    {article.status === 'published' ? 'Publié' : 'Programmé'}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {/* Stats */}
                            <Link href={`/admin/stats/${article.slug}`} className="flex items-center gap-1 hover:text-primary" title="Vues">
                                <BarChart2 className="h-4 w-4" />
                                <span>{article.views}</span>
                            </Link>
                           
                            <Dialog onOpenChange={(isOpen) => !isOpen && setViewingCommentsOf(null)}>
                                <DialogTrigger asChild>
                                    <button onClick={() => setViewingCommentsOf(article)} className="flex items-center gap-1 cursor-pointer hover:text-primary" title="Commentaires">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>{article.comments.length}</span>
                                    </button>
                                </DialogTrigger>
                            </Dialog>

                            {/* Hover Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/article/${article.slug}`} title="Voir l'article">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href={`/admin/edit/${article.slug}`} title="Modifier l'article">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                </Link>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Supprimer l'article">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action ne peut pas être annulée. Cela supprimera définitivement
                                            l'article et effacera ses données de nos serveurs.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(article.slug)} disabled={isPending}>
                                            {isPending ? 'Suppression...' : 'Continuer'}
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
        
        {viewingCommentsOf && (
             <Dialog open onOpenChange={(isOpen) => !isOpen && setViewingCommentsOf(null)}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Commentaires pour "{viewingCommentsOf.title}"</DialogTitle>
                    </DialogHeader>
                    <CommentSection 
                        article={viewingCommentsOf}
                        onCommentsUpdate={handleCommentsUpdate}
                    />
                </DialogContent>
            </Dialog>
        )}
      </main>
    </div>
  );
}
