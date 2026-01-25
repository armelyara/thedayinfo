
import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const decodedToken = await verifySession(session);
  const authenticated = !!decodedToken;

  return NextResponse.json({ authenticated, decodedToken });
}
