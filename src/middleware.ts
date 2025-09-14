
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { admin } from '@/lib/firebase';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login';

  if (!sessionCookie) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    await admin.auth().verifySessionCookie(sessionCookie, true);
    // Session is valid.
    if (isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
  } catch (error) {
    // Session cookie is invalid. Clear it and redirect to login.
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
