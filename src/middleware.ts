
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware passes the pathname to the client-side for use in layouts.
export function middleware(request: NextRequest) {
  
  // Exclude API routes from this header to avoid unnecessary processing
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Match all paths except for static files and _next/image
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
