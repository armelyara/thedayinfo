import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './routing';

const intlMiddleware = createMiddleware(routing);

function applySecurityHeaders(response: NextResponse) {
  const isDevelopment = process.env.NODE_ENV === 'development';

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
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    // Force le navigateur à oublier les ports internes (:8080)
    response.headers.set('Alt-Svc', 'clear');
  }

  return response;
}

const STATIC_ASSET_RE = /^\/[^/]+\.[a-zA-Z0-9]+$/;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host');

  // --- ÉTAPE 1 : Nettoyage du port 8080 ---
  if (host?.includes(':8080')) {
    const cleanHost = host.replace(':8080', '');
    return NextResponse.redirect(`https://${cleanHost}${pathname}${search}`, 301);
  }

  // --- ÉTAPE 2 : Assets statiques ---
  if (STATIC_ASSET_RE.test(pathname)) {
    return NextResponse.next();
  }

  // --- ÉTAPE 3 : API Routes ---
  if (pathname.startsWith('/api')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // --- ÉTAPE 4 : Internationalisation ---
  // On décommente ici pour que le dossier [locale] fonctionne
  const response = intlMiddleware(request);

  // --- ÉTAPE 5 : Application des headers de sécurité ---
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
