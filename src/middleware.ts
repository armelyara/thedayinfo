import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './routing';

//const intlMiddleware = createMiddleware(routing);

function applySecurityHeaders(response: NextResponse) {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://apis.google.com https://accounts.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com;
    img-src 'self' blob: data: https: firebasestorage.googleapis.com;
    font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://accounts.google.com https://*.firebaseapp.com;
    frame-ancestors 'none';
    connect-src 'self'
      https://identitytoolkit.googleapis.com
      https://securetoken.googleapis.com
      https://firebasestorage.googleapis.com
      https://firestore.googleapis.com
      https://*.googleapis.com
      https://generativelanguage.googleapis.com;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  response.headers.set('X-XSS-Protection', '1; mode=block');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );

    // Invalidate any cached Alt-Svc / QUIC entries pointing to the internal
    // Cloud Run port (:8080). Earlier middleware versions emitted Location
    // headers with that port; affected browsers can stay stuck on it for up
    // to 30 days (alt-svc max-age) even after "clear cache" and incognito.
    // `Alt-Svc: clear` purges the cache surgically without touching cookies
    // or sessions. Safe to leave in place permanently.
    response.headers.set('Alt-Svc', 'clear');
  }

  return response;
}

// Top-level static assets in /public (e.g. /animations.jsx, /robots.txt).
// next-intl would otherwise try to map them to localized pages and 404 them.
const STATIC_ASSET_RE = /^\/[^/]+\.[a-zA-Z0-9]+$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets: pass through, no headers (they're not pages).
  if (STATIC_ASSET_RE.test(pathname)) {
    return NextResponse.next();
  }

  // API routes: skip next-intl entirely (its rewrite/redirect logic breaks
  // POST bodies and 404s the route). Apply security headers only.
  if (pathname.startsWith('/api')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Page routes: delegate routing/rewrite to next-intl, then layer headers.
  // Returning intlMiddleware's response (instead of NextResponse.next())
  // preserves the internal rewrite header that maps `/` → `/fr` so the
  // [locale] app directory matches.
  //const response = intlMiddleware(request);
  //return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
