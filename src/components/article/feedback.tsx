
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

type Reaction = 'like' | 'dislike' | null;

type Comment = {
  id: number;
  author: string;
  text: string;
  avatar: string;
};

export default function Feedback() {
  const [reaction, setReaction] = useState<Reaction>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const { toast } = useToast();

  const handleReaction = (newReaction: 'like' | 'dislike') => {
    setReaction(reaction === newReaction ? null : newReaction);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      const newComment: Comment = {
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
            className={cn(reaction === 'like' && 'bg-green-500 hover:bg-green-600')}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            J'aime
          </Button>
          <Button
            variant={reaction === 'dislike' ? 'destructive' : 'outline'}
            onClick={() => handleReaction('dislike')}
          >
            <ThumbsDown className="mr-2 h-4 w-4" />
            Je n'aime pas
          </Button>
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold font-headline">Laisser un Commentaire</h4>
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
