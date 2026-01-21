import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add pathname header for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-next-pathname', request.nextUrl.pathname);
  }

  // ========================================
  // HEADERS DE SÉCURITÉ POUR TOUTES LES ROUTES
  // ========================================

  // 1. Content Security Policy (CSP)
  // Protège contre les attaques XSS en contrôlant les sources de contenu autorisées
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https: firebasestorage.googleapis.com;
    font-src 'self' data: https://cdnjs.cloudflare.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // 2. X-Frame-Options
  // Empêche le site d'être chargé dans une iframe (protection contre le clickjacking)
  response.headers.set('X-Frame-Options', 'DENY');

  // 3. X-Content-Type-Options
  // Empêche le navigateur de deviner le type MIME
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 4. Referrer-Policy
  // Contrôle les informations de referrer envoyées
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. Permissions-Policy
  // Désactive les fonctionnalités du navigateur non nécessaires
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // 6. X-XSS-Protection (pour les vieux navigateurs)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 7. Strict-Transport-Security (HSTS)
  // Force l'utilisation de HTTPS (seulement en production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except for static files and _next/image
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
