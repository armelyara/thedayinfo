// src/components/admin/admin-comments-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, User, Reply, ThumbsUp, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Comment } from '@/lib/data-types';
import { getAuthorAvatarUrl } from '@/app/actions/author-avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleSlug: string;
  articleTitle: string;
  comments: Comment[];
  onCommentsUpdate: (comments: Comment[]) => void;
}

function CommentItem({ 
  comment, 
  articleSlug, 
  allComments, 
  onCommentsUpdate, 
  level = 0,
  authorAvatarUrl
}: { 
  comment: Comment; 
  articleSlug: string; 
  allComments: Comment[]; 
  onCommentsUpdate: (comments: Comment[]) => void; 
  level?: number;
  authorAvatarUrl: string;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);

    try {
      const reply: Comment = {
        id: Date.now(),
        author: 'Armel Yara',
        text: replyText.trim(),
        avatar: authorAvatarUrl, // ✅ Utiliser la vraie photo
        email: 'admin@thedayinfo.com', // Admin email (auto-approved)
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

  // Function to recursively get all child comment IDs
  const getAllChildIds = (commentId: number): number[] => {
    const children = allComments.filter(c => c.parentId === commentId);
    const childIds = children.map(c => c.id);
    const grandChildIds = children.flatMap(c => getAllChildIds(c.id));
    return [...childIds, ...grandChildIds];
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get all child comment IDs recursively
      const idsToDelete = [comment.id, ...getAllChildIds(comment.id)];

      // Filter out the comment and all its children
      const updatedComments = allComments.filter(c => !idsToDelete.includes(c.id));

      const response = await fetch(`/api/articles/${articleSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments }),
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      onCommentsUpdate(updatedComments);
      setShowDeleteDialog(false);

      const deletedCount = idsToDelete.length;
      toast({
        title: 'Commentaire supprimé',
        description: deletedCount > 1
          ? `${deletedCount} commentaires supprimés (incluant les réponses)`
          : 'Commentaire supprimé avec succès'
      });

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le commentaire' });
    } finally {
      setIsDeleting(false);
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
                <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(true)} className="flex items-center gap-1 h-auto p-0 hover:bg-transparent">
                  <Reply className="w-3 h-3" /> Répondre
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(false)} className="h-auto p-0 hover:bg-transparent">
                  Annuler
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-1 h-auto p-0 hover:bg-transparent text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" /> Supprimer
              </Button>
            </div>
          </div>
        </div>

        {showReplyForm && (
          <div className="pl-11 space-y-2">
            <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Votre réponse..." rows={3} disabled={isSubmitting} className="text-sm" />
            <div className="flex justify-end">
              <Button onClick={handleReply} size="sm" disabled={isSubmitting || !replyText.trim()}>
                {isSubmitting ? 'Envoi...' : <><Send className="w-3 h-3 mr-1" /> Répondre</>}
              </Button>
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
              authorAvatarUrl={authorAvatarUrl}
            />
          ))}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce commentaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              {childComments.length > 0
                ? `Ce commentaire a ${childComments.length} réponse(s). Toutes les réponses seront également supprimées. Cette action est irréversible.`
                : 'Cette action est irréversible. Le commentaire sera définitivement supprimé.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string>('/default-avatar.png');
  const { toast } = useToast();
  
  // Récupérer l'avatar de l'auteur au chargement
  useEffect(() => {
    const fetchAvatar = async () => {
      const avatarUrl = await getAuthorAvatarUrl();
      if (avatarUrl) setAuthorAvatarUrl(avatarUrl);
    };
    fetchAvatar();
  }, []);
  
  const rootComments = comments.filter(c => !c.parentId);

  const handleGlobalComment = async () => {
    if (!globalComment.trim()) return;
    setIsSubmitting(true);

    try {
      const newComment: Comment = {
        id: Date.now(),
        author: 'Armel Yara',
        text: globalComment.trim(),
        avatar: authorAvatarUrl, // ✅ Utiliser la vraie photo
        email: 'admin@thedayinfo.com', // Admin email (auto-approved)
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
              <div className="space-y-3">
                {rootComments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    articleSlug={articleSlug}
                    allComments={comments}
                    onCommentsUpdate={onCommentsUpdate}
                    authorAvatarUrl={authorAvatarUrl}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Aucun commentaire pour le moment</p>
            )}
          </ScrollArea>

          <div className="border-t pt-4">
            <Label htmlFor="globalComment" className="text-sm font-semibold mb-2 block">
              Poster un commentaire public
            </Label>
            <div className="space-y-3">
              <Textarea 
                id="globalComment"
                value={globalComment} 
                onChange={(e) => setGlobalComment(e.target.value)} 
                placeholder="Écrivez un commentaire pour tous les lecteurs..." 
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
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