import { NextResponse } from 'next/server';
import { addSubscriber, getSubscribers } from '@/lib/data-admin'; // ✅ Changé vers data-admin
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, preferences } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const subscriber = await addSubscriber(email, name); // ✅ Signature corrigée selon data-admin
    return NextResponse.json(subscriber, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'abonné:', error);
    if (error instanceof Error && error.message.includes('déjà abonnée')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const decodedClaims = await verifySession(sessionCookie);
    if (!decodedClaims) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const subscribers = await getSubscribers();
    return NextResponse.json(subscribers);
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnés:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}