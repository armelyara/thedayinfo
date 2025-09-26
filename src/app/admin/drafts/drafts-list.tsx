'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileEdit, Trash2, Send } from 'lucide-react';
import { deleteDraftAction } from '@/app/admin/drafts/action';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Draft } from '@/lib/data-types';

interface DraftsListProps {
    initialDrafts: Draft[];
}

export function DraftsList({ initialDrafts }: DraftsListProps) {
    const [drafts, setDrafts] = useState(initialDrafts);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = async (autoSaveId: string) => {
        setIsDeleting(autoSaveId);
        try {
            const success = await deleteDraftAction(autoSaveId);
            if (success) {
                setDrafts(prev => prev.filter(d => d.autoSaveId !== autoSaveId));
                toast({
                    title: 'Brouillon supprimé',
                    description: 'Le brouillon a été supprimé avec succès.',
                });
            } else {
                throw new Error('Échec de la suppression');
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de supprimer le brouillon.',
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const handleEdit = (autoSaveId: string) => {
        router.push(`/admin/edit-draft/${autoSaveId}`);
    };

    if (drafts.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun brouillon</h3>
                    <p className="text-muted-foreground">
                        Tous vos brouillons apparaîtront ici.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {drafts.map((draft) => (
                <Card key={draft.autoSaveId}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-lg">
                                    {draft.title || 'Sans titre'}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary">Brouillon</Badge>
                                    {draft.category && (
                                        <Badge variant="outline">{draft.category}</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent>
                        <div className="space-y-4">
                            {draft.content && (
                                <div className="text-sm text-muted-foreground line-clamp-3">
                                    {draft.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                    <p>Créé {formatDistanceToNow(new Date(draft.createdAt), { 
                                        addSuffix: true, 
                                        locale: fr 
                                    })}</p>
                                    <p>Dernière sauvegarde : {format(new Date(draft.lastSaved), 
                                        'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(draft.autoSaveId)}
                                    >
                                        <FileEdit className="h-4 w-4 mr-2" />
                                        Continuer
                                    </Button>
                                    
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={isDeleting === draft.autoSaveId}
                                        onClick={() => handleDelete(draft.autoSaveId)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {isDeleting === draft.autoSaveId ? 'Suppression...' : 'Supprimer'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}