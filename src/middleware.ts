import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { verifySession } from './lib/auth';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
  // Run i18n middleware
  const i18nResponse = intlMiddleware(request);

  // Check for session
  const sessionCookie = request.cookies.get('session')?.value;
  const decodedToken = sessionCookie ? await verifySession(sessionCookie) : null;
  const isUserAuthenticated = !!decodedToken;
  const { pathname } = request.nextUrl;

  const isAdminRoute = new RegExp(`^/(${locales.join('|')})?/admin`).test(pathname);
  const isLoginPage = new RegExp(`^/(${locales.join('|')})?/login`).test(pathname);

  // Auth redirects
  if (isUserAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  if (!isUserAuthenticated && isAdminRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (i18nResponse.status >= 300 && i18nResponse.status < 400) {
    return i18nResponse;
  }
  
  const response = i18nResponse;
  
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
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
