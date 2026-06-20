'use client';

import { useEffect, useRef, useState } from 'react';

interface HtmlArticleFrameProps {
  content: string;
  title: string;
}

/**
 * Renders a self-contained HTML article (with custom CSS/JS/animations) inside
 * a sandboxed iframe that auto-resizes to the content's full height.
 *
 * This preserves every custom style, animation and script exactly as authored,
 * completely isolated from the parent page's CSS (Tailwind/prose).
 */
export function HtmlArticleFrame({ content, title }: HtmlArticleFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resize = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc?.body) {
          const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
          if (h > 0) setHeight(h);
        }
      } catch {
        // Cross-origin: fall back to a fixed generous height
      }
    };

    iframe.addEventListener('load', resize);

    // Also listen for resize messages from the iframe content
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'html-article-height' && typeof e.data.height === 'number') {
        setHeight(e.data.height);
      }
    };
    window.addEventListener('message', onMessage);

    return () => {
      iframe.removeEventListener('load', resize);
      window.removeEventListener('message', onMessage);
    };
  }, [content]);

  // Inject a small script into the content that posts its height to the parent
  // so the iframe can auto-resize even when the srcdoc content has animations
  // that alter the document height after load.
  const contentWithResizer = content.replace(
    /<\/body>/i,
    `<script>
      function __sendHeight() {
        var h = document.documentElement.scrollHeight || document.body.scrollHeight;
        window.parent.postMessage({ type: 'html-article-height', height: h }, '*');
      }
      window.addEventListener('load', __sendHeight);
      window.addEventListener('resize', __sendHeight);
      // Also poll briefly after load in case animations change the layout
      setTimeout(__sendHeight, 500);
      setTimeout(__sendHeight, 1500);
    </script></body>`
  );

  // If the content doesn't have a </body> tag, append the resizer at the end
  const finalContent = contentWithResizer.includes('</body>')
    ? contentWithResizer
    : content + `<script>
        function __sendHeight() {
          var h = document.documentElement.scrollHeight || document.body.scrollHeight;
          window.parent.postMessage({ type: 'html-article-height', height: h }, '*');
        }
        window.addEventListener('load', __sendHeight);
        setTimeout(__sendHeight, 500);
        setTimeout(__sendHeight, 1500);
      </script>`;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={finalContent}
      title={title}
      // allow-scripts: needed for animations/interactivity
      // allow-same-origin is intentionally excluded for security
      sandbox="allow-scripts"
      className="w-full border-0"
      style={{ height: `${height}px`, display: 'block' }}
      scrolling="no"
    />
  );
}
