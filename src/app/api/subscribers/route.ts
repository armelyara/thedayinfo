import { NextResponse } from 'next/server';
import { addSubscriber, getSubscribers } from '@/lib/data-admin';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { checkRateLimitFirestore } from '@/lib/rate-limit-firestore';
import { SubscriberSchema, validateSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Rate limiting : 3 abonnements par heure
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await checkRateLimitFirestore(
      `subscribe:${ip}`,
      3,
      60 * 60 * 1000
    );
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Trop d\'abonnements. Réessayez plus tard.',
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
    const validation = validateSchema(SubscriberSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.errors },
        { status: 400 }
      );
    }

    const { email, name, preferences } = validation.data;
    const subscriber = await addSubscriber(email, name, preferences);
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