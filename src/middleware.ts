import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';

// Initialisation du middleware next-intl
const intlMiddleware = createMiddleware(routing);


export function middleware(request: NextRequest) {
  // 1. Exécuter le middleware d'internationalisation en premier
  // Cela gère les redirections / -> /fr, etc.
  const response = intlMiddleware(request);

  // 2. Vérification de l'authentification
  // On vérifie directement le cookie pour éviter un appel fetch interne coûteux
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthenticated = !!sessionCookie;

  const { pathname } = request.nextUrl;

  // Regex pour détecter les routes admin, peu importe la locale (/fr/admin ou /admin)
  // On échappe les locales pour la regex
  const localesPattern = routing.locales.join('|');
  const isAdminRoute = new RegExp(`^(/(${localesPattern}))?/admin`).test(pathname);
  const isLoginPage = new RegExp(`^(/(${localesPattern}))?/login`).test(pathname);

  // Déterminer la locale actuelle pour les redirections
  const currentLocale = routing.locales.find(l => pathname.startsWith(`/${l}`)) || routing.defaultLocale;


  // CAS 1: Tentative d'accès Admin sans être connecté -> Login
  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url);
    // On garde l'URL d'origine pour rediriger après le login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // CAS 2: Tentative d'accès Login alors que déjà connecté -> Admin
  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${currentLocale}/admin`, request.url));
  }

  // 3. Ajout des Headers de Sécurité (CSP)
  // On applique les headers sur la réponse générée par next-intl
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: firebasestorage.googleapis.com;
    font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
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
  }

  return response;
}

export const config = {
  // Matcher standard pour next-intl
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)']
};