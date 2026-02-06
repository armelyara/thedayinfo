import { NextRequest, NextResponse } from 'next/server';
import { saveDraftAction } from '@/lib/data-admin';
import { DraftSchema } from '@/lib/validation-schemas';
import { z } from 'zod';

export async function POST(request: NextRequest) {
    try {
        const draftData = await request.json();

        // Validate with Zod - use partial for emergency saves (some fields may be incomplete)
        const EmergencyDraftSchema = DraftSchema.partial().required({
            title: true,
            content: true,
        });

        const validated = EmergencyDraftSchema.parse(draftData);

        if (!validated.title || !validated.content) {
            console.error('Emergency save: données incomplètes');
            return new Response(null, { status: 204 });
        }

        // Sauvegarde d'urgence via Beacon API
        await saveDraftAction({
            ...validated,
            id: validated.id || `emergency_${Date.now()}`,
            status: 'draft'
        } as any);
        
        // Beacon API ne s'attend pas à une réponse, mais on renvoie OK.
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('Emergency save failed:', error);
        // Ne pas retourner d'erreur car Beacon ne lit pas les réponses
        return new Response(null, { status: 204 });
    }
}

