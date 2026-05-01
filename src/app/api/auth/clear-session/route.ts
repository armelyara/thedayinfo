import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Used by the admin layout when it detects an invalid/expired session cookie.
// Server Components can't call cookieStore.delete() in Next.js 14 — only a
// Route Handler can. Without this hop, the stale cookie would persist and the
// middleware (which only checks cookie presence) would loop the user between
// /admin and /login. Only logged-in actions live behind a session, so a GET
// that clears the visitor's own cookie is not a meaningful CSRF vector.
export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirect') || '/login';

  const host = request.headers.get('host') ?? request.nextUrl.host;
  const protocol = request.nextUrl.protocol;
  const target = `${protocol}//${host}${redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`}`;

  const cookieStore = await cookies();
  cookieStore.delete('session');

  return NextResponse.redirect(target, { status: 307 });
}
