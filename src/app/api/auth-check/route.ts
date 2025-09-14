
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

export async function GET() {
  const sessionCookie = cookies().get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decodedClaims = await verifySession(sessionCookie);
    if (decodedClaims) {
      return NextResponse.json({ authenticated: true });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
