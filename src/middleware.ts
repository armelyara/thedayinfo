import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './routing';

const intlMiddleware = createMiddleware(routing);

function applySecurityHeaders(response: NextResponse) {
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cloudflare.com https://google.com https://google.com;
    style-src 'self' 'unsafe-inline' https://googleapis.com https://google.com;
    img-src 'self' blob: data: https: ://googleapis.com;
    font-src 'self' data: https://cloudflare.com https://gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-src 'self' https://google.com https://*.firebaseapp.com;
    frame-ancestors 'none';
    connect-src 'self'
      https://googleapis.com
      https://googleapis.com
      https://://googleapis.com
      https://googleapis.com
      https://*.googleapis.com
      https://googleapis.com;
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
    // TRÈS IMPORTANT : On force le nettoyage du cache des ports mal mémorisés
    response.headers.set('Alt-Svc', 'clear');
  }

  return response;
}

const STATIC_ASSET_RE = /^\/[^/]+\.[a-zA-Z0-9]+$/;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host');

  // --- ÉTAPE 1 : CORRECTION DU PORT 8080 ---
  // Si le port 8080 apparaît dans le host, on redirige immédiatement vers l'URL propre
  if (host?.includes(':8080')) {
    const cleanHost = host.replace(':8080', '');
    // On force l'URL vers https://thedayinfo.com sans le port
    return NextResponse.redirect(`https://${cleanHost}${pathname}${search}`, 301);
  }

  // --- ÉTAPE 2 : ASSETS STATIQUES ---
  if (STATIC_ASSET_RE.test(pathname)) {
    return NextResponse.next();
  }

  // --- ÉTAPE 3 : API ROUTES ---
  if (pathname.startsWith('/api')) {
    return applySecurityHeaders(NextResponse.next());
  }

  // --- ÉTAPE 4 : INTERNATIONALISATION (Dossier [locale]) ---
  // On RÉACTIVE le middleware pour que les liens internes fonctionnent
  const response = intlMiddleware(request);

  // --- ÉTAPE 5 : SÉCURITÉ ---
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
