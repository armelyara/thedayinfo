
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function logout() {
    cookies().delete('session');
    revalidatePath('/');
    redirect('/login');
}
