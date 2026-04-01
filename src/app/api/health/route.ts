import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';
import { initializeFirebaseAdmin } from '@/lib/auth';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (session) {
    const decoded = await verifySession(session);
    if (decoded) {
      let initError = null;
      try {
        await initializeFirebaseAdmin();
      } catch (error: any) {
        initError = { message: error.message };
      }

      return NextResponse.json({
        status: initError ? 'error' : 'ok',
        firebase: {
          adminInitialized: admin.apps.length > 0,
        },
      });
    }
  }

  return NextResponse.json({ status: 'ok' });
}
