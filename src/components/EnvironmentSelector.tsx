import { 
  Building2, 
  Check, 
  ChevronDown, 
  Globe, 
  Settings2,
  Circle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import logger from '../lib/logger';

interface EnvironmentSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export function EnvironmentSelector({ className, showLabel = false }: EnvironmentSelectorProps) {
  const {
    environments,
    currentEnvironment,
    setCurrentEnvironment,
    collections,
    setCollections,
    selectedRequest,
    selectedCollectionForNewRequest,
    setCollectionEnvironmentSelection,
    triggerSidebarRefresh,
    setCurrentPage
  } = useStore();

  // Determine which environments to show:
  // Priority 1: collection of the currently-loaded saved request
  // Priority 2: collection selected for a new request (sidebar selection)
  const currentCollectionId =
    selectedRequest?.collectionId ?? selectedCollectionForNewRequest;
  
  const currentCollection = currentCollectionId
    ? collections.find(c => c.id === currentCollectionId)
    : null;

  const collectionEnvironments = currentCollection?.environments || [];
  const activeCollectionEnvId = currentCollection?.activeEnvironmentId;
  const activeCollectionEnv = collectionEnvironments.find(
    e => e.id === activeCollectionEnvId
  );

  const handleSelectGlobalEnvironment = async (env: any) => {
    try {
      await window.electronAPI.env.setCurrent(env.id);
      setCurrentEnvironment(env);
    } catch (error) {
      logger.error('Failed to switch environment', { error });
    }
  };

  const handleSelectCollectionEnvironment = async (envId: number) => {
    if (!currentCollection?.id) return;

    try {
      const result = await window.electronAPI.collection.setActiveEnvironment(
        currentCollection.id,
        envId
      );
      if (result?.success && result.collection) {
        const updatedCollections = collections.map(c =>
          c.id === currentCollection.id ? result.collection : c
        );
        setCollections(updatedCollections);
        setCollectionEnvironmentSelection(currentCollection.id, envId);
        triggerSidebarRefresh();
      }
    } catch (error) {
      logger.error('Failed to switch collection environment', { error });
    }
  };

  const getDisplayText = () => {
    if (activeCollectionEnv && currentEnvironment) {
      return `${activeCollectionEnv.name} / ${currentEnvironment.displayName}`;
    }
    if (activeCollectionEnv) {
      return activeCollectionEnv.name;
    }
    return currentEnvironment?.displayName || 'No Environment';
  };

  const hasActiveEnv = !!activeCollectionEnv || !!currentEnvironment;

  return (
    <div className={cn('relative inline-flex items-center gap-2', className)}>
      {showLabel && <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 ml-1">Env</span>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "group flex items-center gap-2.5 rounded-xl border border-border/40 bg-background/50 px-3 py-1.5 text-xs font-semibold hover:bg-accent/50 hover:border-border transition-all duration-300 min-w-[120px] max-w-[240px] shadow-sm backdrop-blur-sm",
              !hasActiveEnv && "text-muted-foreground/60"
            )}
            title="Switch environment"
          >
            <div className="relative flex items-center justify-center">
              <Globe className={cn("h-3.5 w-3.5 transition-colors duration-300", hasActiveEnv ? "text-primary" : "text-muted-foreground/40")} />
              {hasActiveEnv && (
                <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
              )}
            </div>
            
            <span className="truncate flex-1 text-left tracking-tight">
              {getDisplayText()}
            </span>
            
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-70 transition-all duration-300 group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[280px] p-2">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
             <div className="flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Environments</span>
             </div>
             <button 
               onClick={() => setCurrentPage('environments')}
               className="text-[10px] font-bold text-primary hover:underline"
              >
               Manage
             </button>
          </div>

          <DropdownMenuSeparator className="mb-2" />

          {/* Collection Environments Section */}
          {currentCollection && (
            <div className="mb-3">
              <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-500/70">
                <Building2 className="h-3 w-3" />
                <span>Collection: {currentCollection.name}</span>
              </div>
              
              <div className="mt-1 space-y-0.5">
                {collectionEnvironments.length === 0 ? (
                  <div className="p-2 text-[11px] text-muted-foreground italic">No environments defined for this collection</div>
                ) : (
                  collectionEnvironments.map((env: any) => (
                    <DropdownMenuItem
                      key={env.id}
                      onClick={() => handleSelectCollectionEnvironment(env.id)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-200",
                        activeCollectionEnvId === env.id ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold" : "hover:bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Circle className={cn("h-1.5 w-1.5 fill-current", activeCollectionEnvId === env.id ? "text-blue-500" : "text-muted-foreground/30")} />
                        <span className="truncate max-w-[180px]">{env.name}</span>
                      </div>
                      {activeCollectionEnvId === env.id && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </DropdownMenuItem>
                  ))
                )}
                
                <DropdownMenuItem 
                  onClick={() => handleSelectCollectionEnvironment(-1)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer mt-1 italic text-muted-foreground",
                    !activeCollectionEnvId && "bg-accent font-medium text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Circle className={cn("h-1.5 w-1.5", !activeCollectionEnvId ? "fill-muted-foreground text-muted-foreground" : "text-muted-foreground/30")} />
                    <span>No Collection Environment</span>
                  </div>
                  {!activeCollectionEnvId && <Check className="h-3.5 w-3.5" />}
                </DropdownMenuItem>
              </div>
            </div>
          )}

          {/* Global Environments Section */}
          <div>
            <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-500/70">
              <Globe className="h-3 w-3" />
              <span>Global Environments</span>
            </div>
            
            <div className="mt-1 space-y-0.5 max-h-[240px] overflow-y-auto no-scrollbar">
              {environments.length === 0 ? (
                <div className="p-2 text-[11px] text-muted-foreground italic text-center py-4 bg-muted/20 rounded-lg mt-1">
                  No global environments configured
                </div>
              ) : (
                environments.map((env: any) => (
                  <DropdownMenuItem
                    key={env.id}
                    onClick={() => handleSelectGlobalEnvironment(env)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-200",
                      currentEnvironment?.id === env.id ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                        currentEnvironment?.id === env.id ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"
                      )} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate max-w-[180px]">{env.displayName}</span>
                        {env.name !== env.displayName && (
                           <span className="text-[10px] font-medium opacity-60 truncate">{env.name}</span>
                        )}
                      </div>
                    </div>
                    {currentEnvironment?.id === env.id && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuItem 
                onClick={() => handleSelectGlobalEnvironment(null)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer mt-1 italic text-muted-foreground",
                  !currentEnvironment && "bg-accent font-medium text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-1.5 w-1.5 rounded-full", !currentEnvironment ? "bg-muted-foreground" : "bg-muted-foreground/30")} />
                  <span>No Global Environment</span>
                </div>
                {!currentEnvironment && <Check className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

