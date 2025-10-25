import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Clock, Globe, FolderPlus, Zap, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

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
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    collections,
    environments,
    requestHistory,
    setCurrentPage,
    setSelectedRequest,
    setCurrentEnvironment,
  } = useStore();

  // Load all requests for search
  const [allRequests, setAllRequests] = useState<any[]>([]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const requests = await window.electronAPI.request.list();
        setAllRequests(requests);
      } catch (error) {
        console.error('Failed to load requests for search:', error);
      }
    };
    loadRequests();
  }, []);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search requests
    allRequests.forEach((request) => {
      const matchesName = request.name?.toLowerCase().includes(searchTerm);
      const matchesUrl = request.url?.toLowerCase().includes(searchTerm);
      const matchesMethod = request.method?.toLowerCase().includes(searchTerm);

      if (matchesName || matchesUrl || matchesMethod) {
        const collection = collections.find(c => c.id === request.collection_id);
        searchResults.push({
          id: `request-${request.id}`,
          type: 'request',
          title: request.name || 'Unnamed Request',
          subtitle: `${request.method} ${request.url}${collection ? ` • ${collection.name}` : ''}`,
          icon: Zap,
          action: async () => {
            setCurrentPage('home');
            setSelectedRequest({
              id: request.id,
              name: request.name || '',
              method: request.method,
              url: request.url,
              headers: typeof request.headers === 'string' 
                ? JSON.parse(request.headers) 
                : (request.headers || {}),
              body: request.body || '',
              queryParams: [],
              auth: { type: 'none' },
              collection_id: request.collection_id,
              is_favorite: request.is_favorite
            });
            setIsOpen(false);
            setQuery('');
          }
        });
      }
    });

    // Search collections
    collections.forEach((collection) => {
      const matchesName = collection.name?.toLowerCase().includes(searchTerm);
      const matchesDescription = collection.description?.toLowerCase().includes(searchTerm);

      if (matchesName || matchesDescription) {
        searchResults.push({
          id: `collection-${collection.id}`,
          type: 'collection',
          title: collection.name,
          subtitle: collection.description || 'No description',
          icon: FolderPlus,
          action: () => {
            setCurrentPage('collections');
            setIsOpen(false);
            setQuery('');
          }
        });
      }
    });

    // Search environments
    environments.forEach((env) => {
      const matchesName = env.name?.toLowerCase().includes(searchTerm);
      const matchesDisplayName = env.displayName?.toLowerCase().includes(searchTerm);

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
            setIsOpen(false);
            setQuery('');
          }
        });
      }
    });

    // Search history
    requestHistory.forEach((history) => {
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
            setIsOpen(false);
            setQuery('');
          }
        });
      }
    });

    // Sort results by type and relevance
    searchResults.sort((a, b) => {
      const typeOrder = { request: 0, collection: 1, environment: 2, history: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    setResults(searchResults.slice(0, 8)); // Limit to 8 results
    setSelectedIndex(0);
  }, [query, allRequests, collections, environments, requestHistory, setCurrentPage, setSelectedRequest, setCurrentEnvironment]);

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
          setIsOpen(false);
          setQuery('');
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
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'request': return 'text-primary';
      case 'collection': return 'text-success';
      case 'environment': return 'text-info';
      case 'history': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'request': return 'bg-primary/5 border-primary/20';
      case 'collection': return 'bg-success/5 border-success/20';
      case 'environment': return 'bg-info/5 border-info/20';
      case 'history': return 'bg-warning/5 border-warning/20';
      default: return 'bg-muted/5 border-muted/20';
    }
  };

  return (
    <div className="relative" ref={resultsRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search requests, collections, environments... (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay closing to allow clicking on results
            setTimeout(() => setIsOpen(false), 150);
          }}
          className={cn(
            "h-9 pl-10 pr-4 bg-background/50 backdrop-blur-sm border border-input/50 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring/50 focus:bg-background transition-all duration-300 shadow-sm hover:shadow-md text-center",
            isFocused ? "w-[500px]" : "w-80"
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      {/* Search Results - Portal */}
      {isOpen && createPortal(
        <div 
          className="fixed bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl z-[99999] max-h-96 overflow-y-auto transition-all duration-300"
          style={{
            top: (inputRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
            left: inputRef.current?.getBoundingClientRect().left ?? 0,
            width: isFocused ? 500 : 320,
          }}
        >
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={result.action}
                    className={cn(
                      "group w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-accent transition-all duration-200 border border-transparent hover:border-border/50",
                      index === selectedIndex && "bg-accent border-border/50 shadow-sm"
                    )}
                  >
                    <div className={cn("p-2 rounded-md border", getTypeBgColor(result.type))}>
                      <Icon className={cn("h-4 w-4", getTypeColor(result.type))} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">{result.subtitle}</div>
                      )}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            null
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
