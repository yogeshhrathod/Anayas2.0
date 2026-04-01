import { 
  Globe, 
  Info, 
  Cpu,
  Monitor,
  Database,
  FileEdit,
  Activity
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function StatusBar() {
  const currentEnvironment = useStore(state => state.currentEnvironment);
  const appVersion = useStore(state => state.appVersion);
  const unsavedRequests = useStore(state => state.unsavedRequests);
  const performanceRunning = useStore(state => state.performanceRunning);
  const performanceProgress = useStore(state => state.performanceProgress);
  const platform = useStore(state => state.platform);
  const collections = useStore(state => state.collections);
  const selectedRequest = useStore(state => state.selectedRequest);

  // Get active collection name if a request is selected
  const activeCollection = selectedRequest?.collectionId 
    ? collections.find(c => c.id === selectedRequest.collectionId)?.name 
    : null;

  return (
    <div className="flex-shrink-0 h-9 flex items-center justify-between px-4 border-t bg-card/40 backdrop-blur-md text-[11px] text-muted-foreground select-none">
      {/* Left Section: Global App Status */}
      <div className="flex items-center gap-4 overflow-hidden">
        {/* Connection Status */}
        <div className="flex items-center gap-2 min-w-fit">
          <div className="w-2 h-2 rounded-full bg-success opacity-80" />
          <span className="font-medium whitespace-nowrap uppercase tracking-wider opacity-80">Connected</span>
        </div>

        {/* Workspace/Collection Context */}
        {activeCollection && (
          <div className="flex items-center gap-1.5 border-l border-border/40 pl-4 animate-in fade-in duration-300">
             <Database className="h-3 w-3 opacity-60" />
             <span className="opacity-80">Workspace:</span>
             <span className="font-semibold text-foreground/80">{activeCollection}</span>
          </div>
        )}

        {/* Unsaved Changes Indicator */}
        {unsavedRequests.length > 0 && (
          <div className="flex items-center gap-1.5 border-l border-border/40 pl-4 animate-in fade-in slide-in-from-left-2 duration-300 text-amber-500/90">
             <FileEdit className="h-3 w-3" />
             <span>{unsavedRequests.length} unsaved draft{unsavedRequests.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Background Performance Tasks */}
        {performanceRunning && (
          <div className="flex items-center gap-2 border-l border-border/40 pl-4 text-primary animate-pulse">
             <Activity className="h-3 w-3" />
             <span className="font-medium">Performance test in progress...</span>
             {performanceProgress.length > 0 && (
               <span className="opacity-80 text-[10px]">({performanceProgress.length} results collected)</span>
             )}
          </div>
        )}
      </div>

      {/* Right Section: System info, Environment & Version */}
      <div className="flex items-center gap-4">
        <TooltipProvider>
          {/* Platform Indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                {platform === 'mac' ? <Monitor className="h-3 w-3 opacity-70" /> : <Cpu className="h-3 w-3 opacity-70" />}
                <span className="capitalize">{platform || 'Desktop'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">Platform: {platform === 'mac' ? 'macOS' : platform || 'Desktop'}</TooltipContent>
          </Tooltip>

          <div className="w-[1px] h-3 bg-border/40" />

          {/* Environment Indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default px-1.5 py-0.5 rounded-sm",
                currentEnvironment ? "bg-primary/5 text-primary/90" : ""
              )}>
                <Globe className="h-3 w-3 opacity-70" />
                <span className="font-medium">
                  {currentEnvironment?.displayName || currentEnvironment?.name || "Global Environment"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">Active Environment</TooltipContent>
          </Tooltip>

          <div className="w-[1px] h-3 bg-border/40" />

          {/* Sync Status / Storage */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default opacity-70">
                <Database className="h-3 w-3" />
                <span>Local Engine</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">Data stored locally on this machine</TooltipContent>
          </Tooltip>

          <div className="w-[1px] h-3 bg-border/40" />

          {/* Version Info */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default opacity-70">
                <Info className="h-3 w-3" />
                <span>v{appVersion || "0.0.0"}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">Application Version</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
