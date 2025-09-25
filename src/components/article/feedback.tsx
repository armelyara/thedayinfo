
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/data-types';

type Reaction = 'like' | 'dislike' | null;

type FeedbackProps = {
    articleSlug: string;
    initialViews: number;
    initialComments: Comment[];
};

export default function Feedback({ articleSlug, initialViews, initialComments }: FeedbackProps) {
  const [reaction, setReaction] = useState<Reaction>(null);
  const [likes, setLikes] = useState(0); 
  const [dislikes, setDislikes] = useState(0);

  const handleReaction = (newReaction: 'like' | 'dislike') => {
    if (reaction === newReaction) {
        setReaction(null);
        if (newReaction === 'like') setLikes(l => l - 1);
        if (newReaction === 'dislike') setDislikes(d => d - 1);
    } else {
        if (reaction === 'like') setLikes(l => l - 1);
        if (reaction === 'dislike') setDislikes(d => d - 1);

        if (newReaction === 'like') setLikes(l => l + 1);
        if (newReaction === 'dislike') setDislikes(d => d + 1);
        
        setReaction(newReaction);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Cet article vous a-t-il été utile ?</CardTitle>
        <CardDescription>Faites-nous savoir ce que vous en pensez.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button
            variant={reaction === 'like' ? 'default' : 'outline'}
            onClick={() => handleReaction('like')}
            className={cn('transition-all', reaction === 'like' && 'bg-green-500 hover:bg-green-600 scale-105')}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            <span>J'aime</span>
            <span className="ml-2 text-xs font-bold">{likes}</span>
          </Button>
          <Button
            variant={reaction === 'dislike' ? 'destructive' : 'outline'}
            onClick={() => handleReaction('dislike')}
            className="transition-all"
          >
            <ThumbsDown className="mr-2 h-4 w-4" />
             <span>Je n'aime pas</span>
            <span className="ml-2 text-xs font-bold">{dislikes}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
