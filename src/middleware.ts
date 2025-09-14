
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware now only handles basic routing logic.
// The session verification is moved to the server components that need it.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  const isAdminPath = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/login';

  // If trying to access admin pages without a session, redirect to login
  if (isAdminPath && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access login page, redirect to admin
  if (isLoginPage && sessionCookie) {
    // We will attempt to verify the cookie on the admin page itself.
    // If it's invalid, it will be handled there.
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export const config = {
  // Match all paths except for static files and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
