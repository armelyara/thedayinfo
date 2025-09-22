// src/app/api/articles/[slug]/comments/route.ts
import { NextResponse } from 'next/server';
import { updateArticleComments } from '@/lib/data';
import type { Comment } from '@/lib/data';

type RouteParams = {
  params: { slug: string }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { comments }: { comments: Comment[] } = body;

    if (!comments || !Array.isArray(comments)) {
      return NextResponse.json(
        { error: 'Comments array is required' },
        { status: 400 }
      );
    }

    const success = await updateArticleComments(params.slug, comments);

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Comment added successfully' 
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to update comments' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}