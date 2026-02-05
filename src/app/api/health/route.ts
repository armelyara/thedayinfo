import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin } from '@/lib/auth';
import admin from 'firebase-admin';

export async function GET() {
    try {
        // Try to initialize Firebase Admin
        await initializeFirebaseAdmin();

        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            firebase: {
                adminInitialized: admin.apps.length > 0,
                hasFirebaseConfig: !!process.env.FIREBASE_CONFIG,
                hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
                hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
                nodeEnv: process.env.NODE_ENV,
            }
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
