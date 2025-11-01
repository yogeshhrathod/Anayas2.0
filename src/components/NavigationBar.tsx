import { useState, useEffect } from "react";
import { Home, FolderPlus, Globe, History as HistoryIcon, Settings as SettingsIcon, ScrollText, Plus, Upload } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../store/useStore";
import { EnvironmentSelector } from "./EnvironmentSelector";
import { Request } from "../types/entities";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { getShortcutDisplay, KEYMAP } from "../lib/keymap";
import { useToastNotifications } from "../hooks/useToastNotifications";

export function NavigationBar() {
  const { currentPage, setCurrentPage, setSelectedRequest, setActiveUnsavedRequestId } = useStore();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { showSuccess, showError } = useToastNotifications();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCompact = windowWidth < 960; // Show compact mode on smaller screens

  // Primary navigation items (icon + label)
  const primaryNavItems: Array<{ 
    id: "home" | "collections" | "environments"; 
    label: string; 
    icon: React.ComponentType<{ className?: string }> 
  }> = [
    { id: "home", label: "Home", icon: Home },
    { id: "collections", label: "Collections", icon: FolderPlus },
    { id: "environments", label: "Environments", icon: Globe },
  ];

  // Secondary navigation items (icon only)
  const secondaryNavItems: Array<{ 
    id: "history" | "logs" | "settings"; 
    label: string; 
    icon: React.ComponentType<{ className?: string }> 
  }> = [
    { id: "history", label: "History", icon: HistoryIcon },
    { id: "logs", label: "Logs", icon: ScrollText },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const handleNewRequest = () => {
    // Clear active unsaved request ID to create a new one
    setActiveUnsavedRequestId(null);
    
    // Create a new empty request and set it as selected
    const newRequest: Request = {
      name: '',
      method: 'GET',
      url: '',
      headers: { 'Content-Type': 'application/json' },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: undefined,
      folderId: undefined,
      isFavorite: 0,
    };
    
    setSelectedRequest(newRequest);
  };

  const handleImportRequest = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const text = await file.text();
          const importedData = JSON.parse(text);
          
          // Handle single request import
          const requestData = importedData.request || importedData;
          
          if (requestData.method && requestData.url) {
            // Clear active unsaved request ID to create a new one
            setActiveUnsavedRequestId(null);
            
            const newRequest: Request = {
              name: requestData.name || 'Imported Request',
              method: requestData.method,
              url: requestData.url || '',
              headers: requestData.headers || { 'Content-Type': 'application/json' },
              body: requestData.body || '',
              queryParams: requestData.queryParams || [],
              auth: requestData.auth || { type: 'none' },
              collectionId: undefined,
              folderId: undefined,
              isFavorite: 0,
            };
            
            setSelectedRequest(newRequest);
            showSuccess('Request imported', { description: 'Request imported successfully' });
          } else {
            showError('Invalid file format', 'Please select a valid request JSON file');
          }
        } catch (error: any) {
          showError('Failed to parse file', error.message || 'Invalid JSON format');
        }
      };
      
      input.click();
    } catch (error: any) {
      showError('Failed to import request', error.message);
    }
  };

  return (
    <div className="flex h-11 items-center border-b border-border/50 bg-card/80 backdrop-blur-md px-4 select-none">
      {/* Primary Navigation (Left) */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" } as any}>
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "h-8 rounded-full transition-all duration-200 text-sm font-medium",
                "hover:bg-accent/50 hover:scale-[1.02]",
                isActive
                  ? "bg-primary/10 border border-primary/50 text-primary shadow-sm"
                  : "hover:text-accent-foreground",
                isCompact ? "w-8 px-0 flex items-center justify-center" : "px-3 flex items-center gap-2"
              )}
            >
              <Icon className="h-4 w-4" />
              {!isCompact && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Secondary Navigation (Right) */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" } as any}>
        {/* Action Buttons - Only visible on home page */}
        {currentPage === 'home' && (
          <>
            {/* Import Request Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleImportRequest}
                    className={cn(
                      "h-8 px-3 flex items-center gap-2 rounded-full transition-all duration-200",
                      "hover:bg-accent/50 hover:scale-[1.02] bg-blue-500/10 border border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm",
                      isCompact ? "w-8 px-0 justify-center" : ""
                    )}
                  >
                    <Upload className="h-4 w-4" />
                    {!isCompact && <span className="text-sm font-medium">Import Request</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import Request ({getShortcutDisplay(KEYMAP.IMPORT_ITEM)})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* New Request Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleNewRequest}
                    className={cn(
                      "h-8 px-3 flex items-center gap-2 rounded-full transition-all duration-200",
                      "hover:bg-accent/50 hover:scale-[1.02] bg-primary/10 border border-primary/50 text-primary shadow-sm",
                      isCompact ? "w-8 px-0 justify-center" : ""
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    {!isCompact && <span className="text-sm font-medium">New Request</span>}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Request ({getShortcutDisplay(KEYMAP.NEW_REQUEST)})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-full transition-all duration-200",
                "hover:bg-accent/50 hover:scale-[1.02]",
                isActive
                  ? "bg-primary/10 border border-primary/50 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={item.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        
        {/* Environment Selector */}
        <div className="ml-2">
          <EnvironmentSelector />
        </div>
      </div>
    </div>
  );
}

