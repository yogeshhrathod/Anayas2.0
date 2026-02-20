import React, { useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface VerticalResizeHandleProps {
  onResize: (deltaY: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  className?: string;
  disabled?: boolean;
}

export function VerticalResizeHandle({
  onResize,
  onResizeStart,
  onResizeEnd,
  className,
  disabled = false,
}: VerticalResizeHandleProps) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const onResizeRef = useRef(onResize);

  // Keep the ref updated
  onResizeRef.current = onResize;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();
      isDragging.current = true;
      startY.current = e.clientY;

      // Call resize start callback
      onResizeStart?.();

      // Add global event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Change cursor globally
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [disabled, onResizeStart]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    e.preventDefault();
    const deltaY = e.clientY - startY.current;
    // Use deltaY directly - dragging down (positive) increases, dragging up (negative) decreases
    onResizeRef.current(deltaY);
    startY.current = e.clientY;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;

    // Call resize end callback
    onResizeEnd?.();

    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Reset cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove, onResizeEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className={cn(
        'h-2 w-full bg-transparent hover:bg-primary/30 transition-colors cursor-row-resize group z-50 relative',
        disabled && 'cursor-default hover:bg-transparent',
        className
      )}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Visual indicator with dots */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <div className="w-1 h-1 rounded-full bg-primary/40" />
        </div>
      </div>

      {/* Border line on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-border opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-border opacity-50 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
