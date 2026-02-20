import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { Logo } from './Logo';

interface SplashScreenProps {
  onFinish?: () => void;
  isLoading?: boolean;
}

export function SplashScreen({ onFinish, isLoading = true }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [progress, setProgress] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const { appVersion } = useStore();

  useEffect(() => {
    const contentTimeout = setTimeout(() => setShowContent(true), 100);
    
    // Minimum display time of 1.5 seconds to ensure splash is visible
    const minTimeTimeout = setTimeout(() => setMinTimeElapsed(true), 1500);

    // Simulate progress if isLoading is true
    let progressInterval: NodeJS.Timeout;
    if (isLoading) {
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // Hold at 90% until isLoading is false
          return prev + Math.random() * 10;
        });
      }, 200);
    } else {
      setProgress(100);
    }

    return () => {
      clearTimeout(contentTimeout);
      clearTimeout(minTimeTimeout);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading]);

  useEffect(() => {
    // Only transition out when BOTH loading is complete AND minimum time has elapsed
    if (!isLoading && progress >= 100 && minTimeElapsed) {
      // Transition out after a small delay to ensure 100% is seen
      const timeout = setTimeout(() => {
        setIsVisible(false);
        // Fire onFinish after the fade-out animation completes
        setTimeout(() => {
          if (onFinish) onFinish();
        }, 500);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, progress, minTimeElapsed, onFinish]);

  if (!isVisible && !isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-700 ease-in-out drag-region",
        "bg-background text-foreground",
        !isVisible && "opacity-0 scale-105 pointer-events-none"
      )}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none no-drag-region">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div
        className={cn(
          "relative flex flex-col items-center transition-all duration-1000 transform",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        {/* Logo Section */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500 animate-pulse-glow" />
          <div className="relative bg-foreground/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/50 shadow-2xl">
            <Logo size={80} showText={false} />
          </div>
        </div>

        {/* Text Section */}
        <div className="mt-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            Luna
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
          <div className="h-[3px] w-full bg-muted rounded-full overflow-hidden border border-border/50">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 text-muted-foreground/30 text-xs font-light tracking-widest uppercase">
        Version {appVersion}
      </div>
    </div>
  );
}
