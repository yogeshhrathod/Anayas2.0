import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import logger from '../lib/logger';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { Logo } from './Logo';

interface SplashScreenProps {
  onFinish?: () => void;
  isLoading?: boolean;
}

export function SplashScreen({
  onFinish,
  isLoading = true,
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const { appVersion } = useStore();

  useEffect(() => {
    // Minimum display time of 800ms (reduced from 1500ms) to ensure splash is visible but snappier
    const minTimeTimeout = setTimeout(() => setMinTimeElapsed(true), 800);

    // Simulate progress if isLoading is true
    let progressInterval: NodeJS.Timeout;
    if (isLoading) {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Hold at 90% until isLoading is false
          return prev + Math.random() * 10;
        });
      }, 200);
    } else {
      setProgress(100);
    }

    return () => {
      clearTimeout(minTimeTimeout);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading]);

  useEffect(() => {
    // Safety timeout: If for some reason we're stuck in splash more than 5 seconds, clear it
    const safetyTimeout = setTimeout(() => {
      if (isVisible) {
        logger.warn('[SplashScreen] Safety timeout reached, forcing finish');
        setIsVisible(false);
        if (onFinish) onFinish();
      }
    }, 5000);

    // Only transition out when BOTH loading is complete AND minimum time has elapsed
    if (!isLoading && progress >= 100 && minTimeElapsed) {
      // Transition out after a small delay to ensure 100% is seen
      const timeout = setTimeout(() => {
        setIsVisible(false);
        // Fire onFinish after the fade-out animation completes
        setTimeout(() => {
          if (onFinish) onFinish();
        }, 800); // Wait for framer motion exit animation
      }, 400);
      return () => {
        clearTimeout(timeout);
        clearTimeout(safetyTimeout);
      };
    }

    return () => clearTimeout(safetyTimeout);
  }, [isLoading, progress, minTimeElapsed, onFinish, isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className={cn(
            'fixed inset-0 z-[9999] flex flex-col items-center justify-center drag-region',
            'bg-background text-foreground'
          )}
        >
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none no-drag-region">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2, ease: 'easeOut', delay: 0.2 }}
              className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="relative flex flex-col items-center"
          >
            {/* Logo Section */}
            <div className="relative group">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500"
              />
              <div className="relative bg-foreground/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/50 shadow-2xl">
                <Logo size={80} showText={false} />
              </div>
            </div>

            {/* Text Section */}
            <div className="mt-12 text-center">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent transform translate-y-[-2px]">
                Luna<span className="text-[#F97316]">_</span>
              </h1>
              <p className="mt-3 text-muted-foreground font-medium tracking-widest uppercase text-[10px]">
                Professional API Workspace
              </p>
            </div>

            {/* Progress Section */}
            <div className="mt-16 w-64">
              <div className="flex justify-between mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                <span>{isLoading ? 'Loading Workspace...' : 'Ready'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-[3px] w-full bg-muted rounded-full overflow-hidden border border-border/50 relative">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Footer Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 text-muted-foreground/30 text-xs font-light tracking-widest uppercase"
          >
            Version {appVersion}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
