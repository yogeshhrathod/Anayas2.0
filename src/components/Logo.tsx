import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * Logo component that adapts to dark and light themes
 * Uses CSS filters to ensure visibility in both themes
 */
export function Logo({ className, size = 24, showText = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src="logo.png"
        alt="Luna Logo"
        className={cn(
          'object-contain flex-shrink-0',
          // Apply slight adjustments for better visibility in different themes
          // The logo should work well in both themes, but we can fine-tune if needed
          'dark:opacity-95',
          'light:opacity-100'
        )}
        style={{ width: `${size}px`, height: `${size}px` }}
        draggable={false}
      />
      {showText && (
        <span className="text-sm font-semibold whitespace-nowrap">
          Luna<span className="text-[#F97316]">_</span>
        </span>
      )}
    </div>
  );
}
