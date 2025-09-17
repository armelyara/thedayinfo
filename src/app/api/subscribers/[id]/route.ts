// src/app/api/subscribers/[id]/route.ts
import { NextResponse } from 'next/server';
import { updateSubscriberStatus, deleteSubscriber } from '@/lib/data';

type RouteParams = {
  params: { id: string }
}

export async function PATCH(request: Request, { params }: RouteParams) {
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

export async function DELETE(request: Request, { params }: RouteParams) {
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