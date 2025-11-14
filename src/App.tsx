import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useStore } from "./store/useStore";
import { TitleBar } from "./components/TitleBar";
import { NavigationBar } from "./components/NavigationBar";
import { ThemeManager } from "./components/ThemeManager";
import Toaster from "./components/Toaster";
import { PageLoadingSpinner } from "./components/ui/PageLoadingSpinner";
// Lazy load pages for better performance
// Pages use named exports, so we need to map them to default exports for lazy()
const Homepage = lazy(() => import("./pages/Homepage").then(module => ({ default: module.Homepage })));
const Environments = lazy(() => import("./pages/Environments").then(module => ({ default: module.Environments })));
const Collections = lazy(() => import("./pages/Collections").then(module => ({ default: module.Collections })));
const History = lazy(() => import("./pages/History").then(module => ({ default: module.History })));
const Settings = lazy(() => import("./pages/Settings").then(module => ({ default: module.Settings })));
const Logs = lazy(() => import("./pages/Logs").then(module => ({ default: module.Logs })));
import { CollectionHierarchy } from "./components/CollectionHierarchy";
import { UnsavedRequestsSection } from "./components/collection/UnsavedRequestsSection";
import { ResizeHandle } from "./components/ui/resize-handle";
import { VerticalResizeHandle } from "./components/ui/vertical-resize-handle";
import { useShortcuts } from "./hooks/useShortcuts";
import { useSessionRecovery } from "./hooks/useSessionRecovery";
import { ContextState } from "./lib/shortcuts/types";
import { Request } from "./types/entities";
import {
  Menu,
  Zap,
} from "lucide-react";
import { cn } from "./lib/utils";
import { trackFeatureLoad } from "./lib/performance";

