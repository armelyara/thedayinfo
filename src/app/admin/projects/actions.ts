// src/app/admin/projects/actions.ts
'use server';

import { getProjects, deleteProject } from '@/lib/data-admin';
import type { Project } from '@/lib/data-types';
import { revalidatePath } from 'next/cache';

export async function getProjectsAction(): Promise<Project[]> {
    return await getProjects();
}

export async function deleteProjectAction(slug: string): Promise<boolean> {
    const result = await deleteProject(slug);
    if (result) {
        revalidatePath('/admin/projects');
        revalidatePath('/projets');
        revalidatePath('/');
    }
    return result;
} 