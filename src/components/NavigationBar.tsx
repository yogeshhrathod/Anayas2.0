import { useState, useEffect } from 'react';
import {
  Home,
  FolderPlus,
  Globe,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ScrollText,
  Plus,
  Upload,
  Terminal,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { EnvironmentSelector } from './EnvironmentSelector';
import { Request } from '../types/entities';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getShortcutDisplay, KEYMAP } from '../lib/keymap';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { CurlImportDialog } from './curl/CurlImportDialog';

export function NavigationBar() {
  const {
    currentPage,
    setCurrentPage,
    setSelectedRequest,
    setActiveUnsavedRequestId,
  } = useStore();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showCurlImport, setShowCurlImport] = useState(false);
  const { showSuccess, showError } = useToastNotifications();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCompact = windowWidth < 960; // Show compact mode on smaller screens

  // Primary navigation items (icon + label)
  const primaryNavItems: Array<{
    id: 'home' | 'collections' | 'environments';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'collections', label: 'Collections', icon: FolderPlus },
    { id: 'environments', label: 'Environments', icon: Globe },
  ];

  // Secondary navigation items (icon only)
  const secondaryNavItems: Array<{
    id: 'history' | 'logs' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
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

      input.onchange = async e => {
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
              headers: requestData.headers || {
                'Content-Type': 'application/json',
              },
              body: requestData.body || '',
              queryParams: requestData.queryParams || [],
              auth: requestData.auth || { type: 'none' },
              collectionId: undefined,
              folderId: undefined,
              isFavorite: 0,
            };

            setSelectedRequest(newRequest);
            showSuccess('Request imported', {
              description: 'Request imported successfully',
            });
          } else {
            showError(
              'Invalid file format',
              'Please select a valid request JSON file'
            );
          }
        } catch (error: unknown) {
          showError(
            'Failed to parse file',
            error instanceof Error ? error.message : 'Invalid JSON format'
          );
        }
      };

      input.click();
    } catch (error: unknown) {
      showError(
        'Failed to import request',
        error instanceof Error ? error.message : 'Failed to import request'
      );
    }
  };

  const handleCurlImport = () => {
    setShowCurlImport(true);
  };

  const handleCurlImportComplete = async (
    requests: Request[],
    _collectionId?: number,
    _folderId?: number
  ) => {
    try {
      if (requests.length === 0) {
        showError('No requests to import', 'Please parse a valid cURL command');
        return;
      }

      // For home page, load the first request into the request builder
      // Clear active unsaved request ID to create a new one
      setActiveUnsavedRequestId(null);

      const importedRequest = requests[0];
      const newRequest: Request = {
        name: importedRequest.name || 'Imported Request',
        method: importedRequest.method,
        url: importedRequest.url || '',
        headers: importedRequest.headers || {
          'Content-Type': 'application/json',
        },
        body: importedRequest.body || '',
        queryParams: importedRequest.queryParams || [],
        auth: importedRequest.auth || { type: 'none' },
        collectionId: undefined,
        folderId: undefined,
        isFavorite: 0,
      };

      setSelectedRequest(newRequest);
      showSuccess('Request imported', {
        description:
          requests.length > 1
            ? `Loaded first request (${requests.length} total parsed)`
            : 'Request loaded into builder',
      });
    } catch (error: unknown) {
      console.error('Failed to import cURL request:', error);
      showError(
        'Import failed',
        error instanceof Error ? error.message : 'Failed to import request'
      );
      throw error;
    }
  };

  return (
    <div
      className="flex h-11 items-center border-b border-border/50 bg-card/80 backdrop-blur-md px-4 select-none z-sticky"
      role="navigation"
      aria-label="Application navigation"
      data-testid="primary-navigation"
    >
      {/* Primary Navigation (Left) */}
      { }
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {primaryNavItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'h-8 rounded-full transition-all duration-200 text-sm font-medium',
                'hover:bg-accent/50 hover:scale-[1.02]',
                isActive
                  ? 'bg-primary/10 border border-primary/50 text-primary shadow-sm'
                  : 'hover:text-accent-foreground',
                isCompact
                  ? 'w-8 px-0 flex items-center justify-center'
                  : 'px-3 flex items-center gap-2'
              )}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`nav-${item.id}`}
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
      { }
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {/* Action Buttons - Only visible on home page */}
        {currentPage === 'home' && (
          <>
            {/* Import Request Button with Dropdown */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'h-8 px-3 flex items-center gap-2 rounded-full transition-all duration-200',
                          'hover:bg-accent/50 hover:scale-[1.02] bg-blue-500/10 border border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm',
                          isCompact ? 'w-8 px-0 justify-center' : ''
                        )}
                      >
                        <Upload className="h-4 w-4" />
                        {!isCompact && (
                          <>
                            <span className="text-sm font-medium">Import</span>
                            <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Import Request ({getShortcutDisplay(KEYMAP.IMPORT_ITEM)})
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleImportRequest}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCurlImport}>
                  <Terminal className="h-4 w-4 mr-2" />
                  Import cURL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* New Request Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleNewRequest}
                    className={cn(
                      'h-8 px-3 flex items-center gap-2 rounded-full transition-all duration-200',
                      'hover:bg-accent/50 hover:scale-[1.02] bg-primary/10 border border-primary/50 text-primary shadow-sm',
                      isCompact ? 'w-8 px-0 justify-center' : ''
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    {!isCompact && (
                      <span className="text-sm font-medium">New Request</span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>New Request ({getShortcutDisplay(KEYMAP.NEW_REQUEST)})</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        {secondaryNavItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-full transition-all duration-200',
                'hover:bg-accent/50 hover:scale-[1.02]',
                isActive
                  ? 'bg-primary/10 border border-primary/50 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={item.label}
              aria-label={item.label}
              data-testid={`nav-${item.id}`}
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

      {/* cURL Import Dialog */}
      <CurlImportDialog
        open={showCurlImport}
        onOpenChange={setShowCurlImport}
        onImport={handleCurlImportComplete}
        requireCollection={false}
      />
    </div>
  );
}
