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

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // ── Canonical domain: redirect www → non-www (301 permanent) ──────────────
  // Firebase App Hosting only serves the apex domain (thedayinfo.com).
  // If a user lands on www.thedayinfo.com, Next.js RSC payload fetches fail
  // because www. isn't wired up. Redirect immediately before any other logic.
  if (process.env.NODE_ENV === 'production' && host.startsWith('www.')) {
    const canonicalHost = host.slice(4); // remove 'www.'
    return NextResponse.redirect(
      `https://${canonicalHost}${pathname}${search}`,
      { status: 301 }
    );
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

  // Build an absolute redirect URL from the public host header (the same
  // pattern used by the www → non-www redirect above). Next.js's edge adapter
  // re-parses the Location header through `new NextURL(...)` and throws
  // "Invalid URL" if we hand it a relative path, which 500s every redirect.
  // We deliberately avoid `request.url`: on Firebase App Hosting it reflects
  // the internal bind address (0.0.0.0:8080), producing a dead Location.
  const protocol = request.nextUrl.protocol; // 'http:' or 'https:'
  const buildRedirect = (path: string) => `${protocol}//${host}${path}`;

  // CASE 1: Attempt to access Admin without being logged in
  if (isAdminRoute && !isAuthenticated) {
    const prefix = currentLocale === routing.defaultLocale ? '' : `/${currentLocale}`;
    const target = `${prefix}/login?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(buildRedirect(target), { status: 307 });
  }

  // CASE 2: Attempt to access Login while already logged in
  if (isLoginPage && isAuthenticated) {
    const prefix = currentLocale === routing.defaultLocale ? '' : `/${currentLocale}`;
    return NextResponse.redirect(buildRedirect(`${prefix}/admin`), { status: 307 });
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)']
};