// src/app/api/firebase-config/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // On Firebase App Hosting, use FIREBASE_WEBAPP_CONFIG
  // On local dev, use NEXT_PUBLIC_* variables
  let firebaseConfig: any;

  if (process.env.FIREBASE_WEBAPP_CONFIG) {
    try {
      firebaseConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    } catch (error) {
      console.error('Failed to parse FIREBASE_WEBAPP_CONFIG:', error);
      return NextResponse.json(
        { error: "Failed to parse Firebase configuration." },
        { status: 500 }
      );
    }
  } else {
    firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
  }

  if (!firebaseConfig.apiKey) {
    return NextResponse.json(
      { error: "Firebase configuration is missing on the server." },
      { status: 500 }
    );
  }

  return NextResponse.json(firebaseConfig);
}
