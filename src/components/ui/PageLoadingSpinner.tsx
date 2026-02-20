import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * PageLoadingSpinner
 *
 * Premium loading fallback component for Suspense boundaries.
 */
export function PageLoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-full w-full min-h-[400px]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <motion.div
          className="absolute h-16 w-16 rounded-full border border-primary/20 bg-primary/5"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Inner spinning loader */}
        <motion.div
          className="h-10 w-10 rounded-full border-2 border-transparent border-t-primary border-r-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />

        {/* Center dot */}
        <div className="absolute h-2 w-2 rounded-full bg-primary" />
      </div>
      <motion.p
        className="mt-6 text-sm font-medium tracking-widest text-muted-foreground uppercase"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        Loading
      </motion.p>
    </div>
  );
}
