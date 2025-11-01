import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Globe, Check, ChevronDown, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface EnvironmentSelectorProps {
  className?: string;
}

export function EnvironmentSelector({ className }: EnvironmentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    environments, 
    currentEnvironment, 
    setCurrentEnvironment,
    collections,
    selectedRequest,
    setCollectionEnvironmentSelection
  } = useStore();

  // Determine which environments to show based on current request
  const currentCollection = selectedRequest?.collectionId 
    ? collections.find(c => c.id === selectedRequest.collectionId)
    : null;

  const collectionEnvironments = currentCollection?.environments || [];
  const activeCollectionEnvId = currentCollection?.activeEnvironmentId;
  const activeCollectionEnv = collectionEnvironments.find(e => e.id === activeCollectionEnvId);

  const handleSelectGlobalEnvironment = async (env: any) => {
    try {
      await window.electronAPI.env.setCurrent(env.id);
      setCurrentEnvironment(env);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch environment:', error);
    }
  };

  const handleSelectCollectionEnvironment = async (envId: number) => {
    if (!currentCollection?.id) return;
    
    try {
      await window.electronAPI.collection.setActiveEnvironment(currentCollection.id, envId);
      setCollectionEnvironmentSelection(currentCollection.id, envId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to set collection environment:', error);
    }
  };

  // Get display text
  const getDisplayText = () => {
    if (activeCollectionEnv && currentEnvironment) {
      return `${activeCollectionEnv.name} / ${currentEnvironment.displayName}`;
    }
    if (activeCollectionEnv) {
      return activeCollectionEnv.name;
    }
    return (currentEnvironment as any)?.display_name || 'No Environment';
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent/50 hover:scale-[1.02] transition-all duration-200"
        title="Switch environment"
      >
        <Globe className="h-4 w-4" />
        <span>{getDisplayText()}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-[9999] mt-2 w-80 rounded-md border bg-popover p-2 shadow-lg">
            {currentCollection && collectionEnvironments.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                  <Building2 className="h-3 w-3" />
                  <span>Collection: {currentCollection.name}</span>
                </div>
                <div className="space-y-1">
                  {collectionEnvironments.map((env: any) => (
                    <button
                      key={env.id}
                      onClick={() => handleSelectCollectionEnvironment(env.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent',
                        activeCollectionEnvId === env.id && 'bg-accent'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="font-medium">{env.name}</span>
                      </div>
                      {activeCollectionEnvId === env.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={currentCollection && collectionEnvironments.length > 0 ? "border-t pt-3" : ""}>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                <Globe className="h-3 w-3" />
                <span>Global Environments</span>
              </div>
              <div className="mt-1 max-h-64 space-y-1 overflow-auto">
                {environments.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No global environments configured
                  </div>
                ) : (
                  environments.map((env: any) => (
                    <button
                      key={env.id}
                      onClick={() => handleSelectGlobalEnvironment(env)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent',
                        currentEnvironment?.id === env.id && 'bg-accent'
                      )}
            >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <div className="text-left">
                          <div className="font-medium">{env.display_name || env.displayName}</div>
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
          </div>
        </>
      )}
    </div>
  );
}

