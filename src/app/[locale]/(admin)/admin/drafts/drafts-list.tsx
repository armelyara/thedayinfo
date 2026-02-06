'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileEdit, Trash2, Clock, Pencil, Send } from 'lucide-react';
import { deleteDraftAction, publishDraftNow } from '@/app/[locale]/admin/drafts/action';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Draft } from '@/lib/data-types';

interface DraftsListProps {
    initialDrafts: Draft[];
}

export function DraftsList({ initialDrafts }: DraftsListProps) {
    const [drafts, setDrafts] = useState(initialDrafts);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [publishingId, setPublishingId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            const success = await deleteDraftAction(id);
            if (success) {
                setDrafts(prev => prev.filter(d => d.id !== id));
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

    const handlePublish = async (id: string) => {
        if (!confirm("Voulez-vous vraiment publier ce brouillon maintenant ?")) return;

        console.log("Début publication pour ID:", id); // Log de debug
        setPublishingId(id);

        try {
            const result = await publishDraftNow(id);
            console.log("Résultat publication:", result); // Log de debug

            if (result.success) {
                // 1. Mise à jour immédiate de l'UI (Optimistic UI)
                // On retire l'article de la liste des brouillons car il est publié
                setDrafts(prev => prev.filter(d => d.id !== id));

                toast({
                    title: 'Succès',
                    description: result.message,
                    className: "bg-green-50 border-green-200", // Petit style vert
                });

                // 2. Rafraîchissement des données serveur en arrière-plan
                router.refresh();
            } else {
                toast({
                    title: "Erreur",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Erreur catch handlePublish:", error);
            toast({
                variant: 'destructive',
                title: 'Erreur système',
                description: 'Impossible de contacter le serveur.',
            });
        } finally {
            setPublishingId(null);
        }
    };

    const handleEdit = (id: string) => {
        router.push(`/admin/edit/${id}`);
    };

    // Helper robuste pour la date
    const renderScheduledDate = (date: string | Date | undefined | null) => {
        if (!date) return null;
        try {
            const dateObj = typeof date === 'string' ? parseISO(date) : date;
            return format(dateObj, 'dd/MM/yyyy à HH:mm', { locale: fr });
        } catch (e) {
            return "Date invalide";
        }
    };

    if (drafts.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun brouillon</h3>
                    <p className="text-muted-foreground">
                        Tous vos brouillons et articles programmés apparaîtront ici.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {drafts.map((draft) => (
                <Card key={draft.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-lg">
                                    {draft.title || 'Sans titre'}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    {draft.status === 'scheduled' ? (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Programmé
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Brouillon</Badge>
                                    )}
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

                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div className="text-xs text-muted-foreground">
                                    {draft.status === 'scheduled' && draft.scheduledFor && (
                                        <p className="font-semibold text-blue-700 mb-1">
                                            Publication le {renderScheduledDate(draft.scheduledFor)}
                                        </p>
                                    )}
                                    <p>Dernière sauvegarde : {
                                        draft.lastSaved
                                            ? formatDistanceToNow(new Date(draft.lastSaved), { addSuffix: true, locale: fr })
                                            : 'jamais'
                                    }</p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                        onClick={() => handlePublish(draft.id)}
                                        disabled={publishingId === draft.id || isDeleting === draft.id}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {publishingId === draft.id ? '...' : 'Publier'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(draft.id)}
                                        disabled={publishingId === draft.id || isDeleting === draft.id}
                                    >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Modifier
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={isDeleting === draft.id || publishingId === draft.id}
                                        onClick={() => handleDelete(draft.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {isDeleting === draft.id ? '...' : 'Supprimer'}
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