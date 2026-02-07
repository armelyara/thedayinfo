import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/auth';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    let initError = null;

    try {
        // Try to initialize Firebase Admin
        await initializeFirebaseAdmin();
    } catch (error: any) {
        initError = {
            message: error.message,
            code: error.code,
            stack: error.stack,
        };
    }

    try {
        const health = {
            status: initError ? 'error' : 'ok',
            timestamp: new Date().toISOString(),
            firebase: {
                adminInitialized: admin.apps.length > 0,
                hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
                hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
                hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
                nodeEnv: process.env.NODE_ENV,
            },
            initError,
        };

        return NextResponse.json(health);
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }, { status: 500 });
    }
}
