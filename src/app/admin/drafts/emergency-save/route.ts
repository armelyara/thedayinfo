import { NextRequest, NextResponse } from 'next/server';
import { saveDraft } from '@/lib/data-admin';

export async function POST(request: NextRequest) {
    try {
        const draftData = await request.json();
        
        // Sauvegarde d'urgence (beacon)
        await saveDraft({
            ...draftData,
            autoSaveId: draftData.autoSaveId || `emergency_${Date.now()}`
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Emergency save failed:', error);
        return NextResponse.json(
            { error: 'Emergency save failed' },
            { status: 500 }
        );
    }
}