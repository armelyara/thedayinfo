// src/components/admin/admin-comments-modal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Reply, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Comment } from '@/lib/data-types';
import { getAuthorAvatar } from '@/lib/avatar-utils';

interface AdminCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleSlug: string;
  articleTitle: string;
  comments: Comment[];
  onCommentsUpdate: (newComments: Comment[]) => void;
}

function CommentItem({ 
  comment, 
  articleSlug, 
  allComments, 
  onCommentsUpdate,
  level = 0
}: {
  comment: Comment;
  articleSlug: string;
  allComments: Comment[];
  onCommentsUpdate: (comments: Comment[]) => void;
  level?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);

    try {
      const reply: Comment = {
        id: Date.now(),
        author: 'Armel Yara',
        text: replyText.trim(),
        avatar: getAuthorAvatar('Armel Yara'),
        parentId: comment.id,
        likes: 0,
      };

      const updatedComments = [...allComments, reply];

      const response = await fetch(`/api/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'ajout de la réponse');
      
      onCommentsUpdate(updatedComments);
      setReplyText('');
      setShowReplyForm(false);
      toast({ title: 'Réponse ajoutée' });

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'ajouter la réponse' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const childComments = allComments.filter(c => c.parentId === comment.id);

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <div className="p-3 border rounded-lg space-y-3">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.avatar} alt={comment.author} />
            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.author}</span>
              {comment.author === 'Armel Yara' && (
                <Badge variant="default" className="text-xs bg-blue-500">Auteur</Badge>
              )}
            </div>
            <p className="text-sm text-foreground">{comment.text}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> {comment.likes || 0}
              </span>
              {!showReplyForm ? (
                <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(true)} className="text-xs">
                  <Reply className="w-3 h-3 mr-1" /> Répondre
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {showReplyForm && (
          <div className="ml-11 space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="default" className="text-xs bg-blue-500 mt-1">Auteur</Badge>
              <div className="flex-1">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Répondre à ce commentaire..."
                  rows={2}
                  disabled={isSubmitting}
                  className="text-sm"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowReplyForm(false)}>Annuler</Button>
                  <Button onClick={handleReply} size="sm" disabled={isSubmitting || !replyText.trim()}>
                    {isSubmitting ? 'Publication...' : <><Send className="w-3 h-3 mr-1" /> Publier</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {childComments.length > 0 && (
        <div className="mt-2 space-y-2">
          {childComments.map(child => (
            <CommentItem
              key={child.id}
              comment={child}
              articleSlug={articleSlug}
              allComments={allComments}
              onCommentsUpdate={onCommentsUpdate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminCommentsModal({
  isOpen,
  onClose,
  articleSlug,
  articleTitle,
  comments,
  onCommentsUpdate
}: AdminCommentsModalProps) {
  const [globalComment, setGlobalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const rootComments = comments.filter(c => !c.parentId);

  const handleGlobalComment = async () => {
    if (!globalComment.trim()) return;
    setIsSubmitting(true);

    try {
      const newComment: Comment = {
        id: Date.now(),
        author: 'Armel Yara',
        text: globalComment.trim(),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=armel',
        likes: 0,
      };

      const updatedComments = [...comments, newComment];

      const response = await fetch(`/api/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'ajout du commentaire');
      
      onCommentsUpdate(updatedComments);
      setGlobalComment('');
      toast({ title: 'Commentaire ajouté' });

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible d\'ajouter le commentaire' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Commentaires - {articleTitle}
          </DialogTitle>
          <DialogDescription>
            Gérez les commentaires de cet article ({comments.length} commentaires)
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <ScrollArea className="h-96 pr-4">
            {rootComments.length > 0 ? (
              <div className="space-y-4">
                {rootComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    articleSlug={articleSlug}
                    allComments={comments}
                    onCommentsUpdate={onCommentsUpdate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun commentaire pour cet article</p>
              </div>
            )}
          </ScrollArea>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              Ajouter un commentaire
              <Badge variant="default" className="text-xs bg-blue-500">Auteur</Badge>
            </h4>
            <div className="space-y-3">
              <Textarea
                value={globalComment}
                onChange={(e) => setGlobalComment(e.target.value)}
                placeholder="Ajouter votre commentaire à cet article..."
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
                <Button onClick={handleGlobalComment} disabled={isSubmitting || !globalComment.trim()}>
                  {isSubmitting ? 'Publication...' : <><Send className="w-4 h-4 mr-2" /> Publier</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
