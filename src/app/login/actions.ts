
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function login(values: z.infer<typeof formSchema>) {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Champs invalides !' };
  }

  const { email, password } = validatedFields.data;

  // Pour la démonstration, nous utiliserons des identifiants fixes.
  if (email === 'admin@example.com' && password === 'password') {
    // Créer la session en définissant un cookie
    cookies().set('session', 'authenticated', { 
        httpOnly: true, // Empêche l'accès côté client
        secure: process.env.NODE_ENV === 'production', // Uniquement en HTTPS en production
        maxAge: 60 * 60 * 24, // 24 heures
        path: '/', // Disponible sur tout le site
    });
  } else {
    return { error: 'Email ou mot de passe invalide' };
  }
  
  // Rediriger vers le tableau de bord admin après une connexion réussie.
  redirect('/admin');
}


export async function logout() {
    cookies().delete('session');
    redirect('/login');
}
