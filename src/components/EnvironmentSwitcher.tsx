import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export function EnvironmentSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { environments, currentEnvironment, setCurrentEnvironment } = useStore();

  const handleSelectEnvironment = async (env: any) => {
    try {
      await window.electronAPI.env.setCurrent(env.id);
      setCurrentEnvironment(env);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch environment:', error);
    }
  };

  const getStatusColor = (env: any) => {
    // Simple heuristic: if it has a base URL, show green
    if (env.variables?.base_url) {
      return 'bg-green-500';
    }
    return 'bg-yellow-500';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        <Globe className="h-4 w-4" />
        <span>{(currentEnvironment as any)?.display_name || currentEnvironment?.displayName || 'No Environment'}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md border bg-popover p-2 shadow-lg">
            <div className="mb-2 border-b pb-2">
              <div className="flex items-center gap-2 px-2 py-1 text-sm font-semibold">
                <Globe className="h-4 w-4" />
                <span>Select Environment</span>
              </div>
            </div>

            <div className="max-h-96 space-y-1 overflow-auto">
              {environments.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No environments configured
                </div>
              ) : (
                environments.map((env: any) => (
                  <button
                    key={env.id}
                    onClick={() => handleSelectEnvironment(env)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent',
                      currentEnvironment?.id === env.id && 'bg-accent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('h-2 w-2 rounded-full', getStatusColor(env))} />
                      <div className="text-left">
                        <div className="font-medium">{env.display_name}</div>
                        <div className="text-xs text-muted-foreground">{env.name}</div>
                      </div>
                    </div>
                    {currentEnvironment?.id === env.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
