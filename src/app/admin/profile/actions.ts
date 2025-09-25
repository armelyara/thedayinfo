// src/app/admin/profile/actions.ts
'use server';

import { getProfile, updateProfile, type Profile } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function getProfileAction(): Promise<Profile> {
  return await getProfile();
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
