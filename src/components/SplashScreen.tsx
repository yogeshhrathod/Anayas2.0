import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import logger from '../lib/logger';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { BikeLogoAnimation } from './BikeLogoAnimation';

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
  const appVersion = useStore(state => state.appVersion);
  // Store callbacks in refs to avoid stale closures and unnecessary effect deps
  const onFinishRef = useRef(onFinish);
  const isVisibleRef = useRef(true);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  // Track isVisible in a ref for the safety timeout (avoids stale closure)
  useEffect(() => { isVisibleRef.current = isVisible; }, [isVisible]);

  useEffect(() => {
    // Minimum display time of 800ms to ensure splash is visible but snappier
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
    // Safety timeout: force dismiss after 5s if still stuck
    const safetyTimeout = setTimeout(() => {
      if (isVisibleRef.current) {
        logger.warn('[SplashScreen] Safety timeout reached, forcing finish');
        setIsVisible(false);
        onFinishRef.current?.();
      }
    }, 5000);

    // Only transition out when BOTH loading is complete AND minimum time has elapsed
    if (!isLoading && progress >= 100 && minTimeElapsed) {
      // Transition out after a small delay to ensure 100% is seen
      const timeout = setTimeout(() => {
        setIsVisible(false);
        // Fire onFinish after the fade-out animation completes
        setTimeout(() => {
          onFinishRef.current?.();
        }, 800); // Wait for framer motion exit animation
      }, 400);
      return () => {
        clearTimeout(timeout);
        clearTimeout(safetyTimeout);
      };
    }

    return () => clearTimeout(safetyTimeout);
  }, [isLoading, progress, minTimeElapsed]);

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
            {/* Animated Logo Section */}
            <div className="relative mb-4 transform scale-[1.35]">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.6, 0.9, 0.6],
                  filter: ['blur(40px)', 'blur(60px)', 'blur(40px)']
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-primary/30 rounded-full"
              />
              <BikeLogoAnimation size={100} />
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
