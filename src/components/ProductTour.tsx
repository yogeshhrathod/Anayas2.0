import { ArrowRight, ChevronLeft, Command, Folder, Import, Layers, Rocket, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { cn } from '../lib/utils';

// Step indicator component
const StepIndicator = ({ current, total }: { current: number; total: number }) => {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === current 
              ? "w-6 bg-primary" 
              : i < current 
                ? "w-1.5 bg-primary/50" 
                : "w-1.5 bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
};

// Custom Tooltip Component with a cleaner, modern design
const CustomTooltip = ({
  continuous: _continuous,
  index,
  step,
  size,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) => {
  return (
    <div
      {...tooltipProps}
      className={cn(
        "relative bg-popover text-popover-foreground rounded-2xl shadow-xl",
        "border border-border/50 backdrop-blur-xl",
        "w-[340px] overflow-hidden",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
    >
      {/* Subtle corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
      
      {/* Close button */}
      <button
        {...closeProps}
        className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors z-10"
        aria-label="Skip tour"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="p-6 pb-4">
        {/* Icon and Title */}
        {step.title && (
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {(step as any).icon || <Rocket className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-base font-semibold text-foreground leading-tight">
                {step.title}
              </h3>
            </div>
          </div>
        )}
        
        {/* Description */}
        <div className="text-sm text-muted-foreground leading-relaxed pl-[52px]">
          {step.content}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-border/30 bg-muted/20">
        {/* Step indicator */}
        <StepIndicator current={index} total={size} />

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <button
            {...primaryProps}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "shadow-sm hover:shadow-md"
            )}
          >
            {isLastStep ? "Get Started" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export function ProductTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('anayas_intro_seen');
    if (hasSeenTour === 'true') {
      return;
    }

    // Delay to ensure UI is ready after splash screen
    const timer = setTimeout(() => {
      setRun(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any) || action === 'close' || action === 'skip') {
      setRun(false);
      localStorage.setItem('anayas_intro_seen', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      title: "Welcome to Anayas",
      content: (
        <div className="space-y-2">
          <p>Your professional workspace for API development and testing.</p>
          <p className="text-foreground/70">
            Let's take a quick tour to help you get started.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
      data: {
        icon: <Rocket className="w-5 h-5 text-primary" />,
      },
    },
    {
      target: '[data-testid="primary-navigation"]',
      title: "Navigation",
      content: (
        <p>
          Switch between <span className="text-foreground font-medium">Home</span>, <span className="text-foreground font-medium">Collections</span>, and <span className="text-foreground font-medium">Environments</span> from here.
        </p>
      ),
      placement: 'bottom',
      data: {
        icon: <Command className="w-5 h-5 text-primary" />,
      },
    },
    {
      target: '[data-testid="nav-new-request-btn"]',
      title: "Create Requests",
      content: (
        <p>
          Click here to create a new API request. Supports all HTTP methods with a powerful request builder.
        </p>
      ),
      data: {
        icon: <Rocket className="w-5 h-5 text-primary" />,
      },
    },
    {
      target: '[data-testid="nav-import-btn"]',
      title: "Import Your Work",
      content: (
        <p>
          Migrate from Postman or paste cURL commands. Your existing workflows transfer in seconds.
        </p>
      ),
      data: {
        icon: <Import className="w-5 h-5 text-primary" />,
      },
    },
    {
      target: '[data-testid="app-sidebar"]',
      title: "Your Workspace",
      content: (
        <p>
          Access your collections, history, and saved requests. Everything organized in one place.
        </p>
      ),
      placement: 'right',
      data: {
        icon: <Folder className="w-5 h-5 text-primary" />,
      },
    },
    {
      target: '[data-testid="nav-environments"]',
      title: "Environment Variables",
      content: (
        <p>
          Manage variables for different environments. Switch between dev, staging, and production effortlessly.
        </p>
      ),
      data: {
        icon: <Layers className="w-5 h-5 text-primary" />,
      },
    },
  ];

  // Map step data to include icons in the tooltip
  const stepsWithIcons = steps.map(step => ({
    ...step,
    icon: (step as any).data?.icon,
  }));

  return (
    <Joyride
      steps={stepsWithIcons}
      run={run}
      continuous
      showSkipButton
      showProgress
      tooltipComponent={CustomTooltip}
      disableScrolling={false}
      spotlightClicks={false}
      floaterProps={{
        hideArrow: true,
        offset: 16,
      }}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.75)',
        },
        spotlight: {
          borderRadius: 12,
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
}
