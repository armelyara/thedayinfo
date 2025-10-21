// src/components/project/project-list.tsx
import type { Project } from '@/lib/data-types';
import { ProjectCard } from './project-card';

export function ProjectList({ projects }: { projects: Project[] }) {
  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold">Aucun projet à afficher</h2>
        <p className="text-muted-foreground mt-2">
          Revenez bientôt pour découvrir mes réalisations. Des projets seront bientôt ajoutés.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </div>
  );
}
