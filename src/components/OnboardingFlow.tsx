import confetti from 'canvas-confetti';
import { ArrowRight, Box, ChevronRight, Layers, Sparkles, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { Button } from './ui/button';

export default function OnboardingFlow({ onDismiss }: { onDismiss?: () => void }) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Trigger initial fade in
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleComplete = useCallback(() => {
    // Fire confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899']
    });

    setIsVisible(false); // Trigger fade out
    setTimeout(() => {
      localStorage.setItem('luna_welcome_seen', 'true');
      onDismiss?.();
    }, 500); // Wait for transition
  }, [onDismiss]);

  const handleNext = useCallback(() => {
    if (step < 2) {
      setStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [step, handleComplete]);

  const steps = useMemo(() => [
    // Step 1: Welcome
    {
      icon: <Logo size={120} />,
      title: "Welcome to Luna",
      description: "Your professional workspace for API development and testing is finally here.",
      content: (
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm w-32">
            <Zap className="w-8 h-8 text-amber-500" />
            <span className="text-sm font-medium">Fast</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm w-32">
            <Box className="w-8 h-8 text-blue-500" />
            <span className="text-sm font-medium">Modern</span>
          </div>
        </div>
      )
    },
    // Step 2: Features
    {
      icon: <Layers className="w-20 h-20 text-primary" />,
      title: "Built for You",
      description: "Everything you need to build, test, and document your APIs in one beautiful app.",
      content: (
        <div className="space-y-4 mt-6 max-w-sm mx-auto text-left">
          {[
            { text: "Powerful Request Builder", icon: Zap },
            { text: "Smart Environment Management", icon: Box },
            { text: "Instant Response Visualization", icon: Sparkles }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/40 border border-border/30">
              <div className="p-2 rounded-md bg-primary/10">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      )
    },
    // Step 3: Ready
    {
      icon: <Sparkles className="w-20 h-20 text-primary" />,
      title: "Let's Start Building",
      description: "You're all set. Experience a new way of working with APIs.",
      content: (
        <div className="mt-8">
          <Button 
            size="lg" 
            onClick={handleComplete}
            className="w-full text-lg h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-semibold"
          >
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="mt-4 text-xs text-muted-foreground/60">
            Press Enter to continue
          </p>
        </div>
      )
    }
  ], []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, handleNext]); // handleNext dependency added implicitly by useCallback if we wrap it, effectively 'step' drives it

  return (
    <div
      className={cn(
        "fixed inset-0 z-[10001] flex items-center justify-center overflow-hidden",
        "bg-background/95 backdrop-blur-3xl",
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute -top-[20%] -left-[10%] w-[70vh] h-[70vh] rounded-full",
          "bg-primary/20 blur-[100px] animate-in fade-in zoom-in duration-1000"
        )} />
        <div className={cn(
          "absolute top-[40%] -right-[10%] w-[60vh] h-[60vh] rounded-full",
          "bg-blue-500/20 blur-[100px] animate-in fade-in zoom-in duration-1000 delay-300"
        )} />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        {/* Content Container */}
        <div className="relative min-h-[500px] flex flex-col items-center justify-center text-center">
          
          {steps.map((s, i) => (
             <div
              key={i}
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center transition-[opacity,transform] duration-500 ease-in-out will-change-[opacity,transform]",
                step === i 
                  ? "opacity-100 translate-x-0 scale-100 pointer-events-auto" 
                  : step > i 
                    ? "opacity-0 -translate-x-20 scale-95 pointer-events-none" 
                    : "opacity-0 translate-x-20 scale-95 pointer-events-none"
              )}
            >
              {/* Icon */}
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <div className={cn(
                  "relative transform transition-all duration-700 ease-out",
                  // Zoom effect when moving to next step
                  step > i ? "scale-[3] opacity-0 blur-sm" : "scale-100 hover:scale-110"
                )}>
                  {s.icon}
                </div>
              </div>

              {/* Text */}
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                {s.title}
              </h1>
              <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
                {s.description}
              </p>

              {/* Custom Content */}
              {s.content}
            </div>
          ))}

        </div>

        {/* Navigation Footer */}
        <div className={cn(
          "absolute bottom-12 left-0 right-0 flex items-center justify-between px-12",
          "transition-opacity duration-500 delay-500",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
          {/* Progress Dots */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === step ? "w-8 bg-primary" : "w-2 bg-primary/20"
                )}
              />
            ))}
          </div>

          {/* Next Button (Hidden on last step) */}
          {step < steps.length - 1 && (
            <Button
              variant="ghost" 
              onClick={handleNext}
              className="group text-lg hover:bg-transparent hover:text-primary transition-colors pr-0"
            >
              Next <ChevronRight className="ml-1 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
