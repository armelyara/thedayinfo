'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

const MIN_WIDTH = 60;

export function ResizableImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const { src, alt, title, width } = node.attrs as {
    src: string;
    alt?: string | null;
    title?: string | null;
    width?: number | null;
  };

  const wrapperRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback(
    (e: React.MouseEvent, edge: 'right' | 'left') => {
      e.preventDefault();
      e.stopPropagation();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const editorEl = editor?.view?.dom as HTMLElement | undefined;
      const maxWidth = editorEl ? editorEl.getBoundingClientRect().width : Infinity;

      const startX = e.clientX;
      const startWidth = wrapper.getBoundingClientRect().width;

      const onMove = (ev: MouseEvent) => {
        const delta = edge === 'right' ? ev.clientX - startX : startX - ev.clientX;
        const next = Math.max(MIN_WIDTH, Math.min(startWidth + delta, maxWidth));
        updateAttributes({ width: Math.round(next) });
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [editor, updateAttributes]
  );

  const setPercent = (pct: number) => {
    const editorEl = editor?.view?.dom as HTMLElement | undefined;
    if (!editorEl) return;
    const containerWidth = editorEl.getBoundingClientRect().width;
    updateAttributes({ width: Math.round((containerWidth * pct) / 100) });
  };

  const reset = () => updateAttributes({ width: null });

  const widthPx = width ? `${width}px` : undefined;

  return (
    <NodeViewWrapper
      as="div"
      className="resizable-image-wrapper"
      data-drag-handle
      style={{ margin: '1rem 0', display: 'flex', justifyContent: 'flex-start' }}
    >
      <div
        ref={wrapperRef}
        className={cn(
          'relative inline-block max-w-full',
          selected && 'ring-2 ring-primary ring-offset-2 rounded'
        )}
        style={{ width: widthPx, lineHeight: 0 }}
      >
        <img
          src={src}
          alt={alt || ''}
          title={title || undefined}
          draggable={false}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
            borderRadius: 8,
            userSelect: 'none',
          }}
        />

        {selected && (
          <>
            <div
              role="presentation"
              onMouseDown={(e) => startResize(e, 'left')}
              style={{
                position: 'absolute',
                left: -6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 12,
                height: 32,
                background: 'hsl(var(--primary))',
                border: '2px solid white',
                borderRadius: 3,
                cursor: 'ew-resize',
                zIndex: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
            <div
              role="presentation"
              onMouseDown={(e) => startResize(e, 'right')}
              style={{
                position: 'absolute',
                right: -6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 12,
                height: 32,
                background: 'hsl(var(--primary))',
                border: '2px solid white',
                borderRadius: 3,
                cursor: 'ew-resize',
                zIndex: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: -28,
                left: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 6,
                padding: '2px 4px',
                fontSize: 11,
                lineHeight: 1,
                fontFamily: 'system-ui, sans-serif',
                whiteSpace: 'nowrap',
                zIndex: 3,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'ui-monospace, monospace', padding: '0 4px' }}>
                {width ? `${width}px` : 'auto'}
              </span>
              <button
                type="button"
                onClick={() => setPercent(25)}
                style={presetBtn}
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => setPercent(50)}
                style={presetBtn}
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setPercent(75)}
                style={presetBtn}
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setPercent(100)}
                style={presetBtn}
              >
                100%
              </button>
              <button
                type="button"
                onClick={reset}
                style={{ ...presetBtn, color: 'hsl(var(--destructive))' }}
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

const presetBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: 3,
  fontSize: 11,
  color: 'hsl(var(--foreground))',
};
