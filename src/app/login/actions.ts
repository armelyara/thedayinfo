
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSessionCookie } from '@/lib/auth';

const formSchema = z.object({
  idToken: z.string(),
});

export async function createSession(values: z.infer<typeof formSchema>) {
    const validatedFields = formSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: 'Token invalide !' };
    }
  
    const { idToken } = validatedFields.data;
    
    try {
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 jours
        const sessionCookie = await createSessionCookie(idToken, { expiresIn });
        cookies().set('session', sessionCookie, {
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
    } catch(error) {
        console.error('Failed to create session cookie:', error);
        return { error: 'Impossible de créer la session.' };
    }
    
    revalidatePath('/');
    redirect('/admin');
}


export async function logout() {
    cookies().delete('session');
    revalidatePath('/');
    redirect('/login');
}
