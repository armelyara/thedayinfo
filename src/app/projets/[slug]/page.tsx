// src/app/projets/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project } from '@/lib/data-types';
import { Github, ExternalLink, Calendar, CheckCircle, Wrench, BookOpen } from 'lucide-react';

// Données factices en attendant la connexion à la base de données
const allProjects: Project[] = [
  {
    slug: 'projet-exemple-1',
    title: 'Plateforme e-commerce IA',
    description: 'Une plateforme de vente en ligne avec des recommandations de produits personnalisées par IA.',
    fullDescription: '<p>Ce projet vise à créer une expérience d\'achat en ligne hautement personnalisée en utilisant l\'intelligence artificielle pour recommander des produits. Le backend est construit sur Firebase pour une scalabilité et une gestion des données en temps réel, tandis que le frontend utilise Next.js pour un rendu rapide et un SEO optimisé.</p><p>La partie la plus innovante est l\'intégration de Genkit pour analyser le comportement des utilisateurs et générer des recommandations de produits pertinentes, améliorant ainsi l\'engagement et les conversions.</p>',
    image: { src: 'https://picsum.photos/seed/p1/1200/600', alt: 'Projet 1', aiHint: 'ecommerce platform' },
    technologies: ['Next.js', 'Firebase', 'Genkit', 'Tailwind CSS'],
    status: 'en-cours',
    startDate: 'Janvier 2024',
    githubUrl: 'https://github.com/armelyara',
    demoUrl: '#',
    blogArticleSlug: 'premier-article-slug',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    slug: 'projet-exemple-2',
    title: 'Analyseur de sentiments',
    description: 'Un outil pour analyser le sentiment des avis clients en temps réel grâce au traitement du langage naturel.',
    fullDescription: '<p>Cet outil puissant permet aux entreprises de comprendre rapidement l\'opinion générale de leurs clients en analysant des milliers d\'avis en quelques secondes. Construit avec Python et TensorFlow, le modèle de NLP est exposé via une API REST créée avec Flask.</p><p>L\'interface web simple permet de soumettre du texte et de visualiser immédiatement le score de sentiment (positif, négatif, neutre) ainsi que les mots-clés qui ont influencé le résultat.</p>',
    image: { src: 'https://picsum.photos/seed/p2/1200/600', alt: 'Projet 2', aiHint: 'data analytics' },
    technologies: ['Python', 'TensorFlow', 'Flask', 'Docker'],
    status: 'terminé',
    startDate: 'Juin 2023',
    endDate: 'Décembre 2023',
    githubUrl: 'https://github.com/armelyara',
    blogArticleSlug: 'deuxieme-article-slug',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  // Remplacera l'appel à la base de données
  return allProjects.find((p) => p.slug === slug);
}

const statusConfig = {
  'terminé': { icon: CheckCircle, label: 'Terminé', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  'en-cours': { icon: Wrench, label: 'En cours', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  'maintenance': { icon: Wrench, label: 'Maintenance', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};


export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  const StatusIcon = statusConfig[project.status].icon;

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-extrabold tracking-tight lg:text-5xl mb-4">
          {project.title}
        </h1>
        <p className="text-xl text-muted-foreground">{project.description}</p>
      </header>

      <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
        <Image
          src={project.image.src}
          alt={project.image.alt}
          fill
          priority
          className="object-cover"
          data-ai-hint={project.image.aiHint}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 prose prose-lg dark:prose-invert max-w-none"
             dangerouslySetInnerHTML={{ __html: project.fullDescription }} />

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Infos Projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${statusConfig[project.status].className.split(' ')[1]}`} />
                <Badge variant="secondary" className={statusConfig[project.status].className}>
                    {statusConfig[project.status].label}
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
              {project.technologies.map(tech => (
                <Badge key={tech} variant="outline">{tech}</Badge>
              ))}
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
    // Remplacera l'appel à la base de données
    const projects = allProjects;
   
    return projects.map((project) => ({
      slug: project.slug,
    }));
}
