// 1. src/app/api/subscribers/route.ts - API pour les abonnements
import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, getSubscribers } from '@/lib/data';

export async function POST(request: NextRequest) {
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

// 2. src/app/api/subscribers/[id]/route.ts - Actions sur un abonné spécifique
import { NextRequest, NextResponse } from 'next/server';
import { updateSubscriberStatus, deleteSubscriber } from '@/lib/data';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'unsubscribed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status invalide' },
        { status: 400 }
      );
    }

    await updateSubscriberStatus(params.id, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteSubscriber(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// 3. src/app/api/admin/articles/route.ts - API pour les articles admin
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

// 4. src/app/api/articles/[slug]/route.ts - API pour un article spécifique
import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await getArticleBySlug(params.slug);
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// 5. src/app/api/subscribers/stats/route.ts - Statistiques des abonnés
import { NextResponse } from 'next/server';
import { getSubscribersCount } from '@/lib/data';

export async function GET() {
  try {
    const stats = await getSubscribersCount();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}