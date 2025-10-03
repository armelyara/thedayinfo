'use client';

import { useState, useEffect } from 'react';
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
    initialLikes: number; // Ajout
    initialDislikes: number; // Ajout
};

export default function Feedback({ 
    articleSlug, 
    initialViews, 
    initialComments,
    initialLikes,
    initialDislikes 
}: FeedbackProps) {
  const [reaction, setReaction] = useState<Reaction>(null);
  const [likes, setLikes] = useState(initialLikes); // ✅ Initialisé depuis la DB
  const [dislikes, setDislikes] = useState(initialDislikes); // ✅ Initialisé depuis la DB
  const [isUpdating, setIsUpdating] = useState(false);

  // Charger la réaction depuis localStorage au montage
  useEffect(() => {
    const savedReaction = localStorage.getItem(`reaction-${articleSlug}`);
    if (savedReaction === 'like' || savedReaction === 'dislike') {
      setReaction(savedReaction);
    }
  }, [articleSlug]);

  const handleReaction = async (newReaction: 'like' | 'dislike') => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      let action: 'add' | 'remove' | 'switch' = 'add';
      
      if (reaction === newReaction) {
        // Retirer la réaction
        action = 'remove';
        setReaction(null);
        localStorage.removeItem(`reaction-${articleSlug}`);
        
        if (newReaction === 'like') {
          setLikes(l => Math.max(0, l - 1));
        } else {
          setDislikes(d => Math.max(0, d - 1));
        }
      } else if (reaction) {
        // Changer de réaction
        action = 'switch';
        setReaction(newReaction);
        localStorage.setItem(`reaction-${articleSlug}`, newReaction);
        
        if (reaction === 'like') {
          setLikes(l => Math.max(0, l - 1));
          setDislikes(d => d + 1);
        } else {
          setDislikes(d => Math.max(0, d - 1));
          setLikes(l => l + 1);
        }
      } else {
        // Nouvelle réaction
        action = 'add';
        setReaction(newReaction);
        localStorage.setItem(`reaction-${articleSlug}`, newReaction);
        
        if (newReaction === 'like') {
          setLikes(l => l + 1);
        } else {
          setDislikes(d => d + 1);
        }
      }

      // ✅ ENVOYER au serveur pour sauvegarder dans Firestore
      const response = await fetch(`/api/articles/${articleSlug}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reaction: newReaction,
          action: action,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde de la réaction');
      }

      const data = await response.json();
      
      // Mettre à jour avec les valeurs réelles de la DB
      setLikes(data.likes);
      setDislikes(data.dislikes);

    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la réaction:', error);
      // Revenir à l'état précédent en cas d'erreur
    } finally {
      setIsUpdating(false);
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
            disabled={isUpdating}
            className={cn(
              'transition-all', 
              reaction === 'like' && 'bg-green-500 hover:bg-green-600 scale-105'
            )}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            <span>J'aime</span>
            <span className="ml-2 text-xs font-bold">{likes}</span>
          </Button>
          <Button
            variant={reaction === 'dislike' ? 'destructive' : 'outline'}
            onClick={() => handleReaction('dislike')}
            disabled={isUpdating}
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