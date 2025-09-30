// src/app/api/admin/rate-limit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { 
  getRateLimitStats, 
  resetRateLimitFirestore, 
  banIdentifier 
} from '@/lib/rate-limit-firestore';

async function checkAuth(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) return null;
  return await verifySession(sessionCookie);
}

// GET /api/admin/rate-limit?identifier=login:192.168.1.1
export async function GET(request: NextRequest) {
  const decodedClaims = await checkAuth(request);
  if (!decodedClaims) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('identifier');

  if (!identifier) {
    return NextResponse.json({ error: 'Identifier requis' }, { status: 400 });
  }

  const stats = await getRateLimitStats(identifier);
  
  if (!stats) {
    return NextResponse.json({ message: 'Aucune limite trouvée' }, { status: 404 });
  }

  return NextResponse.json(stats);
}

// DELETE /api/admin/rate-limit?identifier=login:192.168.1.1
export async function DELETE(request: NextRequest) {
  const decodedClaims = await checkAuth(request);
  if (!decodedClaims) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('identifier');

  if (!identifier) {
    return NextResponse.json({ error: 'Identifier requis' }, { status: 400 });
  }

  await resetRateLimitFirestore(identifier);
  
  return NextResponse.json({ message: 'Rate limit réinitialisé' });
}

// POST /api/admin/rate-limit/ban
export async function POST(request: NextRequest) {
  const decodedClaims = await checkAuth(request);
  if (!decodedClaims) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await request.json();
  const { identifier, durationMs } = body;

  if (!identifier) {
    return NextResponse.json({ error: 'Identifier requis' }, { status: 400 });
  }

  await banIdentifier(identifier, durationMs);
  
  return NextResponse.json({ message: `${identifier} banni avec succès` });
}