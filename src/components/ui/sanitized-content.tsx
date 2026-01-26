'use client';

import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

type SanitizedContentProps = {
    content: string;
    className?: string;
};

export function SanitizedContent({ content, className }: SanitizedContentProps) {
    const [sanitized, setSanitized] = useState('');

    useEffect(() => {
        // Only run on client to ensure hydration matches (though isomorphic-dompurify works on server too,
        // handling it in effect ensures consistency if there are environment diffs)
        // However, for SEO, server-side sanitization is better.
        // Let's use direct purification which works isomorphically.
        setSanitized(DOMPurify.sanitize(content));
    }, [content]);

    // Server-side fallback (or initial render) - run sanitize immediately for SSR
    // isomorphic-dompurify uses jsdom on server, so it should be fine.
    const safeContent = DOMPurify.sanitize(content);

    return (
        <div
            className={cn('prose prose-lg dark:prose-invert max-w-none', className)}
            dangerouslySetInnerHTML={{ __html: safeContent }}
        />
    );
}
