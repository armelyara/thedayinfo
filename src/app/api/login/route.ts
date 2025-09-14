
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionCookie, initializeFirebaseAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await initializeFirebaseAdmin();
  } catch (e) {
    console.error('Firebase admin initialization error on API route.', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const { idToken } = await request.json();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 jours

  try {
    const sessionCookie = await createSessionCookie(idToken, { expiresIn });
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}
