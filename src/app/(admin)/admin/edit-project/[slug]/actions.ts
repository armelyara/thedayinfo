
// src/app/admin/edit-project/[slug]/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { ProjectSchema } from '@/lib/validation-schemas';
import { saveProject, getProjects } from '@/lib/data-admin';
import type { Project } from '@/lib/data-types';

type ProjectData = Omit<Project, 'slug' | 'createdAt' | 'updatedAt'>;

export async function updateProjectAction(slug: string, data: ProjectData): Promise<Project> {
  const validatedData = ProjectSchema.parse(data);
  try {
    const savedProject = await saveProject(validatedData, slug);
    revalidatePath('/projets');
    revalidatePath(`/projets/${slug}`);
    revalidatePath('/');
    revalidatePath('/admin/projects');
    return savedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Erreur serveur lors de la mise à jour du projet.');
  }
}

export async function getProjectAction(slug: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find(p => p.slug === slug) || null;
}