'use server';

import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import type { Project } from '../data-types';
import { getDb } from './db';

/**
 * Save a project (create or update)
 */
export async function saveProject(
  projectData: Omit<Project, 'slug' | 'createdAt' | 'updatedAt'>,
  existingSlug?: string
): Promise<Project> {
  const db = await getDb();
  const projectsCollection = db.collection('projects');
  const now = new Date();
  let slug: string;

  if (existingSlug) {
    // Update existing project
    slug = existingSlug;
    const projectRef = projectsCollection.doc(slug);

    // Check that project exists
    const existingDoc = await projectRef.get();
    if (!existingDoc.exists) {
      throw new Error(`Projet avec slug "${slug}" non trouvé pour mise à jour.`);
    }

    await projectRef.update({
      ...projectData,
      updatedAt: AdminTimestamp.fromDate(now),
    });
  } else {
    // Create new project
    const baseSlug = projectData.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

    slug = baseSlug;
    let counter = 1;

    // Ensure unique slug
    while (true) {
      const docSnapshot = await projectsCollection.doc(slug).get();
      if (!docSnapshot.exists) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create new project
    await projectsCollection.doc(slug).set({
      ...projectData,
      slug: slug,
      createdAt: AdminTimestamp.fromDate(now),
      updatedAt: AdminTimestamp.fromDate(now),
    });
  }

  // Get saved project
  const savedDoc = await projectsCollection.doc(slug).get();

  if (!savedDoc.exists) {
    throw new Error('Erreur lors de la sauvegarde du projet.');
  }

  const savedData = savedDoc.data()!;

  return {
    ...savedData,
    slug: savedDoc.id,
    createdAt: savedData.createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: savedData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
  } as Project;
}

/**
 * Get all projects
 */
export async function getProjects(): Promise<Project[]> {
  const db = await getDb();
  const snapshot = await db.collection('projects').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      slug: doc.id,
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    } as Project;
  });
}

/**
 * Get project by slug
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    console.log('🔍 getProjectBySlug called with slug:', slug);
    const db = await getDb();
    console.log('✅ Database connection obtained');

    const docRef = db.collection('projects').doc(slug);
    console.log('📄 Fetching document:', slug);

    const docSnap = await docRef.get();
    console.log('✅ Document fetched, exists:', docSnap.exists);

    if (!docSnap.exists) {
      console.log('❌ Project not found:', slug);
      return null;
    }

    const data = docSnap.data()!;
    console.log('📦 Project data retrieved for:', slug);
    console.log('🔍 Data keys:', Object.keys(data));
    console.log('🔍 Image data:', JSON.stringify(data.image));
    console.log('🔍 Status:', data.status);
    console.log('🔍 Technologies:', JSON.stringify(data.technologies));

    const project = {
      ...data,
      slug: docSnap.id,
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    } as Project;

    console.log('✅ Project object created successfully');
    console.log('🔍 Project serialization test:', JSON.stringify(project).substring(0, 200));

    return project;
  } catch (error) {
    console.error('❌ Error in getProjectBySlug:', error);
    console.error('❌ Error name:', (error as Error).name);
    console.error('❌ Error message:', (error as Error).message);
    console.error('❌ Error stack:', (error as Error).stack);
    return null;
  }
}

/**
 * Delete a project by slug
 */
export async function deleteProject(slug: string): Promise<boolean> {
  const db = await getDb();
  const docRef = db.collection('projects').doc(slug);

  try {
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      console.warn(`Project with slug "${slug}" not found for deletion.`);
      return false;
    }

    await docRef.delete();
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}
