import React, { useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface ResizeHandleProps {
  onResize: (deltaX: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ResizeHandle({ onResize, onResizeStart, onResizeEnd, className, disabled = false }: ResizeHandleProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const onResizeRef = useRef(onResize);
  const onResizeEndRef = useRef(onResizeEnd);
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>();
  const handleMouseUpRef = useRef<() => void>();

  // Keep the refs updated
  onResizeRef.current = onResize;
  onResizeEndRef.current = onResizeEnd;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    
    e.preventDefault();
    const deltaX = e.clientX - startX.current;
    // Use deltaX directly - dragging left (negative) shrinks, dragging right (positive) expands
    onResizeRef.current(deltaX);
    startX.current = e.clientX;
     
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    // Call resize end callback
    onResizeEndRef.current?.();
    
    // Remove global event listeners
    if (handleMouseMoveRef.current) {
      document.removeEventListener('mousemove', handleMouseMoveRef.current);
    }
    if (handleMouseUpRef.current) {
      document.removeEventListener('mouseup', handleMouseUpRef.current);
    }
    
    // Reset cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
     
  }, []);

  // Keep refs updated
  handleMouseMoveRef.current = handleMouseMove;
  handleMouseUpRef.current = handleMouseUp;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    startX.current = e.clientX;
    
    // Call resize start callback
    onResizeStart?.();
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Change cursor globally
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
     
  }, [disabled, onResizeStart, handleMouseMove, handleMouseUp]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className={cn(
        "w-1 bg-transparent hover:bg-primary/20 transition-colors cursor-col-resize group z-50",
        "relative",
        disabled && "cursor-default hover:bg-transparent",
        className
      )}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Subtle visual indicator - only visible on hover */}
      <div className="absolute inset-y-0 -left-0.5 -right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-full w-0.5 bg-primary/40 mx-auto" />
      </div>
    </div>
  );
}
