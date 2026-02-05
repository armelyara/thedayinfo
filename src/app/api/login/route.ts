import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionCookie, initializeFirebaseAdmin } from '@/lib/auth';
import { checkRateLimitFirestore } from '@/lib/rate-limit-firestore';

export async function POST(request: Request) {
  try {
    // 1. Extraire l'IP du client
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 2. Vérifier le rate limit : 5 tentatives par 15 minutes
    const rateLimitResult = await checkRateLimitFirestore(
      `login:${ip}`,
      5,
      15 * 60 * 1000
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Trop de tentatives de connexion. Réessayez plus tard.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        }
      );
    }

    const body = await request.json();

    const { idToken } = body;
    if (!idToken) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    if (typeof idToken !== 'string' || idToken.length < 100) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('=== API LOGIN START ===');
      console.log('IP:', ip);
      console.log('Initializing Firebase Admin...');
    }

    await initializeFirebaseAdmin();

    if (process.env.NODE_ENV === 'development') {
      console.log('Firebase Admin initialized, creating session cookie...');
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 jours

    const sessionCookie = await createSessionCookie(idToken, { expiresIn });

    (await cookies()).set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use secure flag in production (requires HTTPS)
      sameSite: 'lax', // Changed from 'strict' for better compatibility
      path: '/',
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Session créée avec succès');
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erreur authentification:', {
      code: error.code,
      message: error.message,
      name: error.name,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });

    // Log specific Firebase Admin errors
    if (error.code?.startsWith('auth/')) {
      console.error('Firebase Auth Error:', error.code);
    }

    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Échec de l\'authentification'
      : `Session failed: ${error.message}`;

    return NextResponse.json({
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && {
        code: error.code,
        details: error.message
      })
    }, { status: 401 });
  }
}