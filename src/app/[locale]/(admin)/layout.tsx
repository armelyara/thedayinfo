import * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';

// Default locale uses no prefix (localePrefix: 'as-needed')
const DEFAULT_LOCALE = 'fr';

function loginPath(locale: string) {
  return locale === DEFAULT_LOCALE ? '/login' : `/${locale}/login`;
}

// When verifySession fails we must clear the cookie BEFORE returning to /login.
// The middleware only checks cookie presence, so leaving a stale cookie traps
// the user in an /admin ↔ /login loop. Server Components can't call
// cookieStore.delete() in Next.js 14, so we redirect through a Route Handler
// that can.
function clearSessionAndLoginPath(locale: string) {
  return `/api/auth/clear-session?redirect=${encodeURIComponent(loginPath(locale))}`;
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  // Support both Next.js 14 (sync params) and Next.js 15 (async params)
  const { locale } = await Promise.resolve(params);

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      redirect(loginPath(locale));
    }

    const decoded = await verifySession(session);
    if (!decoded) {
      redirect(clearSessionAndLoginPath(locale));
    }
  } catch (error: any) {
    // Don't swallow redirect errors — Next.js throws them internally
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    // Any other error (e.g., Firebase Admin crash): clear cookie and redirect safely
    console.error('[AdminLayout] Server error, redirecting to login:', error?.message);
    redirect(clearSessionAndLoginPath(locale));
  }

  return <>{children}</>;
}

