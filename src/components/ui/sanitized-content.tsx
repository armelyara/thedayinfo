'use client';

import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

type SanitizedContentProps = {
    content: string;
    className?: string;
};

export function SanitizedContent({ content, className }: SanitizedContentProps) {
    // Ensure content is a string to avoid crashes
    const safeContent = useMemo(() => DOMPurify.sanitize(content || ''), [content]);

    return (
        <div
            className={cn('prose prose-lg dark:prose-invert max-w-none', className)}
            dangerouslySetInnerHTML={{ __html: safeContent }}
        />
    );
}
