import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionCookie, initializeFirebaseAdmin } from '@/lib/auth';
import { checkRateLimitFirestore } from '@/lib/rate-limit-firestore';
import { LoginSchema, validateSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

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

    // Validate input with Zod
    const validation = validateSchema(LoginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.errors },
        { status: 400 }
      );
    }

    const { idToken } = validation.data;

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
      secure: true,
      sameSite: 'lax',
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

    const errorMessage = error.message || 'Échec de l\'authentification';

    return NextResponse.json({
      error: errorMessage,
      code: error.code,
      details: error.message
    }, { status: 401 });
  }
}