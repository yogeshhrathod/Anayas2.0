import { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { GlobalSearch } from './GlobalSearch';
import { Logo } from './Logo';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  useEffect(() => {
    checkMaximized();
  }, []);

  const checkMaximized = async () => {
    const maximized = await window.electronAPI.window.isMaximized();
    setIsMaximized(maximized);
  };

  const handleMinimize = () => {
    window.electronAPI.window.minimize();
  };

  const handleMaximize = async () => {
    await window.electronAPI.window.maximize();
    checkMaximized();
  };

  const handleClose = () => {
    window.electronAPI.window.close();
  };

  return (
    <div
      className={cn(
        'flex h-10 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md glass select-none',
        isMac ? 'pl-20 pr-4' : 'px-4'
      )}
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left Side - App Branding (macOS) or Window Controls (Windows/Linux) */}
      <div
        className="flex items-center gap-3"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <Logo size={20} showText={true} className="text-sm" />
      </div>

      {/* Center - Empty (drag region) */}
      <div className="flex-1" />

      {/* Right Side - Search */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <GlobalSearch />
      </div>

      {/* Window Controls - Only show on Windows/Linux */}
      {!isMac && (
        <div
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <button
            onClick={handleMinimize}
            className="h-10 w-10 flex items-center justify-center hover:bg-accent transition-all duration-200 focus-ring rounded-sm"
            aria-label="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="h-10 w-10 flex items-center justify-center hover:bg-accent transition-all duration-200 focus-ring rounded-sm"
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Square className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="h-10 w-10 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 focus-ring rounded-sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
