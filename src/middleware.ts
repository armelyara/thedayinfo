
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Si l'utilisateur n'est pas authentifié et essaie d'accéder à une page admin (sauf /login)
  if (!session && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si l'utilisateur est authentifié et essaie d'accéder à /login, le rediriger vers /admin
  if (session && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Le matcher exécute le middleware uniquement sur les routes /admin et /login
  matcher: ['/admin/:path*', '/login'],
}
