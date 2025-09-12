
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { articles, categories, Comment as CommentType } from '@/lib/data';
import { Book, LayoutGrid, Users, Edit, ThumbsUp, ThumbsDown, MessageSquare, Send, ChevronDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

function CommentSection({ articleId, initialComments }: { articleId: string, initialComments: CommentType[] }) {
    const [comments, setComments] = useState<CommentType[]>(initialComments);
    const [replyText, setReplyText] = useState('');
    
    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim()) {
            const newComment: CommentType = {
                id: Date.now(),
                author: 'L\'Auteur', 
                text: replyText.trim(),
                avatar: 'https://picsum.photos/seed/author-pic/40/40' 
            };
            setComments(prevComments => [...prevComments, newComment]);
            setReplyText('');

            // Note: In a real app, you would also call a function here to persist the new comment to your backend.
            // For example: `addCommentToArticle(articleId, newComment)`
            const article = articles.find(a => a.slug === articleId);
            if(article) {
                article.comments.push(newComment);
            }
        }
    };

    return (
        <div className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-4">Commentaires</h4>
            <div className="space-y-4 mb-6">
                {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 border">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback><User size={16}/></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-background p-3 rounded-md">
                            <p className="font-semibold text-sm">{comment.author}</p>
                            <p className="text-sm text-muted-foreground">{comment.text}</p>
                        </div>
                    </div>
                )) : <p className="text-sm text-muted-foreground">Aucun commentaire pour cet article.</p>}
            </div>
            <form onSubmit={handleReplySubmit} className="flex gap-4">
                <Textarea
                    placeholder="Répondre en tant que L'Auteur..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" disabled={!replyText.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer
                </Button>
            </form>
        </div>
    );
}

export default function AdminDashboard() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-headline font-bold">Tableau de Bord Admin</h1>
          <p className="text-muted-foreground mt-2">
            Un aperçu de votre contenu publié.
          </p>
        </div>
        <Link href="/admin/create-article">
          <Button>Écrire un Nouvel Article</Button>
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
            <Accordion type="single" collapsible className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Statistiques</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <AccordionItem value={article.slug} key={article.slug} asChild>
                       <>
                        <TableRow>
                            <TableCell>
                                <AccordionTrigger>
                                     <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </AccordionTrigger>
                            </TableCell>
                            <TableCell className="font-medium">{article.title}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{article.category}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-center items-center gap-4 text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <ThumbsUp className="h-4 w-4 text-green-500" />
                                        <span className="text-sm">{article.likes}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ThumbsDown className="h-4 w-4 text-red-500" />
                                        <span className="text-sm">{article.dislikes}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm">{article.comments.length}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Link href={`/admin/edit/${article.slug}`} onClick={(e) => e.stopPropagation()}>
                                    <Button variant="outline" size="sm">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                        <AccordionContent asChild>
                            <tr>
                                <td colSpan={5}>
                                    <CommentSection articleId={article.slug} initialComments={article.comments} />
                                </td>
                            </tr>
                        </AccordionContent>
                      </>
                    </AccordionItem>
                  ))}
                </TableBody>
              </Table>
            </Accordion>
          </CardContent>
        </Card>

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
