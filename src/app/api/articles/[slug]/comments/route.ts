// src/app/api/articles/[slug]/comments/route.ts
import { NextResponse } from 'next/server';
import { updateArticleComments } from '@/lib/data-admin'; // ✅ Changé de data-client vers data-admin
import type { Comment } from '@/lib/data-types';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

type RouteParams = {
  params: { slug: string }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { comments }: { comments: Comment[] } = body;

    if (!comments || !Array.isArray(comments)) {
      return NextResponse.json(
        { error: 'Comments array is required' },
        { status: 400 }
      );
    }
    
    // Le commentaire peut être posté par un user public ou par un admin
    // La différence est dans le nom de l'auteur ("Armel Yara" pour l'admin)
    // On ne met pas de check d'auth ici pour permettre les commentaires publics.
    // L'auth est gérée côté admin pour les actions de modération
    const success = await updateArticleComments(params.slug, comments);

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Comment added successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to update comments' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
