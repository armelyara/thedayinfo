import { NextRequest, NextResponse } from 'next/server';
import { updateSubscriberStatus, deleteSubscriber, getSubscriberByEmail } from '@/lib/data-admin';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function checkAuth(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) return null;
  return await verifySession(sessionCookie);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, token } = body; // ← Récupérer le token depuis le body

    if (!status || !['active', 'unsubscribed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status invalide' },
        { status: 400 }
      );
    }
    
    // ✅ Pour le désabonnement public, vérifier le token
    if (status === 'unsubscribed') {
        // Vérifier que le token est fourni
        if (!token) {
          return NextResponse.json(
            { error: 'Token de désabonnement requis' },
            { status: 403 }
          );
        }

        // Récupérer le subscriber pour vérifier le token
        const subscriber = await getSubscriberByEmail(params.id);
        
        if (!subscriber) {
          return NextResponse.json(
            { error: 'Abonné non trouvé' },
            { status: 404 }
          );
        }

        // Vérifier que le token correspond
        if (subscriber.unsubscribeToken !== token) {
          return NextResponse.json(
            { error: 'Token de désabonnement invalide' },
            { status: 403 }
          );
        }

        // Token valide, procéder au désabonnement
        await updateSubscriberStatus(params.id, 'unsubscribed');
        return NextResponse.json({ 
          success: true,
          message: 'Vous avez été désabonné avec succès' 
        });
    }

    // ✅ Pour toute autre action (réactivation), exiger l'authentification admin
    const decodedClaims = await checkAuth(request);
    if (!decodedClaims) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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
  const decodedClaims = await checkAuth(request);
  if (!decodedClaims) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  
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