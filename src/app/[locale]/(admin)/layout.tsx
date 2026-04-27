import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';

// Default locale uses no prefix (localePrefix: 'as-needed')
const DEFAULT_LOCALE = 'fr';

function loginPath(locale: string) {
  return locale === DEFAULT_LOCALE ? '/login' : `/${locale}/login`;
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
      // ⚠️ CRITICAL: Delete the stale/expired cookie before redirecting.
      // Without this, the middleware still sees the cookie, thinks the user
      // is authenticated, and blocks the login page → infinite redirect loop.
      cookieStore.delete('session');
      redirect(loginPath(locale));
    }
  } catch (error: any) {
    // Don't swallow redirect errors — Next.js throws them internally
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    // Any other error (e.g., Firebase Admin crash): redirect to login safely
    console.error('[AdminLayout] Server error, redirecting to login:', error?.message);
    redirect(loginPath(locale));
  }

  return <>{children}</>;
}

