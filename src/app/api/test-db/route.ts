import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data-admin';

// Mark as dynamic to prevent static generation during build
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('🧪 Test endpoint called');

        const db = await getDb();
        console.log('✅ Database connection obtained');

        const snapshot = await db.collection('projects').limit(1).get();
        console.log('✅ Query executed, docs count:', snapshot.size);

        if (snapshot.empty) {
            return NextResponse.json({
                status: 'ok',
                message: 'Database connected but no projects found',
                projectsCount: 0,
            });
        }

        const firstDoc = snapshot.docs[0];
        const data = firstDoc.data();

        return NextResponse.json({
            status: 'ok',
            message: 'Database connected successfully',
            projectsCount: snapshot.size,
            sampleProject: {
                id: firstDoc.id,
                hasCreatedAt: !!data.createdAt,
                hasUpdatedAt: !!data.updatedAt,
                fields: Object.keys(data),
            },
        });
    } catch (error: any) {
        console.error('❌ Test endpoint error:', error);
        return NextResponse.json({
            status: 'error',
            error: error.message,
            code: error.code,
        }, { status: 500 });
    }
}
