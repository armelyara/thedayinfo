
import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;

    if (!session) {
      return NextResponse.json({ authenticated: false, reason: 'no_session_cookie' });
    }

    const decodedToken = await verifySession(session);
    const authenticated = !!decodedToken;

    if (!authenticated) {
      console.warn('Session verification failed');
    }

    return NextResponse.json({ authenticated, decodedToken });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      reason: 'verification_error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
