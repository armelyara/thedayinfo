
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  localePrefix: 'as-needed'
});

async function checkAuth(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) return { isAuthenticated: false };

    const url = new URL('/api/auth-check', request.url);
    const response = await fetch(url.toString(), {
        method: 'POST',
        body: sessionCookie,
    });

    if (response.ok) {
        const { isUserAuthenticated } = await response.json();
        return { isAuthenticated: isUserAuthenticated };
    } else {
        return { isAuthenticated: false };
    }
}

export async function middleware(request: NextRequest) {
  const i18nResponse = intlMiddleware(request);

  const { isAuthenticated } = await checkAuth(request);

  const { pathname } = request.nextUrl;
  const isAdminRoute = new RegExp(`^/(${locales.join('|')})?/admin`).test(pathname);
  const isLoginPage = new RegExp(`^/(${locales.join('|')})?/login`).test(pathname);

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  if (!isAuthenticated && isAdminRoute) {
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
    '/((?!api|_next/static|_next/image|favicon.ico).*?)'
  ]
};
