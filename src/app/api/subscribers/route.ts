// src/app/api/subscribers/route.ts
import { NextResponse } from 'next/server';
import { addSubscriber, getSubscribers } from '@/lib/data';

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

    const subscriber = await addSubscriber({ email, name, preferences });
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
  try {
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