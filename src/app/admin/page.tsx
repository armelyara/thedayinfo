
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { articles, categories, Comment as CommentType, Article } from '@/lib/data';
import { Book, LayoutGrid, Users, Edit, ThumbsUp, ThumbsDown, MessageSquare, Send, CalendarDays, Reply } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


function CommentSection({ articleId, initialComments }: { articleId: string, initialComments: CommentType[] }) {
    const [comments, setComments] = useState<CommentType[]>(initialComments);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    
    const handleReplySubmit = (e: React.FormEvent, parentCommentId: number) => {
        e.preventDefault();
        if (replyText.trim()) {
            const parentComment = comments.find(c => c.id === parentCommentId);
            if (!parentComment) return;

            const newComment: CommentType = {
                id: Date.now(),
                author: 'L\'Auteur', 
                text: `En réponse à ${parentComment.author}: ${replyText.trim()}`,
                avatar: 'https://picsum.photos/seed/author-pic/40/40' 
            };
            
            const parentIndex = comments.findIndex(c => c.id === parentCommentId);
            const newComments = [...comments];
            newComments.splice(parentIndex + 1, 0, newComment);

            setComments(newComments);

            const article = articles.find(a => a.slug === articleId);
            if(article) {
                // This is a mock update, it won't persist
                article.comments = newComments;
            }

            setReplyText('');
            setReplyingTo(null);
        }
    };

    const toggleReply = (commentId: number) => {
        if (replyingTo === commentId) {
            setReplyingTo(null);
            setReplyText('');
        } else {
            setReplyingTo(commentId);
            setReplyText('');
        }
    };

    return (
        <div className="p-4">
             <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-4">
                {comments.length > 0 ? comments.map(comment => (
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
                                <Button type="submit" size="sm" disabled={!replyText.trim()}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Envoyer
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
  const [viewingCommentsOf, setViewingCommentsOf] = useState<Article | null>(null);
  const totalArticles = articles.length;
  const totalCategories = categories.length;
  const authors = new Set(articles.map((a) => a.author));
  const totalAuthors = authors.size;

  const articlesPerCategory = categories.map((category) => ({
    name: category.name,
    count: articles.filter((article) => article.category === category.name).length,
  }));

  const chartConfig = {
    count: {
      label: 'Articles',
      color: 'hsl(var(--primary))',
    },
  };

  const sortedArticles = [...articles].sort((a, b) => parseISO(b.publicationDate).getTime() - parseISO(a.publicationDate).getTime());

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
          <CardContent>
            <div className="border rounded-lg">
                {/*-- Desktop Header --*/}
                <div className="hidden md:grid grid-cols-12 items-center p-4 font-medium text-muted-foreground text-sm border-b">
                  <div className="col-span-5">Titre</div>
                  <div className="col-span-2">Catégorie</div>
                  <div className="col-span-2">Publication</div>
                  <div className="col-span-2 text-center">Statistiques</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>

                {/*-- Article List --*/}
                <div className="divide-y md:divide-y-0">
                    {sortedArticles.map((article) => (
                        <div key={article.slug} className="p-4 md:grid md:grid-cols-12 md:items-center hover:bg-muted/50">
                            
                            {/*-- Mobile Layout --*/}
                            <div className="md:hidden space-y-4">
                                <div>
                                    <h3 className="font-medium text-lg leading-tight">{article.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={article.status === 'published' ? 'secondary' : 'default'} className="text-xs">
                                            {article.status === 'published' ? 'Publié' : 'Programmé'}
                                        </Badge>
                                         <Badge variant="outline">{article.category}</Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>{format(parseISO(article.publicationDate), 'd MMM yyyy', { locale: fr })}</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <ThumbsUp className="h-4 w-4 text-green-500" />
                                            <span className="text-sm font-semibold">{article.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <ThumbsDown className="h-4 w-4 text-red-500" />
                                            <span className="text-sm font-semibold">{article.dislikes}</span>
                                        </div>
                                        <Dialog onOpenChange={(isOpen) => !isOpen && setViewingCommentsOf(null)}>
                                        <DialogTrigger asChild>
                                            <button onClick={() => setViewingCommentsOf(article)} className="flex items-center gap-1 cursor-pointer hover:text-primary">
                                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-semibold">{article.comments.length}</span>
                                            </button>
                                        </DialogTrigger>
                                        </Dialog>
                                    </div>

                                    <Link href={`/admin/edit/${article.slug}`}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                            
                            {/*-- Desktop Layout --*/}
                            <div className="hidden md:col-span-5 md:flex items-center">
                                <span className="font-medium">{article.title}</span>
                                <Badge variant={article.status === 'published' ? 'secondary' : 'default'} className="ml-2">
                                    {article.status === 'published' ? 'Publié' : 'Programmé'}
                                </Badge>
                            </div>
                            <div className="hidden md:col-span-2 md:block">
                                <Badge variant="outline">{article.category}</Badge>
                            </div>
                            <div className="hidden md:col-span-2 md:block">
                                {format(parseISO(article.publicationDate), 'd MMM yyyy', { locale: fr })}
                            </div>
                            <div className="hidden md:col-span-2 md:flex justify-center">
                                <div className="flex items-center gap-4 text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <ThumbsUp className="h-4 w-4 text-green-500" />
                                        <span className="text-sm font-semibold">{article.likes}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ThumbsDown className="h-4 w-4 text-red-500" />
                                        <span className="text-sm font-semibold">{article.dislikes}</span>
                                    </div>
                                    <Dialog onOpenChange={(isOpen) => !isOpen && setViewingCommentsOf(null)}>
                                        <DialogTrigger asChild>
                                            <button onClick={() => setViewingCommentsOf(article)} className="flex items-center gap-1 cursor-pointer hover:text-primary">
                                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-semibold">{article.comments.length}</span>
                                            </button>
                                        </DialogTrigger>
                                    </Dialog>
                                </div>
                            </div>
                            <div className="hidden md:col-span-1 md:flex justify-end">
                                <Link href={`/admin/edit/${article.slug}`}>
                                    <Button variant="outline" size="sm">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </CardContent>
        </Card>
        
        {viewingCommentsOf && (
             <Dialog open onOpenChange={(isOpen) => !isOpen && setViewingCommentsOf(null)}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Commentaires pour "{viewingCommentsOf.title}"</DialogTitle>
                    </DialogHeader>
                    <CommentSection articleId={viewingCommentsOf.slug} initialComments={viewingCommentsOf.comments} />
                </DialogContent>
            </Dialog>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Articles par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <BarChart accessibilityLayer data={articlesPerCategory}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
