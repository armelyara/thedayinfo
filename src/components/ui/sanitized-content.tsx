'use client';

import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

type SanitizedContentProps = {
    content: string;
    className?: string;
};

// Admin-authored article/project content can include sandboxed iframes used to embed
// HTML/JS animations. We allow <iframe> with strict attribute whitelist; the sandbox
// attribute on each iframe (set by the editor) keeps script execution isolated.
const ALLOWED_IFRAME_ATTRS = ['srcdoc', 'sandbox', 'src', 'style', 'loading', 'allow', 'allowfullscreen', 'frameborder', 'width', 'height', 'class', 'title'];

const PURIFY_CONFIG = {
    ADD_TAGS: ['iframe'] as string[],
    ADD_ATTR: ALLOWED_IFRAME_ATTRS,
    ALLOW_UNKNOWN_PROTOCOLS: false,
};

export function SanitizedContent({ content, className }: SanitizedContentProps) {
    const safeContent = useMemo(() => {
        if (!content) return '';
        const cleaned = DOMPurify.sanitize(content, PURIFY_CONFIG) as unknown as string;
        // Defense-in-depth: ensure every iframe carries the sandbox attribute.
        // DOMPurify allows the attr but does not enforce its presence.
        return cleaned.replace(/<iframe\b([^>]*)>/gi, (match, attrs) => {
            if (/\bsandbox\s*=/.test(attrs)) return match;
            return `<iframe${attrs} sandbox="allow-scripts">`;
        });
    }, [content]);

    return (
        <div
            className={cn('prose prose-lg dark:prose-invert max-w-none', className)}
            dangerouslySetInnerHTML={{ __html: safeContent }}
        />
    );
}
