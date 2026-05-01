import * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';

const LOGIN_PATH = '/login';
const CLEAR_SESSION_PATH = `/api/auth/clear-session?redirect=${encodeURIComponent(LOGIN_PATH)}`;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      redirect(LOGIN_PATH);
    }

    const decoded = await verifySession(session);
    if (!decoded) {
      // Server Components can't call cookieStore.delete() in Next.js 14, so we
      // redirect through a Route Handler that clears the cookie before sending
      // the user to /login. Without this, the stale cookie would trap them in
      // a loop.
      redirect(CLEAR_SESSION_PATH);
    }
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[AdminLayout] Server error, redirecting to login:', error?.message);
    redirect(CLEAR_SESSION_PATH);
  }

  return <>{children}</>;
}
