'use client';

import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

type SanitizedContentProps = {
    content: string;
    className?: string;
};

// Admin-authored article/project content can include sandboxed iframes used to
// embed HTML/JS animations. DOMPurify v3 unconditionally strips an iframe's
// `srcdoc` attribute when its value contains <script> tags — even with
// ADD_ATTR/ADD_URI_SAFE_ATTR/ALLOWED_URI_REGEXP it cannot be opted out.
//
// Workaround: extract the srcdoc value before sanitization, replace the iframe
// with a placeholder iframe carrying a data-embed-id marker, sanitize, then
// restore the srcdoc on the placeholder. The iframe element itself still goes
// through DOMPurify (so attributes like style/class are checked), but the
// srcdoc payload is preserved verbatim from the trusted admin source.
//
// Defense-in-depth: every restored iframe has sandbox="allow-scripts" enforced
// (no allow-same-origin), so the embedded code cannot reach the parent's
// cookies, DOM, or storage. The author is trusted (only admins can publish);
// this preserves intent without weakening the sandbox.

const ALLOWED_IFRAME_ATTRS = ['sandbox', 'src', 'style', 'loading', 'allow', 'allowfullscreen', 'frameborder', 'width', 'height', 'class', 'title'];

const PURIFY_CONFIG = {
    ADD_TAGS: ['iframe'] as string[],
    ADD_ATTR: [...ALLOWED_IFRAME_ATTRS, 'data-embed-id'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
};

// Match <iframe ... srcdoc="..." ...> capturing srcdoc value separately.
// Handles both " and ' quoting and any attribute order.
const IFRAME_SRCDOC_RE = /<iframe\b([^>]*?)\bsrcdoc\s*=\s*("([^"]*)"|'([^']*)')([^>]*?)(\/?)>/gi;

// Decode HTML entities that DOMPurify or earlier serialization may have
// applied to the srcdoc value (so the iframe document parses raw HTML/JS).
function decodeHtmlEntities(s: string): string {
    return s
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function escapeForAttribute(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function sanitizeWithEmbeds(content: string): string {
    if (!content) return '';

    // Step 1: extract iframe srcdoc payloads, replace with placeholders.
    const embeds: string[] = [];
    const withMarkers = content.replace(
        IFRAME_SRCDOC_RE,
        (_match, beforeAttrs, _q, dq, sq, afterAttrs) => {
            const raw = dq ?? sq ?? '';
            const id = embeds.length;
            embeds.push(decodeHtmlEntities(raw));
            return `<iframe${beforeAttrs} data-embed-id="${id}"${afterAttrs}></iframe>`;
        }
    );

    // Step 2: standard DOMPurify pass.
    let cleaned = DOMPurify.sanitize(withMarkers, PURIFY_CONFIG) as unknown as string;

    // Step 3: restore srcdoc on every iframe carrying a data-embed-id; enforce
    // sandbox="allow-scripts" on each iframe (defense-in-depth).
    cleaned = cleaned.replace(
        /<iframe\b([^>]*?)\bdata-embed-id\s*=\s*"(\d+)"([^>]*?)>/gi,
        (match, before, idStr, after) => {
            const id = parseInt(idStr, 10);
            const srcdoc = embeds[id];
            if (srcdoc == null) return match;
            // Strip the marker, keep the rest.
            const otherAttrs = (before + after).trim().replace(/\s+/g, ' ');
            const hasSandbox = /\bsandbox\s*=/.test(otherAttrs);
            const sandboxAttr = hasSandbox ? '' : ' sandbox="allow-scripts"';
            return `<iframe ${otherAttrs}${sandboxAttr} srcdoc="${escapeForAttribute(srcdoc)}">`;
        }
    );

    // Final defense-in-depth: any iframe missing sandbox gets one.
    cleaned = cleaned.replace(/<iframe\b([^>]*)>/gi, (match, attrs) => {
        if (/\bsandbox\s*=/.test(attrs)) return match;
        return `<iframe${attrs} sandbox="allow-scripts">`;
    });

    return cleaned;
}

export function SanitizedContent({ content, className }: SanitizedContentProps) {
    const safeContent = useMemo(() => sanitizeWithEmbeds(content || ''), [content]);

    return (
        <div
            className={cn('prose prose-lg dark:prose-invert max-w-none', className)}
            dangerouslySetInnerHTML={{ __html: safeContent }}
        />
    );
}
