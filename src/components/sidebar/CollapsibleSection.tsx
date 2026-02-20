/**
 * CollapsibleSection - VS Code-style collapsible sidebar section
 *
 * A reusable component for creating collapsible sections in the sidebar.
 * Features:
 * - VS Code-style appearance with header and chevron icon
 * - Smooth expand/collapse animations
 * - Keyboard navigation support
 * - Accessibility (ARIA labels)
 * - Children only render when expanded (memory efficient)
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useRef } from 'react';
import { cn } from '../../lib/utils';

export interface CollapsibleSectionProps {
  /** Unique section identifier */
  id: string;

  /** Section title displayed in header */
  title: string;

  /** Is section expanded? */
  isExpanded: boolean;

  /** Toggle handler */
  onToggle: () => void;

  /** Section content (only rendered when expanded) */
  children: React.ReactNode;

  /** Additional CSS classes */
  className?: string;

  /** Icon to display in header (optional) */
  icon?: React.ComponentType<{ className?: string }>;

  /** Actions to display on the right side of header (optional) */
  headerActions?: React.ReactNode;

  /** Test ID for testing */
  testId?: string;
}

export function CollapsibleSection({
  id,
  title,
  isExpanded,
  onToggle,
  children,
  className,
  icon: Icon,
  headerActions,
  testId = `collapsible-section-${id}`,
}: CollapsibleSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col min-h-0',
        isExpanded ? 'flex-1' : 'flex-shrink-0',
        className
      )}
      data-testid={testId}
      data-section-id={id}
      data-expanded={isExpanded}
    >
      {/* Section Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
        aria-label={`${title} section`}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 mx-1 my-1 cursor-pointer select-none rounded-md',
          'hover:bg-accent/40 hover:shadow-sm transition-all duration-200 group/header',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'flex-shrink-0' // Header always maintains its size
        )}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
      >
        {/* Chevron Icon */}
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
          )}
        </div>

        {/* Optional Icon */}
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}

        {/* Title */}
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex-1 group-hover/header:text-foreground transition-colors duration-200">
          {title}
        </span>

        {/* Header Actions */}
        {headerActions && (
          <div
            className="flex items-center gap-1 flex-shrink-0"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            {headerActions}
          </div>
        )}
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div
          id={`${id}-content`}
          ref={contentRef}
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden min-h-0',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200'
          )}
          role="region"
          aria-labelledby={`${id}-header`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
