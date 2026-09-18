import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

// Only these internal paths may be redirect targets — prevents open redirects
// and stops a bad `redirect` param from producing an off-site Location.
const ALLOWED_REDIRECTS = new Set(['/login', '/admin']);

// Used by the admin layout when it detects an invalid/expired (or non-admin)
// session cookie. Server Components can't call cookieStore.delete() in Next.js
// 14 — only a Route Handler can. Without this hop, the stale cookie would
// persist and the middleware (which only checks cookie presence) would loop the
// user between /admin and /login.
//
// The redirect target is built from the CANONICAL origin (SITE_URL), never from
// the request Host header / nextUrl protocol: on Cloud Run those carry the
// internal host and http/:8080, which leak into the Location and make the Google
// Front End reject the follow-up request ("Forbidden ... get URL /login").
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('redirect') || '/login';
  const dest = ALLOWED_REDIRECTS.has(requested) ? requested : '/login';

  const cookieStore = await cookies();
  cookieStore.delete('session');

  return NextResponse.redirect(new URL(dest, SITE_URL), { status: 307 });
}
