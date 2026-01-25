
// src/app/admin/projects/projects-list.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FolderGit2, Trash2, Pencil, CheckCircle, Wrench } from 'lucide-react';
import { deleteProjectAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Project } from '@/lib/data-types';
import Image from 'next/image';

interface ProjectsListProps {
    initialProjects: Project[];
}

const statusConfig = {
  'terminé': { icon: CheckCircle, label: 'Terminé', className: 'bg-green-100 text-green-800' },
  'en-cours': { icon: Wrench, label: 'En cours', className: 'bg-blue-100 text-blue-800' },
  'maintenance': { icon: Wrench, label: 'Maintenance', className: 'bg-yellow-100 text-yellow-800' },
};

export function ProjectsList({ initialProjects }: ProjectsListProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = async (slug: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
            return;
        }

        setIsDeleting(slug);
        try {
            const success = await deleteProjectAction(slug);
            if (success) {
                setProjects(prev => prev.filter(p => p.slug !== slug));
                toast({
                    title: 'Projet supprimé',
                    description: 'Le projet a été supprimé avec succès.',
                });
            } else {
                throw new Error('Échec de la suppression');
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Impossible de supprimer le projet.',
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const handleEdit = (slug: string) => {
        router.push(`/admin/edit-project/${slug}`);
    };

    if (projects.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <FolderGit2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun projet</h3>
                    <p className="text-muted-foreground">
                        Les projets que vous créez apparaîtront ici.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {projects.map((project) => {
                const StatusIcon = statusConfig[project.status].icon;
                return (
                <Card key={project.slug}>
                    <CardHeader className="flex flex-row items-start gap-4">
                        <Image src={project.image.src} alt={project.image.alt} width={120} height={80} className="rounded-md object-cover aspect-video"/>
                        <div className="flex-1">
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                            <CardDescription>{project.description}</CardDescription>
                             <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className={statusConfig[project.status].className}>
                                    <StatusIcon className="h-3 w-3 mr-1"/>
                                    {statusConfig[project.status].label}
                                </Badge>
                                {project.technologies.map(tech => <Badge key={tech} variant="outline">{tech}</Badge>)}
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent>
                         <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                <p>Créé le : {format(parseISO(project.createdAt), 'dd/MM/yyyy', { locale: fr })}</p>
                                <p>Dernière modif. : {format(parseISO(project.updatedAt), 'dd/MM/yyyy', { locale: fr })}</p>
                            </div>
                            
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(project.slug)}
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Modifier
                                </Button>
                                
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isDeleting === project.slug}
                                    onClick={() => handleDelete(project.slug)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {isDeleting === project.slug ? 'Suppression...' : 'Supprimer'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )})}
        </div>
    );
}