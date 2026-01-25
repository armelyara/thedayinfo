// src/app/admin/create-project/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveProject } from '@/lib/data-admin';
import type { Project } from '@/lib/data-types';

const projectSchema = z.object({
  title: z.string(),
  description: z.string(),
  fullDescription: z.string(),
  image: z.object({
    src: z.string(),
    alt: z.string(),
  }),
  technologies: z.array(z.string()),
  status: z.enum(['en-cours', 'terminé', 'maintenance']),
  startDate: z.string(),
  endDate: z.string().optional(),
  githubUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  blogArticleSlug: z.string().optional(),
});

type ProjectData = Omit<Project, 'slug' | 'createdAt' | 'updatedAt'>;

export async function saveProjectAction(data: ProjectData): Promise<Project> {
  // Validation avec Zod côté serveur pour la sécurité
  const validatedData = projectSchema.parse(data);

  try {
    const savedProject = await saveProject(validatedData);

    // Revalidation des chemins pour que les nouvelles données apparaissent
    revalidatePath('/projets');
    revalidatePath('/'); // La page d'accueil affiche les projets phares
    revalidatePath('/admin/projects');
    
    return savedProject;
  } catch (error) {
    console.error('Error saving project:', error);
    throw new Error('Erreur serveur lors de la sauvegarde du projet.');
  }
}