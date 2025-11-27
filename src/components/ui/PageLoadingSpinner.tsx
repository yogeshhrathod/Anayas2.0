import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PageLoadingSpinner
 *
 * Loading fallback component for Suspense boundaries when lazy-loading pages.
 * Provides accessible loading state with spinner animation.
 */
export function PageLoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center min-h-[400px]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
