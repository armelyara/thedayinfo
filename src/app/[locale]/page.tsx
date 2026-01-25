// Remplace src/app/page.tsx

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookOpen, FolderGit2 } from 'lucide-react';
import { getPublishedArticles, getProjects } from '@/lib/data-client';


import { ArticleCard } from '@/components/article/article-card';
import { ProjectCard } from '@/components/project/project-card';
import type { Article, Project } from '@/lib/data-types';

async function getRecentArticles(): Promise<Article[]> {
  const articlesResult = await getPublishedArticles();
  if ('error' in articlesResult) {
    console.error(articlesResult.message);
    return [];
  }
  return articlesResult.slice(0, 3);
}

async function getFeaturedProjects(): Promise<Project[]> {
  const allProjects = await getProjects();
  return allProjects.slice(0, 3);
}

export default async function HomePage() {
  const recentArticles = await getRecentArticles();
  const featuredProjects = await getFeaturedProjects();

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex h-[calc(100vh-80px)] min-h-[500px] w-full items-center justify-center bg-background text-center">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Résoudre des problèmes par la technologie.
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Promoteur du dev.
            </p>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            {/* Tous les boutons en orange (primary) */}
            <Button asChild size="lg">
              <Link href="/projets">
                Voir les projets
                <FolderGit2 className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/blog">
                Lire le blog
                <BookOpen className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section id="projects" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Projets Phares</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Quelques projets récents qui illustrent mon travail.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
            <div className="mt-12 text-center">
              {/* Bouton orange */}
              <Button asChild size="lg">
                <Link href="/projets">
                  Tous les projets <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Recent Articles Section */}
      {recentArticles.length > 0 && (
        <section id="blog" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Derniers articles du blog</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
                Explorez mes dernières pensées et découvertes technologiques.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {recentArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
            <div className="mt-12 text-center">
              {/* Bouton orange */}
              <Button asChild size="lg">
                <Link href="/blog">
                  Visiter le blog <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}