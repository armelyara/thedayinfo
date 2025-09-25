// src/app/api/admin/articles/route.ts
import { NextResponse } from 'next/server';
import { getAdminArticles } from '@/lib/data';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

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

    const articles = await getAdminArticles();
    return NextResponse.json(articles);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
