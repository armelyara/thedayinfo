
import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await request.text();
  if (!session) {
    return NextResponse.json({ isUserAuthenticated: false }, { status: 400 });
  }
  const decodedToken = await verifySession(session);
  const isUserAuthenticated = !!decodedToken;
  return NextResponse.json({ isUserAuthenticated, decodedToken });
}
