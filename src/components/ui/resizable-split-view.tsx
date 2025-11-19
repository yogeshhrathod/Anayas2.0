/**
 * ResizableSplitView - Reusable side-by-side resizable panel component
 * 
 * Provides a horizontal split view with draggable divider for adjusting panel sizes.
 * Uses CSS Grid for efficient layout and native mouse events for drag handling.
 * 
 * Performance: ~2KB, CSS Grid-based, efficient drag handling
 * 
 * @example
 * ```tsx
 * <ResizableSplitView
 *   left={<HeadersPanel />}
 *   right={<BodyPanel />}
 *   initialRatio={50}
 *   onRatioChange={(ratio) => setSplitRatio(ratio)}
 *   minRatio={20}
 *   maxRatio={80}
 * />
 * ```
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

export interface ResizableSplitViewProps {
  left: React.ReactNode;           // Left panel content
  right: React.ReactNode;          // Right panel content
  initialRatio?: number;           // Initial split ratio (0-100, default 50)
  onRatioChange?: (ratio: number) => void; // Callback when ratio changes
  minRatio?: number;               // Min left panel % (default 20)
  maxRatio?: number;               // Max left panel % (default 80)
  className?: string;              // Optional container class
}

export function ResizableSplitView({
  left,
  right,
  initialRatio = 50,
  onRatioChange,
  minRatio = 20,
  maxRatio = 80,
  className,
}: ResizableSplitViewProps) {
  const [ratio, setRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startRatioRef = useRef<number>(initialRatio);

  // Calculate new ratio from mouse position
  const calculateRatio = useCallback((clientX: number): number => {
    if (!containerRef.current) return ratio;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const relativeX = clientX - containerRect.left;
    const newRatio = (relativeX / containerWidth) * 100;
    
    // Clamp ratio to min/max bounds
    return Math.max(minRatio, Math.min(maxRatio, newRatio));
  }, [minRatio, maxRatio, ratio]);

  // Handle mouse down on divider - start drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startRatioRef.current = ratio;
    
    // Add cursor style to body for smooth drag
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [ratio]);

  // Handle mouse move - update ratio during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newRatio = calculateRatio(e.clientX);
    setRatio(newRatio);
    
    // Notify parent of ratio change
    if (onRatioChange) {
      onRatioChange(newRatio);
    }
  }, [isDragging, calculateRatio, onRatioChange]);

  // Handle mouse up - end drag
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Remove cursor style from body
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isDragging]);

  // Attach/detach mouse event listeners during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount - ensure cursor is reset
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full w-full overflow-hidden', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: `${ratio}fr 4px ${100 - ratio}fr`,
      }}
    >
      {/* Left Panel */}
      <div className="overflow-auto">
        {left}
      </div>

      {/* Divider */}
      <div
        className={cn(
          'bg-border hover:bg-primary/50 transition-colors cursor-col-resize relative group',
          isDragging && 'bg-primary'
        )}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-label="Resize panels"
        aria-valuenow={Math.round(ratio)}
        aria-valuemin={minRatio}
        aria-valuemax={maxRatio}
      >
        {/* Visual indicator on hover */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-primary/0 group-hover:bg-primary/70 transition-colors" />
      </div>

      {/* Right Panel */}
      <div className="overflow-auto">
        {right}
      </div>
    </div>
  );
}


