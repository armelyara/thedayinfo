// src/components/project/project-list.tsx
import type { Project } from '@/lib/data-types';
import { ProjectCard } from './project-card';

// Les données factices sont conservées ici en attendant la connexion à la base de données
const allProjects: Project[] = [
  {
    slug: 'projet-exemple-1',
    title: 'Plateforme e-commerce IA',
    description: 'Une plateforme de vente en ligne avec des recommandations de produits personnalisées par IA.',
    fullDescription: 'Description complète du projet de plateforme e-commerce. Ce projet utilise Next.js pour le frontend, Firebase pour le backend et Genkit pour les fonctionnalités d\'intelligence artificielle.',
    image: { src: 'https://picsum.photos/seed/p1/400/300', alt: 'Projet 1', aiHint: 'ecommerce platform' },
    technologies: ['Next.js', 'Firebase', 'Genkit'],
    status: 'en-cours',
    startDate: '2024-01',
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
    fullDescription: 'Description complète de l\'analyseur de sentiments. Ce projet a été développé avec Python, TensorFlow et Flask pour fournir des analyses de texte en temps réel.',
    image: { src: 'https://picsum.photos/seed/p2/400/300', alt: 'Projet 2', aiHint: 'data analytics' },
    technologies: ['Python', 'TensorFlow', 'Flask'],
    status: 'terminé',
    startDate: '2023-06',
    endDate: '2023-12',
    githubUrl: 'https://github.com/armelyara',
    blogArticleSlug: 'deuxieme-article-slug',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    slug: 'projet-exemple-3',
    title: 'Application de méditation',
    description: 'Une app mobile pour guider les utilisateurs dans leurs sessions de méditation avec des paysages sonores générés par IA.',
    fullDescription: 'Description complète de l\'application de méditation. Créée avec React Native et Firebase, elle intègre Genkit pour la génération de paysages sonores uniques.',
    image: { src: 'https://picsum.photos/seed/p3/400/300', alt: 'Projet 3', aiHint: 'meditation app' },
    technologies: ['React Native', 'Firebase', 'Genkit'],
    status: 'maintenance',
    startDate: '2022-09',
    demoUrl: '#',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];


export function ProjectList() {
  if (!allProjects || allProjects.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold">Aucun projet à afficher</h2>
        <p className="text-muted-foreground mt-2">
          Revenez bientôt pour découvrir mes réalisations.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {allProjects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </div>
  );
}
