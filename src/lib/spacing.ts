/**
 * Spacing Constants - Design System Alignment
 * 
 * This file defines standardized spacing values aligned with the design system
 * in `ai-context/ui-design-system.md` §3.3 (Typography & Density).
 * 
 * Guidelines:
 * - Compact controls: 28px height, px-2–px-3, py-1–py-1.5
 * - Default controls: 32px height
 * - Row height: 24–28px
 * - Minimal vertical whitespace: space-y-0.5 at most
 * - Container padding: p-2 or p-3 (not p-4)
 * - Gaps: gap-1 or gap-2 (not gap-4)
 */

export const SPACING = {
  // Container Padding
  container: {
    tight: 'p-2',      // 8px - for compact containers
    default: 'p-3',    // 12px - for standard containers
    loose: 'p-4',     // 16px - avoid unless necessary
  },
  
  // Horizontal Padding
  px: {
    tight: 'px-2',     // 8px
    default: 'px-3',   // 12px
    loose: 'px-4',    // 16px - avoid unless necessary
  },
  
  // Vertical Padding
  py: {
    tight: 'py-1',     // 4px
    default: 'py-1.5', // 6px
    loose: 'py-2',    // 8px
  },
  
  // Gaps (for flex/grid)
  gap: {
    tight: 'gap-1',    // 4px
    default: 'gap-2',  // 8px
    loose: 'gap-3',   // 12px - use sparingly
  },
  
  // Vertical Spacing (for space-y)
  spaceY: {
    minimal: 'space-y-0.5', // 2px - for lists/tables
    tight: 'space-y-1',    // 4px
    default: 'space-y-2',  // 8px - use sparingly
    loose: 'space-y-3',    // 12px - avoid
  },
  
  // Margins
  margin: {
    tight: 'm-1',      // 4px
    default: 'm-2',    // 8px
    loose: 'm-3',     // 12px
  },
} as const;

/**
 * Helper function to get spacing class
 */
export function getSpacing(type: keyof typeof SPACING, variant: 'tight' | 'default' | 'loose' = 'default'): string {
  return SPACING[type][variant];
}

