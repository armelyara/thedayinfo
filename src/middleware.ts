
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import admin from 'firebase-admin';

export const runtime = 'nodejs';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export async function middleware(Request: NextRequest) {
  const sessionCookie = Request.cookies.get('session')?.value;
  const { pathname } = Request.nextUrl;

  const isAuthPage = pathname === '/login';

  if (!sessionCookie) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    const url = Request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    await admin.auth().verifySessionCookie(sessionCookie, true);
    // Session is valid.
    if (isAuthPage) {
        const url = Request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
  } catch (error) {
    // Session cookie is invalid. Clear it and redirect to login.
    const response = NextResponse.redirect(new URL('/login', Request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
