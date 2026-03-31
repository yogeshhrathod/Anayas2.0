import {
  ChevronDown,
  FileJson,
  FolderPlus,
  Globe,
  History as HistoryIcon,
  Home,
  Plus,
  Settings as SettingsIcon,
  Terminal,
  Upload,
  Minus,
  Square,
  X,
  Maximize2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { getShortcutDisplay, KEYMAP } from '../lib/keymap';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { Request } from '../types/entities';
import { CurlImportDialog } from './curl/CurlImportDialog';
import { EnvironmentSelector } from './EnvironmentSelector';
import { ImportCollectionDialog } from './import';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Logo } from './Logo';
import { GlobalSearch } from './GlobalSearch';
import { Button } from './ui/button';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const platform = useStore(state => state.platform);
  const isMac = platform === 'mac';
  
  const currentPage = useStore(state => state.currentPage);
  const setCurrentPage = useStore(state => state.setCurrentPage);
  const setSelectedRequest = useStore(state => state.setSelectedRequest);
  const setActiveUnsavedRequestId = useStore(state => state.setActiveUnsavedRequestId);
  const setCollections = useStore(state => state.setCollections);
  const setHistoryFilter = useStore(state => state.setHistoryFilter);
  const setRequests = useStore(state => state.setRequests);
  const setUnsavedRequests = useStore(state => state.setUnsavedRequests);
  const triggerSidebarRefresh = useStore(state => state.triggerSidebarRefresh);
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showCurlImport, setShowCurlImport] = useState(false);
  const [showPostmanImport, setShowPostmanImport] = useState(false);
  const { showSuccess, showError } = useToastNotifications();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    checkMaximized();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkMaximized = async () => {
    try {
      const maximized = await window.electronAPI.window.isMaximized();
      setIsMaximized(maximized);
    } catch (e) {
      // Ignore if not in electron
    }
  };

  const isCompact = windowWidth < 1380;
  const isUltraCompact = windowWidth < 1240;

  const primaryNavItems: Array<{
    id: 'home' | 'collections' | 'environments';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'collections', label: 'Collections', icon: FolderPlus },
    { id: 'environments', label: 'Environments', icon: Globe },
  ];

  const secondaryNavItems: Array<{
    id: 'history' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleNewRequest = () => {
    setActiveUnsavedRequestId(null);
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
    setCurrentPage('home');
  };

  const handleImportRequest = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async e => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const importedData = JSON.parse(text);
          const requestData = importedData.request || importedData;
          if (requestData.method && requestData.url) {
            setActiveUnsavedRequestId(null);
            const newRequest: Request = {
              name: requestData.name || 'Imported Request',
              method: requestData.method,
              url: requestData.url || '',
              headers: requestData.headers || { 'Content-Type': 'application/json' },
              body: requestData.body || '',
              queryParams: requestData.queryParams || [],
              auth: requestData.auth || { type: 'none' },
              isFavorite: 0,
            };
            setSelectedRequest(newRequest);
            showSuccess('Request imported');
          }
        } catch (error: any) {
          showError('Failed to parse file', error.message);
        }
      };
      input.click();
    } catch (error: any) {
      showError('Failed to import request', error.message);
    }
  };

  const handleCurlImportComplete = async (requests: Request[], collectionId?: number, folderId?: number) => {
    try {
      if (requests.length === 0) return;
      let loadedRequest: Request | null = null;
      let loadedActiveUnsavedId: string | null = null;

      if (collectionId) {
        for (const req of requests) {
          const result = await window.electronAPI.request.save({ ...req, collectionId, folderId, isFavorite: 0 });
          if (!loadedRequest) loadedRequest = { ...req, id: result.id, collectionId, folderId };
        }
        showSuccess('Requests imported to collection');
        const updatedReqs = await window.electronAPI.request.list();
        setRequests(updatedReqs);
        triggerSidebarRefresh();
      } else {
        for (const req of requests) {
          const result = await window.electronAPI.unsavedRequest.save({
            name: req.name || 'Imported Request',
            method: req.method,
            url: req.url || '',
            headers: req.headers || {},
            body: req.body || '',
            queryParams: req.queryParams || [],
            auth: req.auth || { type: 'none' },
          });
          if (result.id) {
            loadedActiveUnsavedId = result.id;
            loadedRequest = { ...req, id: undefined, collectionId: undefined, folderId: undefined };
          }
        }
        showSuccess('Requests loaded into drafts');
        const allUnsaved = await window.electronAPI.unsavedRequest.getAll();
        setUnsavedRequests(allUnsaved);
        triggerSidebarRefresh();
      }

      if (loadedRequest) {
        if (!collectionId) setActiveUnsavedRequestId(loadedActiveUnsavedId);
        else setActiveUnsavedRequestId(null);
        setSelectedRequest(loadedRequest);
        setCurrentPage('home');
      }
    } catch (error: any) {
      showError('Import failed', error.message);
    }
  };

  const handleMinimize = () => window.electronAPI.window.minimize();
  const handleMaximize = async () => {
    await window.electronAPI.window.maximize();
    checkMaximized();
  };
  const handleClose = () => window.electronAPI.window.close();

  return (
    <TooltipProvider>
      <div
        className={cn(
          'grid grid-cols-[1fr_auto_1fr] h-14 items-center border-b border-border bg-background/80 backdrop-blur-xl select-none z-sticky transition-all duration-300 px-3'
        )}
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        {/* Column 1: Left Side (Logo + Primary Nav) */}
        <div className="flex items-center gap-4 min-w-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="flex items-center gap-3 shrink-0">
             {isMac && <div className="w-[72px]" />}
             <Logo size={20} showText={!isUltraCompact} className="hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0" onClick={() => setCurrentPage('home')} />
          </div>

          <div className="h-6 w-[1px] bg-border/40 mx-1 shrink-0" />

          <nav className="flex items-center gap-1.5 shrink-0" aria-label="Primary navigation">
            {primaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'h-9 rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-2 relative group flex-shrink-0',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    isCompact ? 'px-2' : 'px-3'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                  {!isCompact && <span className="ml-2 pr-0.5">{item.label}</span>}
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-dot" 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" 
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Column 2: Center (Search) */}
        <div className="flex justify-center items-center px-4 overflow-hidden h-full" style={{ WebkitAppRegion: 'drag' } as any}>
          <div className={cn("w-full transition-all duration-300", isUltraCompact ? "max-w-[260px]" : "max-w-md")} style={{ WebkitAppRegion: 'no-drag' } as any}>
            <GlobalSearch />
          </div>
        </div>

              {/* Column 3: Right Side (Env + Actions + Utilities + Controls) */}
        <div className="flex items-center gap-2 justify-end min-w-0 h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Environment Selector (Most used Context) */}
          <div className={cn("shrink-0 transition-all duration-300", isUltraCompact ? "w-28" : "w-40")}>
             <EnvironmentSelector />
          </div>

          <div className="h-6 w-[1px] bg-border/40 shrink-0 mx-0.5" />

          {/* Quick Actions (Import/New) */}
          {currentPage === 'home' && (
            <div className={cn("flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/20 shrink-0", isUltraCompact ? "px-0.5" : "px-1")}>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className={cn("h-8 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 hover:text-blue-700 transition-colors gap-2", isUltraCompact ? "px-2" : "px-3")}>
                        <Upload className="h-3.5 w-3.5 shrink-0" />
                        {!isCompact && <span className="text-xs font-bold uppercase tracking-wider">Import</span>}
                        <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Import Request</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-56">
                   <DropdownMenuItem onClick={handleImportRequest} className="gap-2">
                     <Upload className="h-4 w-4" /> Import JSON
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => setShowCurlImport(true)} className="gap-2">
                     <Terminal className="h-4 w-4" /> Import cURL
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => setShowPostmanImport(true)} className="gap-2">
                     <FileJson className="h-4 w-4" /> Import Postman
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleNewRequest} size="sm" className={cn("h-8 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2", isUltraCompact ? "px-2" : "px-3")}>
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    {!isCompact && <span className="text-xs font-bold uppercase tracking-wider">New</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Request ({getShortcutDisplay(KEYMAP.NEW_REQUEST)})</TooltipContent>
              </Tooltip>
            </div>
          )}

          {!isUltraCompact && <div className="h-6 w-[1px] bg-border/40 shrink-0 mx-0.5" />}

          {/* Secondary Utilities (History, Settings, Help) */}
          <div className="flex items-center gap-0.5 shrink-0">
             {secondaryNavItems.map(item => {
               const Icon = item.icon;
               const isActive = currentPage === item.id;
               return (
                 <Tooltip key={item.id}>
                   <TooltipTrigger asChild>
                     <button
                       onClick={() => {
                         if (item.id === 'history') setHistoryFilter(null);
                         setCurrentPage(item.id);
                       }}
                       className={cn(
                         "h-8 w-8 flex items-center justify-center rounded-xl transition-all duration-200",
                         isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                       )}
                     >
                       <Icon className="h-4 w-4" />
                     </button>
                   </TooltipTrigger>
                   <TooltipContent>{item.label}</TooltipContent>
                 </Tooltip>
               );
             })}
             <KeyboardShortcutsHelp />
          </div>

          {/* Platform Controls for Windows */}
          {!isMac && (
            <div className="flex items-center h-full border-l border-border/20 pl-1 ml-1 shrink-0">
              <button onClick={handleMinimize} className="h-full px-2.5 flex items-center justify-center hover:bg-muted transition-colors"><Minus className="h-3.5 w-3.5" /></button>
              <button onClick={handleMaximize} className="h-full px-2.5 flex items-center justify-center hover:bg-muted transition-colors">{isMaximized ? <Square className="h-3 w-3" /> : <Maximize2 className="h-3.5 w-3.5" />}</button>
              <button onClick={handleClose} className="h-full px-2.5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
            </div>
          )}
          
          {/* On Mac, we don't need a right spacer since there are no system buttons there */}
        </div>
      </div>

      <CurlImportDialog open={showCurlImport} onOpenChange={setShowCurlImport} onImport={handleCurlImportComplete} requireCollection={false} />
      <ImportCollectionDialog open={showPostmanImport} onOpenChange={setShowPostmanImport} onSuccess={async () => {
         const updated = await window.electronAPI.collection.list();
         setCollections(updated);
         showSuccess('Collection imported');
      }} />
    </TooltipProvider>
  );
}

import { motion } from 'framer-motion';
