import * as React from 'react';

export interface DraggableWindowProps {
  children?: React.ReactNode;
  open: boolean;
  onClose: () => void;
  title: string;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  children,
  open,
  onClose,
  title,
}) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const startPos = React.useRef({ x: 0, y: 0 });
  const initialOffset = React.useRef({ x: 0, y: 0 });
  const insetsRef = React.useRef({ top: 0, bottom: 0, left: 0, right: 0 });

  // Reset position and read safe area insets when opened
  React.useEffect(() => {
    if (open && containerRef.current) {
      // Read safe area insets via a temporary DOM element
      const div = document.createElement('div');
      div.style.paddingTop = 'env(safe-area-inset-top)';
      div.style.paddingBottom = 'env(safe-area-inset-bottom)';
      div.style.paddingLeft = 'env(safe-area-inset-left)';
      div.style.paddingRight = 'env(safe-area-inset-right)';
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      document.body.appendChild(div);
      const style = window.getComputedStyle(div);
      const insets = {
        top: parseInt(style.paddingTop, 10) || 0,
        bottom: parseInt(style.paddingBottom, 10) || 0,
        left: parseInt(style.paddingLeft, 10) || 0,
        right: parseInt(style.paddingRight, 10) || 0,
      };
      insetsRef.current = insets;
      document.body.removeChild(div);

      const rect = containerRef.current.getBoundingClientRect();
      const vw = window.visualViewport?.width || window.innerWidth;
      const vh = window.visualViewport?.height || window.innerHeight;
      
      // Default to bottom-right with 16px margin, respecting safe area
      const startX = Math.max(insets.left, vw - rect.width - 16 - insets.right);
      const startY = Math.max(insets.top, vh - rect.height - 16 - insets.bottom);
      
      setPosition({ x: startX, y: startY });
    }
  }, [open]);

  const onPointerDown = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only accept primary button (usually left click or touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    initialOffset.current = { ...position };

    e.currentTarget.setPointerCapture(e.pointerId);
  }, [position]);

  const onPointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    
    let newX = initialOffset.current.x + dx;
    let newY = initialOffset.current.y + dy;
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const vw = window.visualViewport?.width || window.innerWidth;
      const vh = window.visualViewport?.height || window.innerHeight;
      const insets = insetsRef.current;
      
      // Clamp within viewport + safe area
      newX = Math.max(insets.left, Math.min(newX, vw - rect.width - insets.right));
      newY = Math.max(insets.top, Math.min(newY, vh - rect.height - insets.bottom));
    }
    
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const onPointerUp = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, [isDragging]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: '180px',
        height: '200px',
        zIndex: 50,
        willChange: 'transform',
      }}
    >
      <style>{`
        @keyframes draggableWindowScaleFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--surface-elevated)',
          border: '2px solid var(--interactive-border)',
          borderRadius: '2px',
          imageRendering: 'pixelated',
          color: 'var(--surface-foreground)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          animation: 'draggableWindowScaleFadeIn 0.2s ease-out',
        }}
      >
        <div
          ref={dragRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            height: '24px',
            minHeight: '24px',
            backgroundColor: 'var(--surface-muted)',
            borderBottom: '2px solid var(--interactive-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <span className="typography-ui-label" style={{ fontWeight: 'bold' }}>
            {title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="typography-micro"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--surface-foreground)',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '2px',
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--interactive-hover)';
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
