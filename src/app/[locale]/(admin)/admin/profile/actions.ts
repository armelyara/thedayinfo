// src/app/admin/profile/actions.ts
'use server';

import { getProfile } from '@/lib/data-client';
import { updateProfile } from '@/lib/data-admin';
import type { Profile } from '@/lib/data-types';
import { revalidatePath } from 'next/cache';

export async function getProfileAction(): Promise<Profile> {
  const profile = await getProfile();
  
  if (!profile) {
    // Retourner un profil par défaut
    return {
      name: 'Armel Yara',
      biography: 'Créateur de The Day Info...',
      imageUrl: '/default-avatar.png'
    };
  }
  
  return profile;
}

export async function updateProfileAction(data: Partial<Profile>): Promise<Profile> {
  const updatedProfile = await updateProfile(data);
  
  // Revalidate the public about page to show the new data
  revalidatePath('/about');
  // Revalidate the admin profile page
  revalidatePath('/admin/profile');
  // Revalidate sidebar in case the name/image is used there
  revalidatePath('/', 'layout');

  return updatedProfile;
}