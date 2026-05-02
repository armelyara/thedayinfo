import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function applySecurityHeaders(response: NextResponse) {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://apis.google.com https://accounts.google.com https://unpkg.com;
    script-src-elem 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://apis.google.com https://accounts.google.com https://unpkg.com;
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
      https://generativelanguage.googleapis.com
      https://unpkg.com;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    // Force browsers to drop any cached Alt-Svc / QUIC entry pointing to :8080.
    response.headers.set('Alt-Svc', 'clear');
  }

  return response;
}

const STATIC_ASSET_RE = /^\/[^/]+\.[a-zA-Z0-9]+$/;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host');

  // Defensive: if a stale browser sends Host with the leaked Cloud Run port,
  // strip it and emit a permanent redirect to the clean canonical URL.
  if (host?.includes(':8080')) {
    const cleanHost = host.replace(':8080', '');
    return NextResponse.redirect(`https://${cleanHost}${pathname}${search}`, 301);
  }

  // Static assets: pass through without headers (they're not pages).
  if (STATIC_ASSET_RE.test(pathname)) {
    return NextResponse.next();
  }

  // API routes: apply security headers, no other rewrites.
  if (pathname.startsWith('/api')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Pages: just headers. No locale handling.
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
