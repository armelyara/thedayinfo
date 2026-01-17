'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MessageCircle } from 'lucide-react';
import type { Comment } from '@/lib/data-types';

type FeedbackProps = {
    articleSlug: string;
    initialViews: number;
    initialComments: Comment[];
};

export default function Feedback({
    articleSlug,
    initialViews,
    initialComments
}: FeedbackProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Statistiques de l'article</CardTitle>
        <CardDescription>Engagement des lecteurs avec cet article.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{initialViews}</p>
              <p className="text-xs text-muted-foreground">Vues</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{initialComments?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Commentaires</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}