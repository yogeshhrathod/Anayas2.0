import {
    ArrowRight,
    Clock,
    FolderPlus,
    Globe,
    Search,
    Zap,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import logger from '../lib/logger';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

interface SearchResult {
  id: string;
  type: 'request' | 'collection' | 'environment' | 'history';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const collections = useStore(state => state.collections);
  const environments = useStore(state => state.environments);
  const requestHistory = useStore(state => state.requestHistory);
  const setCurrentPage = useStore(state => state.setCurrentPage);
  const setSelectedRequest = useStore(state => state.setSelectedRequest);
  const setCurrentEnvironment = useStore(state => state.setCurrentEnvironment);

  // Load all requests for search
  const [allRequests, setAllRequests] = useState<any[]>([]);

  // Lazy-load requests only when search is opened (not on mount)
  useEffect(() => {
    if (!isOpen) return;
    const loadRequests = async () => {
      try {
        const requests = await window.electronAPI.request.list();
        setAllRequests(requests);
      } catch (error) {
        logger.error('Failed to load requests for search', { error });
      }
    };
    loadRequests();
    
    // Auto focus the input when modal opens
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search requests
    allRequests.forEach(request => {
      const matchesName = request.name?.toLowerCase().includes(searchTerm);
      const matchesUrl = request.url?.toLowerCase().includes(searchTerm);
      const matchesMethod = request.method?.toLowerCase().includes(searchTerm);

      if (matchesName || matchesUrl || matchesMethod) {
        const collection = collections.find(c => c.id === request.collectionId);
        searchResults.push({
          id: `request-${request.id}`,
          type: 'request',
          title: request.name || 'Unnamed Request',
          subtitle: `${request.method} ${request.url}${collection ? ` • ${collection.name}` : ''}`,
          icon: Zap,
          action: async () => {
            const { setActiveUnsavedRequestId, setSelectedItem } = useStore.getState();
            
            // 1. Switch to request editor page
            setCurrentPage('home');
            
            // 2. Clear any active unsaved selection to prevent split-view/selection confusion
            setActiveUnsavedRequestId(null);
            
            // 3. Prepare the full request object with parsed internal fields
            const fullRequest = {
              ...request,
              headers: typeof request.headers === 'string' ? JSON.parse(request.headers) : request.headers || {},
              queryParams: typeof request.queryParams === 'string' ? JSON.parse(request.queryParams) : request.queryParams || [],
              auth: typeof request.auth === 'string' ? JSON.parse(request.auth) : request.auth || { type: 'none' },
            };
            
            // 4. Update the primary selection
            setSelectedRequest(fullRequest);
            
            // 5. Update shortcut context selection (high-level sync)
            setSelectedItem({
              type: 'request',
              id: request.id,
              data: fullRequest
            });
            
            handleClose();
          },
        });
      }
    });

    // Search collections
    collections.forEach(collection => {
      const matchesName = collection.name?.toLowerCase().includes(searchTerm);
      const matchesDescription = collection.description
        ?.toLowerCase()
        .includes(searchTerm);

      if (matchesName || matchesDescription) {
        searchResults.push({
          id: `collection-${collection.id}`,
          type: 'collection',
          title: collection.name,
          subtitle: collection.description || 'No description',
          icon: FolderPlus,
          action: () => {
            setCurrentPage('collections');
            handleClose();
          },
        });
      }
    });

    // Search environments
    environments.forEach(env => {
      const matchesName = env.name?.toLowerCase().includes(searchTerm);
      const matchesDisplayName = env.displayName
        ?.toLowerCase()
        .includes(searchTerm);

      if (matchesName || matchesDisplayName) {
        searchResults.push({
          id: `environment-${env.id}`,
          type: 'environment',
          title: env.displayName || env.name,
          subtitle: `${Object.keys(env.variables || {}).length} variables`,
          icon: Globe,
          action: () => {
            setCurrentEnvironment(env);
            setCurrentPage('environments');
            handleClose();
          },
        });
      }
    });

    // Search history
    requestHistory.forEach(history => {
      const matchesUrl = history.url?.toLowerCase().includes(searchTerm);
      const matchesMethod = history.method?.toLowerCase().includes(searchTerm);

      if (matchesUrl || matchesMethod) {
        searchResults.push({
          id: `history-${history.id}`,
          type: 'history',
          title: `${history.method} ${history.url}`,
          subtitle: `Status: ${history.status} • ${history.responseTime}ms`,
          icon: Clock,
          action: () => {
            setCurrentPage('history');
            handleClose();
          },
        });
      }
    });

    // Sort results by type and relevance
    searchResults.sort((a, b) => {
      const typeOrder = {
        request: 0,
        collection: 1,
        environment: 2,
        history: 3,
      };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    setResults(searchResults.slice(0, 10)); // Provide up to 10 results in the palette
    setSelectedIndex(0);
  }, [
    query,
    allRequests,
    collections,
    environments,
    requestHistory,
    setCurrentPage,
    setSelectedRequest,
    setCurrentEnvironment,
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            results[selectedIndex].action();
          }
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  // Only handle clicks directly on the backdrop wrapper to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'text-primary';
      case 'collection':
        return 'text-success';
      case 'environment':
        return 'text-info';
      case 'history':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'bg-primary/10 border-primary/20';
      case 'collection':
        return 'bg-success/10 border-success/20';
      case 'environment':
        return 'bg-info/10 border-info/20';
      case 'history':
        return 'bg-warning/10 border-warning/20';
      default:
        return 'bg-muted/10 border-muted/20';
    }
  };
  
  // Platform aware keybinding label
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <>
      {/* Search Input Trigger Button in TitleBar/Header */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex h-8 w-64 items-center gap-2 rounded-lg border border-border/30 bg-background/40 px-3 text-sm text-muted-foreground transition-all duration-300 hover:bg-accent/50 hover:text-foreground hover:border-border/60"
        aria-label="Open global search command palette"
      >
        <Search className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
        <span className="flex-1 text-left font-medium opacity-60 group-hover:opacity-100 transition-opacity">Search everywhere...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-muted/50 px-1.5 font-mono text-[9px] font-medium text-muted-foreground opacity-60 group-hover:opacity-100 transition-all border border-transparent group-hover:border-border/30">
          <span className="text-[10px]">{modKey}</span>K
        </kbd>
      </button>

      {/* Command Palette Overlay - Portal */}
      {isOpen &&
        createPortal(
          <div 
            className="fixed inset-0 z-[100] flex items-start justify-center bg-background/60 p-4 pt-[15vh] pb-[10vh] backdrop-blur-sm sm:p-6 sm:pt-[20vh]"
            onClick={handleBackdropClick}
          >
            <div
              ref={modalRef}
              className="w-full max-w-2xl transform divide-y divide-border/50 overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95"
            >
              {/* Search Header */}
              <div className="relative flex items-center px-4">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search requests, collections, environments..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="h-14 w-full bg-transparent px-4 text-base text-foreground placeholder-muted-foreground focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex pointer-events-none select-none items-center gap-1 rounded bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                  ESC
                </kbd>
              </div>

              {/* Results Container */}
              {query.trim() && (
                <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
                  {results.length > 0 ? (
                    <div className="space-y-1">
                      {results.map((result, index) => {
                        const Icon = result.icon;
                        const isSelected = index === selectedIndex;
                        return (
                          <button
                            key={result.id}
                            onClick={result.action}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                              'group flex w-full items-center gap-3 rounded-lg p-3 text-left outline-none transition-all duration-200 border border-transparent',
                              isSelected 
                                ? 'bg-accent shadow-sm border-border/50' 
                                : 'hover:bg-accent/50'
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                                getTypeBgColor(result.type),
                                isSelected && 'scale-110 shadow-sm transition-transform duration-200'
                              )}
                            >
                              <Icon
                                className={cn('h-4 w-4', getTypeColor(result.type))}
                              />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <span className={cn(
                                "text-sm font-medium truncate transition-colors", 
                                isSelected ? "text-foreground" : "text-foreground/90"
                              )}>
                                {result.title}
                              </span>
                              {result.subtitle && (
                                <span className="text-xs text-muted-foreground truncate mt-0.5">
                                  {result.subtitle}
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <span className="hidden sm:flex text-[10px] text-muted-foreground pr-2 font-medium">
                                Jump to
                              </span>
                            )}
                            <ArrowRight className={cn(
                              "h-4 w-4 shrink-0 transition-all duration-200",
                              isSelected 
                                ? "text-foreground opacity-100 translate-x-0" 
                                : "text-muted-foreground opacity-0 -translate-x-2"
                            )} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-14 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/30 mb-4">
                        <Search className="h-8 w-8 text-muted-foreground/60" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">No results found</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        We couldn't find anything matching "<span className="font-medium text-foreground">{query}</span>"
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Initial State / Default view when no query is typed */}
              {!query.trim() && (
                <div className="hidden sm:flex px-4 py-3 bg-muted/20 border-t border-border/50 gap-4 text-xs text-muted-foreground items-center justify-center">
                  <span className="flex items-center gap-1.5">
                    <kbd className="flex h-5 items-center justify-center rounded border border-border bg-background px-1.5 font-sans font-medium">↑</kbd>
                    <kbd className="flex h-5 items-center justify-center rounded border border-border bg-background px-1.5 font-sans font-medium">↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="flex h-5 items-center justify-center rounded border border-border bg-background px-1.5 font-sans font-medium text-[10px]">↵</kbd>
                    to select
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="flex h-5 items-center justify-center rounded border border-border bg-background px-2 font-sans font-medium text-[10px]">ESC</kbd>
                    to close
                  </span>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

