// src/app/admin/projects/page.tsx
import { getProjectsAction } from './actions';
import { ProjectsList } from './projects-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, FolderGit2 } from 'lucide-react';

export default async function ProjectsAdminPage() {
    const projects = await getProjectsAction();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <Link 
                    href="/admin" 
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour au Tableau de Bord
                </Link>
                
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                           <FolderGit2 /> Gestion des Projets
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {projects.length} projet{projects.length > 1 ? 's' : ''} au total
                        </p>
                    </div>
                    
                    <Button asChild>
                        <Link href="/admin/create-project">
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau Projet
                        </Link>
                    </Button>
                </div>
            </div>

            <ProjectsList initialProjects={projects} />
        </div>
    );
}