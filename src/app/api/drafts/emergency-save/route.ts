import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveDraftAction } from '@/lib/data-admin';
import { DraftSchema } from '@/lib/validation-schemas';

export const dynamic = 'force-dynamic';

// Schéma de validation (basé sur l'erreur reçue)
const draftSchema = z.object({
    title: z.string(),
    content: z.string(),
    author: z.string().optional(),
    category: z.string().optional(),
    image: z.object({
        src: z.string(),
        alt: z.string(),
        aiHint: z.string().optional()
    }).optional(),
    scheduledFor: z.string().nullable().optional(),
    // On ajoute id optionnel pour éviter l'erreur, ou on le gère plus bas
    id: z.string().optional()
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation des données
        const validated = draftSchema.parse(body);

        // Sauvegarde via Server Action
        const result = await saveDraftAction({
            ...validated,
            // CORRECTION ICI : On force le type pour éviter l'erreur TS "Property 'id' does not exist"
            id: validated.id || `emergency_${Date.now()}`,
            status: 'draft'
        } as any);

        return NextResponse.json({ success: true, id: result.id });
    } catch (error) {
        console.error('Emergency save error:', error);
        return NextResponse.json(
            { error: 'Failed to save draft' },
            { status: 500 }
        );
    }
}