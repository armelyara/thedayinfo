// src/app/api/firebase-config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // These variables are available on the server during runtime in Firebase App Hosting.
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey) {
    return NextResponse.json(
      { error: "Firebase configuration is missing on the server." },
      { status: 500 }
    );
  }

  return NextResponse.json(firebaseConfig);
}
