// src/components/project/project-card.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Github, ExternalLink, Calendar, Wrench, CheckCircle } from 'lucide-react';
import type { ArticleImage } from '@/lib/data-types';

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: ArticleImage;
  technologies: string[];
  status: 'terminé' | 'en-cours' | 'maintenance';
  startDate?: string;
  endDate?: string;
  githubUrl?: string;
  demoUrl?: string;
  blogArticleSlug?: string;
};

const statusConfig = {
  'terminé': { icon: CheckCircle, label: 'Terminé', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  'en-cours': { icon: Wrench, label: 'En cours', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  'maintenance': { icon: Calendar, label: 'Maintenance', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export function ProjectCard({ project }: { project: Project }) {
  const StatusIcon = statusConfig[project.status].icon;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="p-0">
        <Link href={`/projets/${project.slug}`} className="group block aspect-video relative overflow-hidden">
          <Image
            src={project.image.src}
            alt={project.image.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={project.image.aiHint}
          />
        </Link>
      </CardHeader>
      
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className={statusConfig[project.status].className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[project.status].label}
          </Badge>
        </div>
        
        <CardTitle className="text-lg font-bold mb-2">
          <Link href={`/projets/${project.slug}`} className="hover:text-primary transition-colors">
            {project.title}
          </Link>
        </CardTitle>
        
        <CardDescription className="text-sm flex-1 line-clamp-3">
          {project.description}
        </CardDescription>

        <div className="mt-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Technologies</h4>
          <div className="flex flex-wrap gap-1">
            {project.technologies.map(tech => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Link href={`/projets/${project.slug}`} className="group w-full">
          <div className="flex items-center text-sm font-semibold text-primary">
            Voir les détails
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </Link>
      </CardFooter>
    </Card>
  );
}
