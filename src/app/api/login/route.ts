
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionCookie, initializeFirebaseAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 jours

    // Ensure admin is initialized before creating a cookie
    await initializeFirebaseAdmin();
    
    const sessionCookie = await createSessionCookie(idToken, { expiresIn });
    
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to create session:', error);
    // Return a more specific error message if possible
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}
