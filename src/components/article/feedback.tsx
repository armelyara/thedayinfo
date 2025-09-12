
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User } from 'lucide-react';
import type { Comment as CommentType } from '@/lib/data';

type Reaction = 'like' | 'dislike' | null;

type FeedbackProps = {
    initialViews: number;
    initialComments: CommentType[];
};

export default function Feedback({ initialViews, initialComments }: FeedbackProps) {
  const [reaction, setReaction] = useState<Reaction>(null);
  const [likes, setLikes] = useState(0); // Likes/dislikes are local now
  const [dislikes, setDislikes] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const { toast } = useToast();

  const handleReaction = (newReaction: 'like' | 'dislike') => {
    if (reaction === newReaction) {
        // User is deselecting their reaction
        setReaction(null);
        if (newReaction === 'like') setLikes(l => l - 1);
        if (newReaction === 'dislike') setDislikes(d => d - 1);
    } else {
        // Switching reaction or new reaction
        if (reaction === 'like') setLikes(l => l - 1);
        if (reaction === 'dislike') setDislikes(d => d - 1);

        if (newReaction === 'like') setLikes(l => l + 1);
        if (newReaction === 'dislike') setDislikes(d => d + 1);
        
        setReaction(newReaction);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      const newComment: CommentType = {
        id: Date.now(),
        author: 'Visiteur',
        text: commentText.trim(),
        avatar: `https://i.pravatar.cc/40?u=${Date.now()}`
      };
      setComments([newComment, ...comments]);
      setCommentText('');
      toast({
        title: 'Commentaire Posté',
        description: 'Merci pour votre retour !',
      });
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
        <div className="space-y-4">
          <h4 className="font-semibold font-headline">Laisser un Commentaire ({comments.length})</h4>
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <Textarea
              placeholder="Partagez vos réflexions..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button type="submit" disabled={!commentText.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Poster le Commentaire
            </Button>
          </form>
          <div className="space-y-4 pt-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-4">
                 <Avatar className="h-9 w-9">
                    <AvatarImage src={comment.avatar} />
                    <AvatarFallback><User/></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{comment.author}</p>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
