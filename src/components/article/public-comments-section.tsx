'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, User, Reply, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Comment } from '@/lib/data-types';

// Fonction pour générer et récupérer le nom d'auteur anonyme
const getAnonymousAuthorName = (): string => {
  if (typeof window === 'undefined') return 'Visiteur Anonyme';

  let authorName = localStorage.getItem('anonymous-commenter-name');
  if (!authorName) {
    const randomNumber = Math.floor(Math.random() * 10000);
    authorName = `Visiteur Anonyme #${randomNumber}`;
    localStorage.setItem('anonymous-commenter-name', authorName);
  }
  return authorName;
};


interface PublicCommentsSectionProps {
  articleSlug: string;
  comments: Comment[];
  onCommentsUpdate: (newComments: Comment[]) => void;
}

function CommentThread({ 
  comment,
  replies,
  articleSlug,
  allComments,
  onCommentsUpdate,
  level = 0
}: {
  comment: Comment;
  replies: Comment[];
  articleSlug: string;
  allComments: Comment[];
  onCommentsUpdate: (comments: Comment[]) => void;
  level?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir le champ de réponse' });
      return;
    }
    setIsSubmitting(true);
    try {
      const authorName = getAnonymousAuthorName();
      const newReply: Comment = {
        id: Date.now(),
        author: authorName,
        text: replyText.trim(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${authorName.replace('#', '')}`,
        parentId: comment.id,
        likes: 0
      };
      const updatedComments = [...allComments, newReply];
      
      const response = await fetch(`/api/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments }),
      });

      if (!response.ok) throw new Error('Erreur lors de la publication');

      onCommentsUpdate(updatedComments);
      setShowReplyForm(false);
      setReplyText('');
      toast({ title: 'Réponse publiée' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de publier la réponse' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    const updatedComments = allComments.map(c => 
      c.id === comment.id ? { ...c, likes: (c.likes || 0) + 1 } : c
    );
    onCommentsUpdate(updatedComments); // Optimistic update

    try {
        const response = await fetch(`/api/articles/${articleSlug}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comments: updatedComments }),
        });
        if (!response.ok) throw new Error('Failed to update likes');
    } catch (error) {
        // Revert on failure
        const revertedComments = allComments.map(c => 
            c.id === comment.id ? { ...c, likes: (c.likes || 0) } : c
        );
        onCommentsUpdate(revertedComments);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de liker le commentaire' });
    }
  };

  return (
    <div className="space-y-4" style={{ marginLeft: level > 0 ? `${level * 20}px` : '0px' }}>
      <div className="flex gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={comment.avatar} alt={comment.author} />
          <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{comment.author}</span>
            {comment.author === 'Armel Yara' && (
              <Badge variant="default" className="text-xs bg-blue-500">Auteur</Badge>
            )}
          </div>
          <p className="text-foreground mb-3">{comment.text}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center gap-1 text-xs">
              <ThumbsUp className="w-4 h-4" /> {comment.likes || 0}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="flex items-center gap-1 text-xs">
              <Reply className="w-4 h-4" /> Répondre
            </Button>
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className="ml-13 p-4 bg-muted/50 rounded-lg">
          <form onSubmit={handlePostReply} className="space-y-3">
            <div>
              <Label htmlFor={`replyText-${comment.id}`} className="text-sm">Votre réponse</Label>
              <Textarea id={`replyText-${comment.id}`} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Répondre..." rows={3} disabled={isSubmitting} className="text-sm mt-1" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowReplyForm(false)}>Annuler</Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !replyText.trim()}>
                {isSubmitting ? 'Publication...' : 'Publier'}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {replies.length > 0 && (
          <div className="mt-4 space-y-4 pl-5 border-l-2">
              {replies.map(reply => {
                  const nestedReplies = allComments.filter(c => c.parentId === reply.id);
                  return (
                      <CommentThread
                          key={reply.id}
                          comment={reply}
                          replies={nestedReplies}
                          articleSlug={articleSlug}
                          allComments={allComments}
                          onCommentsUpdate={onCommentsUpdate}
                          level={level + 1}
                      />
                  );
              })}
          </div>
      )}
    </div>
  );
}

export function PublicCommentsSection({ 
  articleSlug, 
  comments, 
  onCommentsUpdate 
}: PublicCommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setCurrentAuthor(getAnonymousAuthorName());
  }, []);

  const { rootComments, commentsByParent } = useMemo(() => {
    const rootComments = comments.filter(comment => !comment.parentId);
    const commentsByParent = comments.reduce((acc, comment) => {
      if (comment.parentId) {
        (acc[comment.parentId] = acc[comment.parentId] || []).push(comment);
      }
      return acc;
    }, {} as Record<number, Comment[]>);
    return { rootComments, commentsByParent };
  }, [comments]);


  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez écrire un commentaire' });
        return;
    }
    setIsSubmitting(true);
    try {
      const authorName = getAnonymousAuthorName();
      const comment: Comment = {
        id: Date.now(),
        author: authorName,
        text: newComment.trim(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${authorName.replace('#', '')}`,
        likes: 0,
        parentId: null
      };
      const updatedComments = [...comments, comment];

      const response = await fetch(`/api/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'ajout du commentaire');
      
      onCommentsUpdate(updatedComments);
      setNewComment('');
      toast({ title: 'Commentaire ajouté', description: 'Votre commentaire a été publié' });

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'ajouter le commentaire' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-6">
          Commentaires ({comments.length})
        </h3>
        {rootComments.length > 0 ? (
          <div className="space-y-6">
            {rootComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                replies={commentsByParent[comment.id] || []}
                articleSlug={articleSlug}
                allComments={comments}
                onCommentsUpdate={onCommentsUpdate}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Aucun commentaire pour le moment. Soyez le premier à commenter !
          </p>
        )}
      </div>
      <div className="border-t pt-8">
        <h4 className="font-semibold mb-2">Laisser un commentaire</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Vous commentez en tant que : <span className="font-medium text-foreground">{currentAuthor}</span>
        </p>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div>
            <Label htmlFor="newComment" className="sr-only">Votre commentaire</Label>
            <Textarea id="newComment" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Partagez votre avis sur cet article..." rows={4} disabled={isSubmitting} className="mt-1" />
          </div>
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? 'Publication...' : <><Send className="w-4 h-4 mr-2" /> Publier le commentaire</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
