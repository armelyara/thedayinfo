// src/app/api/admin/articles/route.ts
import { NextResponse } from 'next/server';
import { getAdminArticles } from '@/lib/data';

export async function GET() {
  try {
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