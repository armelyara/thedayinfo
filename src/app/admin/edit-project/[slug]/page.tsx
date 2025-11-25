
// src/app/admin/edit-project/[slug]/page.tsx
'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Project } from '@/lib/data-types';
import { getProjectAction } from './actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditProjectForm } from './edit-project-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditProjectPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProject() {
      if (!slug) return;
      try {
        const data = await getProjectAction(slug);
        if (!data) {
          toast({ variant: 'destructive', title: 'Erreur', description: 'Projet non trouvé.' });
          notFound();
        } else {
          setProject(data);
        }
      } catch (error) {
        console.error("Failed to fetch project for editing", error);
        toast({ variant: 'destructive', title: 'Erreur de chargement', description: 'Impossible de récupérer les données du projet.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProject();
  }, [slug, toast]);

  if (isLoading) {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
            <div className="space-y-4 pt-8">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        </div>
    );
  }

  if (!project) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Link 
          href="/admin/projects" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste des projets
        </Link>
        <h1 className="text-4xl font-headline font-bold">Modifier le Projet</h1>
        <p className="text-muted-foreground mt-2">
          Mettez à jour les détails du projet "{project.title}".
        </p>
      </header>
      <main>
        <EditProjectForm project={project} />
      </main>
    </div>
  );
}
