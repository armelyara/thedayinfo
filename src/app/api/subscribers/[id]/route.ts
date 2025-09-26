import { NextRequest, NextResponse } from 'next/server';
import { updateSubscriberStatus, deleteSubscriber } from '@/lib/data-admin';
import { verifySession } from '@/lib/auth';

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
    const { status } = body;

    if (!status || !['active', 'unsubscribed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status invalide' },
        { status: 400 }
      );
    }
    
    // Pour la route de désabonnement publique, on n'exige pas d'être admin
    if (status === 'unsubscribed') {
        await updateSubscriberStatus(params.id, 'unsubscribed');
        return NextResponse.json({ success: true });
    }

    // Pour toute autre action (comme réactiver), on vérifie si l'utilisateur est admin
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
