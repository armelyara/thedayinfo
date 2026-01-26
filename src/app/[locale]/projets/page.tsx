// src/app/projets/page.tsx
import { ProjectList } from '@/components/project/project-list';
import { getProjects } from '@/lib/data-client';
import { getTranslations } from 'next-intl/server';
import { FolderGit2 } from 'lucide-react';

export default async function ProjectsPage() {
  const projects = await getProjects();
  const t = await getTranslations('ProjectsPage');

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 border-b pb-6 text-center">
        <FolderGit2 className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          {t('subtitle')}
        </p>
      </header>

      <main>
        {/* Les filtres seront ajoutés ici dans une future étape */}
        <ProjectList projects={projects} />
      </main>
    </div>
  );
}
