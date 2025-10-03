// src/app/api/articles/[slug]/reaction/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/auth';

let adminDb: FirebaseFirestore.Firestore;

async function getAdminDb() {
  if (!adminDb) {
    await initializeFirebaseAdmin();
    adminDb = getFirestore();
  }
  return adminDb;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { reaction, action } = await request.json();
    const { slug } = params;

    if (!reaction || !action || !slug) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    const articleRef = db.collection('articles').doc(slug);

    // Utiliser une transaction pour éviter les race conditions
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(articleRef);
      
      if (!doc.exists) {
        throw new Error('Article non trouvé');
      }

      const currentData = doc.data()!;
      let likes = currentData.likes || 0;
      let dislikes = currentData.dislikes || 0;

      // Appliquer les changements selon l'action
      if (action === 'add') {
        if (reaction === 'like') {
          likes += 1;
        } else {
          dislikes += 1;
        }
      } else if (action === 'remove') {
        if (reaction === 'like') {
          likes = Math.max(0, likes - 1);
        } else {
          dislikes = Math.max(0, dislikes - 1);
        }
      } else if (action === 'switch') {
        if (reaction === 'like') {
          // Passer de dislike à like
          dislikes = Math.max(0, dislikes - 1);
          likes += 1;
        } else {
          // Passer de like à dislike
          likes = Math.max(0, likes - 1);
          dislikes += 1;
        }
      }

      // Mettre à jour le document
      transaction.update(articleRef, {
        likes,
        dislikes,
      });

      return { likes, dislikes };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réaction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}