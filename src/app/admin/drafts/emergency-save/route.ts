import { NextRequest, NextResponse } from 'next/server';
import { saveDraftAction } from '@/lib/data-admin';

export async function POST(request: NextRequest) {
    try {
        const draftData = await request.json();
        
        // Sauvegarde d'urgence via Beacon API
        await saveDraftAction({
            ...draftData,
            id: draftData.id || `emergency_${Date.now()}`
        });
        
        // Beacon API ne s'attend pas à une réponse, mais on renvoie OK.
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('Emergency save failed:', error);
        return NextResponse.json(
            { error: 'Emergency save failed' },
            { status: 500 }
        );
    }
}
