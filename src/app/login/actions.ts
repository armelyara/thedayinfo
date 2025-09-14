
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSessionCookie } from '@/lib/auth';

export async function createSession(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  try {
    const sessionCookie = await createSessionCookie(idToken, { expiresIn });
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to create session:', error);
    return { success: false, error: 'Failed to create session.' };
  }
}


export async function logout() {
    cookies().delete('session');
    revalidatePath('/');
    redirect('/login');
}
