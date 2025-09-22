'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, User, Reply } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Comment } from '@/types/comment';

interface PublicCommentsSectionProps {
  articleSlug: string;
  comments: Comment[];
  onCommentsUpdate: (newComments: Comment[]) => void;
}

function CommentThread({ 
  comment, 
  articleSlug, 
  allComments, 
  onCommentsUpdate 
}: {
  comment: Comment;
  articleSlug: string;
  allComments: Comment[];
  onCommentsUpdate: (comments: Comment[]) => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim() || !replyAuthor.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reply: Comment = {
        id: Date.now(),
        author: replyAuthor.trim(),
        text: replyText.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${replyAuthor}`
      };

      const updatedComments = [...allComments, reply];

      const response = await fetch(`/api/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de la réponse');
      }

      onCommentsUpdate(updatedComments);
      setReplyText('');
      setReplyAuthor('');
      setShowReplyForm(false);
      
      toast({
        title: 'Réponse ajoutée',
        description: 'Votre réponse a été publiée'
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'ajouter la réponse'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={comment.avatar} alt={comment.author} />
          <AvatarFallback>
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{comment.author}</span>
            {comment.author === 'Armel Yara' && (
              <Badge variant="default" className="text-xs bg-blue-500">
                Auteur
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">Maintenant</span>
          </div>
          <p className="text-foreground mb-3">{comment.text}</p>
          
          {!showReplyForm && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowReplyForm(true)}
              className="text-xs"
            >
              <Reply className="w-3 h-3 mr-1" />
              Répondre
            </Button>
          )}
        </div>
      </div>

      {showReplyForm && (
        <div className="ml-13 p-4 bg-muted/50 rounded-lg">
          <form onSubmit={handleReply} className="space-y-3">
            <div>
              <Label htmlFor="replyAuthor" className="text-sm">Votre nom</Label>
              <Input
                id="replyAuthor"
                value={replyAuthor}
                onChange={(e) => setReplyAuthor(e.target.value)}
                placeholder="Entrez votre nom"
                disabled={isSubmitting}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="replyText" className="text-sm">Votre réponse</Label>
              <Textarea
                id="replyText"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Répondre à ce commentaire..."
                rows={3}
                disabled={isSubmitting}
                className="text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                  setReplyAuthor('');
                }}
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Publication...' : 'Publier'}
              </Button>
            </div>
          </form>
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
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !authorName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const comment: Comment = {
        id: Date.now(),
        author: authorName.trim(),
        text: newComment.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`
      };

      const updatedComments = [...comments, comment];

      const response = await fetch(`/api/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du commentaire');
      }

      onCommentsUpdate(updatedComments);
      setNewComment('');
      setAuthorName('');
      
      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été publié'
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'ajouter le commentaire'
      });
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
        
        {comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
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
        <h4 className="font-semibold mb-4">Laisser un commentaire</h4>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div>
            <Label htmlFor="authorName">Votre nom</Label>
            <Input
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Entrez votre nom"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="newComment">Votre commentaire</Label>
            <Textarea
              id="newComment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Partagez votre avis sur cet article..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              'Publication...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Publier le commentaire
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}