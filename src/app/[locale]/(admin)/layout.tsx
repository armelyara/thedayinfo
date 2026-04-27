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
  params: { locale: string };
}) {
  const cookieStore = cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    redirect(loginPath(params.locale));
  }

  const decoded = await verifySession(session);
  if (!decoded) {
    // ⚠️ CRITICAL: Delete the stale/expired cookie before redirecting.
    // Without this, the middleware still sees the cookie, thinks the user
    // is authenticated, and blocks the login page → infinite redirect loop.
    cookieStore.delete('session');
    redirect(loginPath(params.locale));
  }

  return <>{children}</>;
}