function App() {
  // Session recovery - load unsaved requests on startup
  useSessionRecovery();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [_requests, setRequests] = useState<any[]>([]);
  const {
    currentPage,
    setCurrentPage,
    setEnvironments,
    setCurrentEnvironment,
    setCollections,
    setRequestHistory,
    setSelectedRequest,
    setSettings,
    setThemeMode,
    setCurrentThemeId,
    setCustomThemes,
    sidebarWidth,
    setSidebarWidth,
    unsavedSectionHeight,
    setUnsavedSectionHeight,
    unsavedRequests,
    // @ts-ignore - selectedItem is used in shortcut handlers
    selectedItem,
    setSelectedItem,
    triggerSidebarRefresh,
  } = useStore();

  useEffect(() => {
    // Load initial data with error handling
    loadData().catch((error) => {
      console.error('[App] Critical error during initialization:', error);
    });
  }, []);

  // Single centralized shortcut handler
  useShortcuts({
    'global-search': () => {
      const input = document.querySelector('[data-global-search]') as HTMLInputElement;
      input?.focus();
    },
    
    'toggle-sidebar': () => {
      setSidebarOpen(!sidebarOpen);
    },
    
    'show-shortcuts': () => {
      // TODO: Implement shortcut help dialog
      console.log('Show shortcuts help');
    },
    
    'edit-item': (_: KeyboardEvent, context: ContextState) => {
      if (context.selectedItem.type === 'request') {
        // Load and edit request
        setSelectedRequest(context.selectedItem.data);
        setCurrentPage('home');
      } else if (context.selectedItem.type === 'collection') {
        // TODO: Implement collection editing
        console.log('Collection edit not implemented yet');
      } else if (context.selectedItem.type === 'folder') {
        // TODO: Implement folder editing
        console.log('Folder edit not implemented yet');
      }
    },
    
    'duplicate-item': async (_: KeyboardEvent, context: ContextState) => {
      if (context.selectedItem.type === 'request') {
        try {
          const duplicate = {
            name: `${context.selectedItem.data.name} (Copy)`,
            method: context.selectedItem.data.method,
            url: context.selectedItem.data.url,
            headers: context.selectedItem.data.headers || {},
            body: context.selectedItem.data.body || '',
            queryParams: context.selectedItem.data.queryParams || [],
            auth: context.selectedItem.data.auth || { type: 'none' },
            collectionId: context.selectedItem.data.collectionId,
            folderId: context.selectedItem.data.folderId,
            isFavorite: false
          };
          
          // Use saveAfter to insert the duplicate right after the original request
          await window.electronAPI.request.saveAfter(duplicate, context.selectedItem.id!);
          
          // Refresh both collections and requests
          const [updatedCollections, updatedRequests] = await Promise.all([
            window.electronAPI.collection.list(),
            window.electronAPI.request.list()
          ]);
          setCollections(updatedCollections);
          setRequests(updatedRequests);
        } catch (error) {
          console.error('Failed to duplicate request:', error);
        }
      } else if (context.selectedItem.type === 'collection') {
        try {
          const duplicate = {
            name: `${context.selectedItem.data.name} (Copy)`,
            description: context.selectedItem.data.description || '',
            variables: context.selectedItem.data.variables || {},
            isFavorite: false
          };
          
          const result = await window.electronAPI.collection.save(duplicate);
          if (!result.success) {
            console.error('Failed to create duplicate collection');
            return;
          }

          const newCollectionId = result.id;

          // Get all requests for the original collection
          const originalRequests = await window.electronAPI.request.list(context.selectedItem.id!);
          
          // Duplicate all requests for the new collection
          for (const request of originalRequests) {
            const duplicateRequest = {
              name: `${request.name} (Copy)`,
              method: request.method,
              url: request.url,
              headers: request.headers,
              body: request.body,
              queryParams: request.queryParams || [],
              auth: request.auth,
              collectionId: newCollectionId,
              folderId: undefined, // Reset folder association for simplicity
              isFavorite: false
            };
            
            await window.electronAPI.request.save(duplicateRequest);
            
            // Small delay to ensure unique IDs
            await new Promise(resolve => setTimeout(resolve, 1));
          }

          const updated = await window.electronAPI.collection.list();
          setCollections(updated);
          
          // Trigger sidebar refresh for real-time updates
          triggerSidebarRefresh();
        } catch (error) {
          console.error('Failed to duplicate collection:', error);
        }
      }
    },
    
    'delete-item': async (_: KeyboardEvent, context: ContextState) => {
      if (context.selectedItem.type === 'request') {
        try {
          await window.electronAPI.request.delete(context.selectedItem.id!);
          const updated = await window.electronAPI.collection.list();
          setCollections(updated);
          setSelectedItem({ type: null, id: null, data: null });
          
          // Trigger sidebar refresh for real-time updates
          triggerSidebarRefresh();
        } catch (error) {
          console.error('Failed to delete request:', error);
        }
      } else if (context.selectedItem.type === 'collection') {
        try {
          await window.electronAPI.collection.delete(context.selectedItem.id!);
          const updated = await window.electronAPI.collection.list();
          setCollections(updated);
          setSelectedItem({ type: null, id: null, data: null });
          
          // Trigger sidebar refresh for real-time updates
          triggerSidebarRefresh();
        } catch (error) {
          console.error('Failed to delete collection:', error);
        }
      } else if (context.selectedItem.type === 'folder') {
        try {
          await window.electronAPI.folder.delete(context.selectedItem.id!);
          const updated = await window.electronAPI.collection.list();
          setCollections(updated);
          setSelectedItem({ type: null, id: null, data: null });
          
          // Trigger sidebar refresh for real-time updates
          triggerSidebarRefresh();
        } catch (error) {
          console.error('Failed to delete folder:', error);
        }
      }
    },
    
    'send-request': () => {
      // TODO: Trigger send request action
      console.log('Send request');
    },
    
    'save-request': () => {
      // TODO: Trigger save request action
      console.log('Save request');
    },
    
    'focus-url': () => {
      const urlInput = document.querySelector('input[placeholder*="URL"]') as HTMLInputElement;
      urlInput?.focus();
    },
    
    'add-request': () => {
      setSelectedRequest(null);
      setCurrentPage('home');
    },
    
    'new-request': (_: KeyboardEvent, context: ContextState) => {
      // Clear active unsaved request ID to create a new one
      const { setActiveUnsavedRequestId } = useStore.getState();
      setActiveUnsavedRequestId(null);
      
      // Create a new empty request
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
      
      // Navigate to home page if not already there
      if (context.page !== 'home') {
        setCurrentPage('home');
      }
    },
    
    'add-folder': () => {
      // TODO: Implement new folder creation
      console.log('Add folder');
    },
    
    'new-collection': () => {
      // TODO: Implement new collection creation
      console.log('New collection');
    },
    
    'export-collection': () => {
      // TODO: Implement collection export
      console.log('Export collection');
    },
    
    'export-request': () => {
      // TODO: Implement request export
      console.log('Export request');
    },
    
    'import-collection': () => {
      // TODO: Implement collection import
      console.log('Import collection');
    }
  });

  // Handle sidebar resize
  const handleSidebarResize = useCallback((deltaX: number) => {
    if (!sidebarOpen) {
      // If sidebar is collapsed, dragging right should expand it
      if (deltaX > 0) {
        const newWidth = Math.max(140, Math.min(400, 140 + deltaX)); // Start from 140px minimum
        setSidebarOpen(true);
        setSidebarWidth(newWidth);
      }
    } else {
      // If sidebar is open, normal resize behavior
      const newWidth = Math.max(140, Math.min(400, sidebarWidth + deltaX));
      
      // If we hit the minimum width, collapse the sidebar
      if (newWidth <= 140) {
        setSidebarOpen(false);
      } else {
        setSidebarWidth(newWidth);
      }
    }
  }, [sidebarWidth, setSidebarWidth, sidebarOpen]);

  // Handle vertical resize for unsaved section
  const handleVerticalResize = useCallback((deltaY: number) => {
    const MIN_HEIGHT = 80;  // Minimum height for unsaved section (small enough to show header + some content)
    const MAX_HEIGHT = 600; // Maximum height to prevent taking all space
    
    const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, unsavedSectionHeight + deltaY));
    
    // Only update if the height actually changed
    if (newHeight !== unsavedSectionHeight) {
      setUnsavedSectionHeight(newHeight);
    }
  }, [unsavedSectionHeight, setUnsavedSectionHeight]);

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const loadData = async () => {
    try {
      const [envs, currentEnv, collections, history, settings, requests] =
        await Promise.all([
          window.electronAPI.env.list(),
          window.electronAPI.env.getCurrent(),
          window.electronAPI.collection.list(),
          window.electronAPI.request.history(100),
          window.electronAPI.settings.getAll(),
          window.electronAPI.request.list(),
        ]);

      setEnvironments(envs);
      setCurrentEnvironment(currentEnv);
      setCollections(collections);
      setRequestHistory(history);
      setSettings(settings);
      setRequests(requests);

      // Load theme settings
      if (settings.themeMode) {
        setThemeMode(settings.themeMode);
      }
      if (settings.currentThemeId) {
        setCurrentThemeId(settings.currentThemeId);
      }
      if (settings.customThemes) {
        try {
          const themes = JSON.parse(settings.customThemes);
          setCustomThemes(themes);
        } catch (e) {
          console.error('Failed to parse custom themes:', e);
        }
      }
      
      // Legacy theme support
      if (settings.theme && !settings.themeMode) {
        setThemeMode(settings.theme);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
      // Show user-friendly error - you could add a toast here
      alert('Failed to load application data. Please restart the application.');
    }
  };

  // Track performance when page changes
  useEffect(() => {
    const pageName = currentPage || "home";
    const tracker = trackFeatureLoad(`Page-${pageName}`);
    
    // Use requestAnimationFrame to wait for browser paint
    // This gives us a better measure of actual render completion
    // Double RAF ensures we capture after layout and paint
    let rafId1: number;
    let rafId2: number;
    
    rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        tracker.end();
      });
    });
    
    return () => {
      if (rafId1) cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      tracker.cancel();
    };
  }, [currentPage]);

  const renderPage = () => {
    const pageComponent = (() => {
      switch (currentPage) {
        case "home":
          return <Homepage />;
        case "collections":
          return <Collections />;
        case "environments":
          return <Environments />;
        case "history":
          return <History />;
        case "logs":
          return <Logs />;
        case "settings":
          return <Settings />;
        default:
          return <Homepage />;
      }
    })();

    return (
      <Suspense fallback={<PageLoadingSpinner />}>
        {pageComponent}
      </Suspense>
    );
  };


  return (
    <>
      <ThemeManager />
      <Toaster />
      <div className="flex h-screen flex-col bg-background">
      {/* Title Bar */}
      <TitleBar />
      
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "flex flex-col border-r bg-card",
            !isResizing && "transition-all duration-300"
          )}
          style={{ width: sidebarOpen ? `${sidebarWidth}px` : '64px' }}
        >
          {/* Header */}
          <div className={cn(
            "flex h-12 items-center border-b px-3",
            sidebarOpen ? "justify-between" : "justify-center"
          )}>
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold">Anayas</h1>
              </div>
            )}
            <button
              onClick={() => {
                if (sidebarOpen) {
                  setSidebarOpen(false);
                } else {
                  setSidebarOpen(true);
                  // Restore the saved width when reopening
                  setSidebarWidth(Math.max(140, sidebarWidth));
                }
              }}
              className="rounded-md p-2 hover:bg-accent transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 flex flex-col",
            sidebarOpen ? "p-1.5" : "p-1"
          )}>
            {/* Collections Section - Contains Unsaved + Collections */}
            {sidebarOpen && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Unsaved Requests Section - Only render if there are unsaved requests */}
                {unsavedRequests.length > 0 && (
                  <>
                    <div 
                      style={{ 
                        height: `${unsavedSectionHeight}px`, 
                        minHeight: '80px', 
                        maxHeight: '600px',
                        flexShrink: 0 
                      }}
                      className="overflow-hidden"
                    >
                      <UnsavedRequestsSection />
                    </div>

                    {/* Vertical Resize Handle - Only show if unsaved section exists */}
                    <VerticalResizeHandle
                      onResize={handleVerticalResize}
                      onResizeStart={handleResizeStart}
                      onResizeEnd={handleResizeEnd}
                    />
                  </>
                )}

                {/* Collections Section - Takes Remaining Space */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <CollectionHierarchy 
                    onRequestSelect={async (request: Request) => {
                      setCurrentPage('home');
                      // Load request data and set it as selected
                      try {
                        const requestData = await window.electronAPI.request.list(request.collectionId);
                        const fullRequest = requestData.find((r: any) => r.id === request.id);
                        if (fullRequest) {
                          setSelectedRequest({
                            id: fullRequest.id,
                            name: fullRequest.name || '',
                            method: fullRequest.method,
                            url: fullRequest.url,
                            headers: typeof fullRequest.headers === 'string' 
                              ? JSON.parse(fullRequest.headers) 
                              : (fullRequest.headers || {}),
                            body: fullRequest.body || '',
                            queryParams: [],
                            auth: { type: 'none' },
                            collectionId: fullRequest.collectionId,
                            isFavorite: fullRequest.isFavorite
                          });
                        }
                      } catch (e) {
                        console.error('Failed to load request:', e);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Resize Handle - Always visible */}
        <ResizeHandle 
          onResize={handleSidebarResize}
          onResizeStart={handleResizeStart}
          onResizeEnd={handleResizeEnd}
          className="h-full"
        />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Top Bar - Only show for non-home pages */}
          {currentPage !== 'home' && (
            <div className="flex h-10 items-center border-b bg-card px-4">
              <h2 className="text-base font-semibold capitalize">{currentPage}</h2>
            </div>
          )}

          {/* Page Content */}
          <div className={`flex-1 overflow-auto ${currentPage === 'home' ? 'p-0' : 'p-4'}`}>
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
