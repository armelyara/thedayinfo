import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';

// middleware next-intl
const intlMiddleware = createMiddleware(routing);


function applySecurityHeaders(response: NextResponse) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${isDevelopment ? "'unsafe-eval'" : ''} https://cdnjs.cloudflare.com https://apis.google.com https://accounts.google.com;
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
  }

  return response;
}

// Top-level static asset paths (e.g. /animations.jsx, /robots.txt,
// /sitemap.xml) — single segment with a file extension. These live in
// /public; if next-intl runs on them it tries to map them to a localized
// page and returns 404.
const STATIC_ASSET_RE = /^\/[^/]+\.[a-zA-Z0-9]+$/;

// Firebase App Hosting (Cloud Run) binds the container to port 8080 on
// 0.0.0.0 internally. Standalone Next.js sometimes leaks this address into
// URLs derived from `request.url`, producing redirects to
// https://0.0.0.0:8080/... or https://thedayinfo.com:8080/... that no
// client can reach. This helper rebuilds redirect targets from the public
// host header, rejecting any host that is clearly an internal bind address.
const JUNK_HOST_RE = /^(0\.0\.0\.0|127\.0\.0\.1|::1|169\.254\.)/;
const PROD_PUBLIC_HOST = process.env.NEXT_PUBLIC_SITE_HOST || 'thedayinfo.com';

function publicRedirect(request: NextRequest, path: string): URL {
  const isDev = process.env.NODE_ENV === 'development';
  const xfProto = request.headers.get('x-forwarded-proto');
  const proto = xfProto || (isDev ? 'http' : 'https');

  const candidates = [
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
    request.nextUrl.host,
  ];

  let host: string | null = null;
  for (const c of candidates) {
    if (!c) continue;
    const stripped = isDev ? c : c.replace(/:\d+$/, ''); // keep port in dev (3000)
    if (!JUNK_HOST_RE.test(stripped)) {
      host = stripped;
      break;
    }
  }

  if (!host) {
    host = isDev ? 'localhost:3000' : PROD_PUBLIC_HOST;
  }

  return new URL(path, `${proto}://${host}`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the parsed URL itself carries the leaked internal port, redirect to
  // the same path without the port so the browser drops the bad URL from
  // its address bar / cache. 308 preserves the request method.
  if (request.nextUrl.port === '8080') {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.port = '';
    return NextResponse.redirect(cleanUrl, 308);
  }
  // Skip middleware for static assets served from /public. They don't need
  // CSP headers (they're not pages) and CORS is set in next.config.js.
  if (STATIC_ASSET_RE.test(pathname)) {
    return NextResponse.next();
  }

  // API routes: skip next-intl entirely (it would otherwise rewrite/redirect
  // /api/* paths and break POST bodies). Apply security headers only.
  if (pathname.startsWith('/api')) {
    return applySecurityHeaders(NextResponse.next());
  }

  const response = intlMiddleware(request);
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthenticated = !!sessionCookie;

  const localesPattern = routing.locales.join('|');
  const isAdminRoute = new RegExp(`^(/(${localesPattern}))?/admin`).test(pathname);
  const isLoginPage = new RegExp(`^(/(${localesPattern}))?/login`).test(pathname);
  const currentLocale = routing.locales.find(l => pathname.startsWith(`/${l}`)) || routing.defaultLocale;


  // CASE 1: Attempt to access Admin without being logged in Login
  if (isAdminRoute && !isAuthenticated) {
    const prefix = currentLocale === routing.defaultLocale ? '' : `/${currentLocale}`;
    const loginUrl = publicRedirect(request, `${prefix}/login`);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // CASE 2: Attempt to access Login while already logged in Admin
  if (isLoginPage && isAuthenticated) {
    const prefix = currentLocale === routing.defaultLocale ? '' : `/${currentLocale}`;
    return NextResponse.redirect(publicRedirect(request, `${prefix}/admin`));
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)']
};