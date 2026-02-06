// src/app/projets/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProjectBySlug, getProjects } from '@/lib/data-admin';
import type { Project } from '@/lib/data-types';
import { Github, ExternalLink, Calendar, CheckCircle, Wrench, BookOpen } from 'lucide-react';
import { SanitizedContent } from '@/components/ui/sanitized-content';
import { cn } from '@/lib/utils';

const statusConfig = {
  'terminé': { icon: CheckCircle, label: 'Terminé', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  'en-cours': { icon: Wrench, label: 'En cours', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  'maintenance': { icon: Wrench, label: 'Maintenance', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  let project;

  try {
    project = await getProjectBySlug(params.slug);
  } catch (error) {
    console.error('Error loading project:', error);
    notFound();
  }

  if (!project) {
    notFound();
  }

  // Sécurisation du statut (fallback si le statut DB n'est pas dans la config)
  // On utilise 'maintenance' comme fallback par défaut ou 'en-cours'
  const statusKey = project.status as keyof typeof statusConfig;
  const config = statusConfig[statusKey] || {
    icon: Wrench,
    label: project.status || 'Inconnu',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  };

  const StatusIcon = config.icon;
  // Sécurisation de l'image
  const imageSrc = project.image?.src;
  const imageAlt = project.image?.alt || project.title;

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-extrabold tracking-tight lg:text-5xl mb-4">
          {project.title}
        </h1>
        <p className="text-xl text-muted-foreground">{project.description}</p>
      </header>

      {imageSrc && (
        <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            className="object-cover"
            data-ai-hint={project.image?.aiHint}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          {/* Fallback chaine vide pour éviter le crash */}
          <SanitizedContent content={project.fullDescription || ''} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Infos Projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("h-4 w-4", config.className.split(' ').find(c => c.startsWith('text-')))} />
                <Badge variant="secondary" className={config.className}>
                  {config.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{project.startDate}{project.endDate ? ` - ${project.endDate}` : ''}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technologies</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {project.technologies?.map(tech => (
                <Badge key={tech} variant="outline">{tech}</Badge>
              )) || <span className="text-muted-foreground italic">Aucune techno listée</span>}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {project.githubUrl && (
              <Button asChild className="w-full">
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" /> Voir sur GitHub
                </a>
              </Button>
            )}
            {project.demoUrl && (
              <Button asChild variant="secondary" className="w-full">
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Voir la démo
                </a>
              </Button>
            )}
            {project.blogArticleSlug && (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/blog/${project.blogArticleSlug}`}>
                  <BookOpen className="mr-2 h-4 w-4" /> Lire l'article associé
                </Link>
              </Button>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

// Générer les pages statiques pour chaque projet
export async function generateStaticParams() {
  // Skip static generation during build - Firebase Admin is not available
  if (process.env.IS_BUILD) {
    console.log('Skipping static params generation for projects during build');
    return [];
  }

  try {
    const projects = await getProjects();
    return projects.map((project) => ({
      slug: project.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for projects:', error);
    return [];
  }
}
