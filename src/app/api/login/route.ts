import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionCookie, initializeFirebaseAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  console.log('=== API LOGIN START ===');
  
  try {
    const body = await request.json();
    console.log('Request body received');
    
    const { idToken } = body;
    if (!idToken) {
      console.log('No idToken provided');
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }
    
    console.log('Token présent, longueur:', idToken.length);
    console.log('Initialisation Firebase Admin...');
    
    await initializeFirebaseAdmin();
    console.log('Firebase Admin initialisé');
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 jours
    
    console.log('Création session cookie...');
    const sessionCookie = await createSessionCookie(idToken, { expiresIn });
    console.log('Session cookie créé');
    
    (await cookies()).set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    
    console.log('Cookie défini, succès');
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('=== ERREUR COMPLÈTE ===');
    console.error('Type:', typeof error);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({ 
      error: `Session failed: ${error.message}`,
      code: error.code 
    }, { status: 401 });
  }
}