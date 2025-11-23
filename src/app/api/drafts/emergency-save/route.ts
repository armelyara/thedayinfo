import { NextRequest, NextResponse } from 'next/server';
import { saveDraftAction } from '@/lib/data-admin';

export async function POST(request: NextRequest) {
    try {
        const draftData = await request.json();
        
        // Validation minimale
        if (!draftData.title || !draftData.content) {
            console.error('Emergency save: données incomplètes');
            return new Response(null, { status: 204 });
        }
        
        // Sauvegarde d'urgence via Beacon API
        await saveDraftAction({
            ...draftData,
            id: draftData.id || `emergency_${Date.now()}`,
            status: 'draft'
        });
        
        // Beacon API ne s'attend pas à une réponse, mais on renvoie OK.
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('Emergency save failed:', error);
        // Ne pas retourner d'erreur car Beacon ne lit pas les réponses
        return new Response(null, { status: 204 });
    }
}

