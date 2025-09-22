'use client';

import { useState } from 'react';
import { PublicCommentsSection } from '@/components/article/public-comments-section';
import type { Comment } from '@/lib/data';

interface ArticleClientWrapperProps {
  articleSlug: string;
  initialComments: Comment[];
}

export function ArticleClientWrapper({ 
  articleSlug, 
  initialComments 
}: ArticleClientWrapperProps) {
  const [comments, setComments] = useState(initialComments);

  return (
    <div className="mt-12 border-t pt-8">
      <PublicCommentsSection 
        articleSlug={articleSlug}
        comments={comments}
        onCommentsUpdate={setComments}
      />
    </div>
  );
}