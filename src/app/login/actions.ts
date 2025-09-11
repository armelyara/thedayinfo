'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// This is a mock login function.
// In a real application, you would validate credentials against a database
// or an authentication service like Firebase Auth.
export async function login(values: z.infer<typeof formSchema>) {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' };
  }

  const { email, password } = validatedFields.data;

  // For demonstration purposes, we'll use a hardcoded admin credential.
  if (email === 'admin@example.com' && password === 'password') {
    // In a real app, you would create a session here.
  } else {
    return { error: 'Invalid email or password' };
  }
  
  // On successful login, redirect to the admin dashboard.
  redirect('/admin');
}
