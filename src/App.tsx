import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Menu, Trash2 } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { CollectionHierarchy } from './components/CollectionHierarchy';
import { Logo } from './components/Logo';
import { NavigationBar } from './components/NavigationBar';
import { ProductTour } from './components/ProductTour';
import { SplashScreen } from './components/SplashScreen';
import { ThemeManager } from './components/ThemeManager';
import { TitleBar } from './components/TitleBar';
import Toaster from './components/Toaster';
import { UnsavedRequestsSection } from './components/collection/UnsavedRequestsSection';
import { CollectionEditDialog } from './components/dialogs/CollectionEditDialog';
import { SaveRequestAsDialog } from './components/dialogs/SaveRequestAsDialog';
import { ImportCollectionDialog } from './components/import/ImportCollectionDialog';
import { CollapsibleSection } from './components/sidebar/CollapsibleSection';
import { PageLoadingSpinner } from './components/ui/PageLoadingSpinner';
import { Button } from './components/ui/button';
import { Dialog } from './components/ui/dialog';
import { ResizeHandle } from './components/ui/resize-handle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './components/ui/tooltip';
import { useSessionRecovery } from './hooks/useSessionRecovery';
import { useShortcuts } from './hooks/useShortcuts';
import { useToastNotifications } from './hooks/useToastNotifications';
import { trackFeatureLoad } from './lib/performance';
import { ContextState } from './lib/shortcuts/types';
import { cn } from './lib/utils';
import { useStore } from './store/useStore';
import { EntityId, Request } from './types/entities';
// Lazy load pages for better performance
// Pages use named exports, so we need to map them to default exports for lazy()
const Homepage = lazy(() =>
  import('./pages/Homepage').then(module => ({ default: module.Homepage }))
);
const Environments = lazy(() =>
  import('./pages/Environments').then(module => ({
    default: module.Environments,
  }))
);
const Collections = lazy(() =>
  import('./pages/Collections').then(module => ({
    default: module.Collections,
  }))
);
const History = lazy(() =>
  import('./pages/History').then(module => ({ default: module.History }))
);
const Settings = lazy(() =>
  import('./pages/Settings').then(module => ({ default: module.Settings }))
);
const Privacy = lazy(() =>
  import('./pages/Privacy').then(module => ({ default: module.Privacy }))
);

// Static import for instant onboarding (no delay)
import OnboardingFlow from './components/OnboardingFlow';

import { FontProvider } from './components/providers/FontProvider';

function App() {
  // Session recovery - load unsaved requests on startup
  useSessionRecovery();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isResizing, setIsResizing] = useState(false);

  const [_requests, setRequests] = useState<any[]>([]);
  const [isAppReady, setIsAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const currentPage = useStore(state => state.currentPage);
  const setCurrentPage = useStore(state => state.setCurrentPage);
  const setEnvironments = useStore(state => state.setEnvironments);
  const setCurrentEnvironment = useStore(state => state.setCurrentEnvironment);
  const collections = useStore(state => state.collections);
  const setCollections = useStore(state => state.setCollections);
  const setRequestHistory = useStore(state => state.setRequestHistory);
  const selectedRequest = useStore(state => state.selectedRequest);
  const setSelectedRequest = useStore(state => state.setSelectedRequest);
  const setSettings = useStore(state => state.setSettings);
  const setThemeMode = useStore(state => state.setThemeMode);
  const setCurrentThemeId = useStore(state => state.setCurrentThemeId);
  const setCustomThemes = useStore(state => state.setCustomThemes);
  const sidebarWidth = useStore(state => state.sidebarWidth);
  const setSidebarWidth = useStore(state => state.setSidebarWidth);
  const unsavedRequests = useStore(state => state.unsavedRequests);
  const setSelectedItem = useStore(state => state.setSelectedItem);
  const triggerSidebarRefresh = useStore(state => state.triggerSidebarRefresh);
  const expandedSidebarSections = useStore(state => state.expandedSidebarSections);
  const toggleSidebarSection = useStore(state => state.toggleSidebarSection);
  const loadSidebarState = useStore(state => state.loadSidebarState);
  const setUnsavedRequests = useStore(state => state.setUnsavedRequests);
  const setActiveUnsavedRequestId = useStore(state => state.setActiveUnsavedRequestId);
  const splitViewEnabled = useStore(state => state.splitViewEnabled);
  const setSplitViewEnabled = useStore(state => state.setSplitViewEnabled);
  const setAppVersion = useStore(state => state.setAppVersion);
  const appVersion = useStore(state => state.appVersion);
  const isWelcomeDone = useStore(state => state.isWelcomeDone);
  const setIsWelcomeDoneStore = useStore(state => state.setIsWelcomeDone);

  const { showSuccess, showError } = useToastNotifications();
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  // Dialog States
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showEditCollectionDialog, setShowEditCollectionDialog] =
    useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<any>(null);
  const [requestToSaveAs, setRequestToSaveAs] = useState<any>(null);

  // Helper to get full collection data for export
  const getFullCollectionData = async (collectionId: EntityId) => {
    const collections = await window.electronAPI.collection.list();
    const collection = collections.find((c: any) => c.id === collectionId);
    if (!collection) throw new Error('Collection not found');

    const folders = await window.electronAPI.folder.list(
      collectionId as number
    );
    const requests = await window.electronAPI.request.list(
      collectionId as number
    );

    // Structure as a simple clean JSON export
    return {
      collection,
      folders,
      requests,
      exportedAt: new Date().toISOString(),
      type: 'luna-collection-export',
      version: appVersion || '1.0',
    };
  };

  const handleClearAllUnsaved = async () => {
    try {
      const result = await window.electronAPI.unsavedRequest.clear();

      if (result && !result.success) {
        throw new Error(result.error || 'Failed to clear unsaved requests');
      }

      // Clear active unsaved request
      setActiveUnsavedRequestId(null);
      setSelectedRequest(null);

      // Reload unsaved requests from the database
      const updatedUnsaved = await window.electronAPI.unsavedRequest.getAll();
      setUnsavedRequests(updatedUnsaved);

      // Show success message
      showSuccess('All unsaved requests cleared');

      // Trigger sidebar refresh
      triggerSidebarRefresh();

      // Close dialog
      setShowClearAllDialog(false);
    } catch (error: any) {
      console.error('Failed to clear unsaved requests:', error);
      showError(
        'Failed to clear',
        error.message || 'Failed to clear unsaved requests'
      );
    }
  };

  useEffect(() => {
    // Load initial data with error handling
    loadData().catch(error => {
      console.error('[App] Critical error during initialization:', error);
    });
  }, []);

  // Load sidebar state on mount
  useEffect(() => {
    loadSidebarState().catch(error => {
      console.error('[App] Failed to load sidebar state:', error);
    });
  }, [loadSidebarState]);

  // Single centralized shortcut handler
  useShortcuts({
    'global-search': () => {
      const input = document.querySelector(
        '[data-global-search]'
      ) as HTMLInputElement;
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
        const collection = collections.find(
          (c: any) => c.id === context.selectedItem.id
        );
        if (collection) {
          setCollectionToEdit(collection);
          setShowEditCollectionDialog(true);
        }
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
            isFavorite: 0,
          };

          // Use saveAfter to insert the duplicate right after the original request
          await window.electronAPI.request.saveAfter(
            duplicate,
            context.selectedItem.id as any
          );

          // Refresh both collections and requests
          const [updatedCollections, updatedRequests] = await Promise.all([
            window.electronAPI.collection.list(),
            window.electronAPI.request.list(),
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
            isFavorite: 0,
          };

          const result = await window.electronAPI.collection.save(duplicate);
          if (!result.success) {
            console.error('Failed to create duplicate collection');
            return;
          }

          const newCollectionId = result.id;

          // Get all requests for the original collection
          const originalRequests = await window.electronAPI.request.list(
            context.selectedItem.id as number
          );

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
              isFavorite: 0,
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
          await window.electronAPI.request.delete(
            context.selectedItem.id as any
          );
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
          await window.electronAPI.collection.delete(
            context.selectedItem.id as number
          );
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
          await window.electronAPI.folder.delete(
            context.selectedItem.id as number
          );
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
      const urlInput = document.querySelector(
        'input[placeholder*="URL"]'
      ) as HTMLInputElement;
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

    'export-collection': async (_: KeyboardEvent, context: ContextState) => {
      // Export currently selected collection OR ask user to select?
      // For now, let's assume we export the selected one from sidebar context
      if (
        context.selectedItem.type === 'collection' &&
        context.selectedItem.id
      ) {
        try {
          const data = await getFullCollectionData(context.selectedItem.id);
          const fileName = `${data.collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;

          // Show save dialog
          const result = await window.electronAPI.file.saveFile(
            fileName,
            JSON.stringify(data, null, 2)
          );

          if (result.success) {
            showSuccess('Collection exported successfully');
          }
        } catch (error: any) {
          showError('Failed to export collection', error.message);
        }
      } else {
        showError(
          'Selection Required',
          'Please select a collection in the sidebar to export.'
        );
      }
    },

    'export-request': async (_: KeyboardEvent, context: ContextState) => {
      const reqToExport =
        context.selectedItem.type === 'request'
          ? context.selectedItem.data
          : selectedRequest;

      if (reqToExport) {
        try {
          const fileName = `${reqToExport.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_request.json`;
          const result = await window.electronAPI.file.saveFile(
            fileName,
            JSON.stringify(reqToExport, null, 2)
          );
          if (result.success) {
            showSuccess('Request exported successfully');
          }
        } catch (error: any) {
          showError('Failed to export request', error.message);
        }
      } else {
        showError('No Request', 'Please select or open a request to export.');
      }
    },

    'import-collection': () => {
      setShowImportDialog(true);
    },

    'save-request-as': () => {
      if (selectedRequest) {
        setRequestToSaveAs(selectedRequest);
        setShowSaveAsDialog(true);
      } else {
        showError('No Request', 'Open a request to save it.');
      }
    },

    'close-tab': () => {
      // Close the current request tab
      setSelectedRequest(null);
      setActiveUnsavedRequestId(null);
    },

    'toggle-split-view': () => {
      // Toggle split view for request/response
      setSplitViewEnabled(!splitViewEnabled);
      showSuccess(
        splitViewEnabled ? 'Split view disabled' : 'Split view enabled'
      );
    },
  });

  // Handle sidebar resize
  const handleSidebarResize = useCallback(
    (deltaX: number) => {
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
    },
    [sidebarWidth, setSidebarWidth, sidebarOpen]
  );

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const loadData = async () => {
    try {
      const [
        envs,
        currentEnv,
        collections,
        history,
        settings,
        requests,
        version,
      ] = await Promise.all([
        window.electronAPI.env.list(),
        window.electronAPI.env.getCurrent(),
        window.electronAPI.collection.list(),
        window.electronAPI.request.history(100),
        window.electronAPI.settings.getAll(),
        window.electronAPI.request.list(),
        window.electronAPI.app.getVersion(),
      ]);

      setEnvironments(envs);
      setCurrentEnvironment(currentEnv);
      setCollections(collections);
      setRequestHistory(history);
      // DB settings are the source of truth - they override any cached localStorage values
      setSettings(settings);
      setRequests(requests);
      setAppVersion(version);

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

      // Mark app as ready once all data is loaded
      setIsAppReady(true);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Show user-friendly error - you could add a toast here
      alert('Failed to load application data. Please restart the application.');
      setIsAppReady(true); // Still set to ready so user can at least see the app/error
    }
  };

  // Track performance when page changes
  useEffect(() => {
    const pageName = currentPage || 'home';
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
        case 'home':
          return <Homepage />;
        case 'collections':
          return <Collections />;
        case 'environments':
          return <Environments />;
        case 'history':
          return <History />;
        case 'settings':
          return <Settings />;
        case 'privacy':
          return <Privacy />;
        default:
          return <Homepage />;
      }
    })();

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex-1 flex flex-col min-h-0 relative"
        >
          <Suspense fallback={<PageLoadingSpinner />}>{pageComponent}</Suspense>
        </motion.div>
      </AnimatePresence>
    );
  };

  const handleSplashFinish = useCallback(() => {
    console.log('[App] Splash screen finished, transitioning to main UI');
    setShowSplash(false);
  }, []);

  return (
    <FontProvider>
      {/* Welcome Experience - Lazy loaded so zero impact for existing users */}
      {!isWelcomeDone && (
        <Suspense fallback={null}>
          <OnboardingFlow
            onDismiss={() => {
              console.log('[App] Welcome flow dismissed');
              setIsWelcomeDoneStore(true);
              // Explicitly set localStorage here as well for backward compatibility
              localStorage.setItem('luna_welcome_seen', 'true');
              setShowSplash(false); // Skip splash screen after onboarding to prevent "flash"
            }}
          />
        </Suspense>
      )}

      {/* Splash Screen - Waits for welcome flow if present, but also shows once after if needed */}
      {isWelcomeDone && showSplash && (
        <SplashScreen
          isLoading={!isAppReady}
          onFinish={handleSplashFinish}
        />
      )}
      <ThemeManager />
      <Toaster />
      {!showSplash && <ProductTour />}
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
              'app-sidebar flex flex-col border-r bg-card/60 backdrop-blur-xl min-h-0 z-10',
              !isResizing && 'transition-all duration-300'
            )}
            data-testid="app-sidebar"
            style={{ width: sidebarOpen ? `${sidebarWidth}px` : '64px' }}
          >
            {/* Header */}
            <div
              className={cn(
                'flex h-12 items-center border-b px-3',
                sidebarOpen ? 'justify-between' : 'justify-center'
              )}
            >
              {sidebarOpen && (
                <Logo size={24} showText={true} className="text-lg" />
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
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav
              className={cn(
                'flex-1 flex flex-col min-h-0',
                sidebarOpen ? 'p-1.5' : 'p-1'
              )}
              aria-label="Sidebar navigation"
            >
              {/* Sidebar Sections - VS Code-style collapsible sections */}
              {sidebarOpen && (
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {/* Unsaved Requests Section - Only show if there are unsaved requests */}
                  {unsavedRequests.length > 0 && (
                    <CollapsibleSection
                      id="unsaved"
                      title="Unsaved Requests"
                      isExpanded={expandedSidebarSections.has('unsaved')}
                      onToggle={() => toggleSidebarSection('unsaved')}
                      headerActions={
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                onClick={e => {
                                  e.stopPropagation();
                                  setShowClearAllDialog(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">
                                  Clear all unsaved requests
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Clear all unsaved requests</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      }
                    >
                      <UnsavedRequestsSection />
                    </CollapsibleSection>
                  )}

                  {/* Collections Section */}
                  <CollapsibleSection
                    id="collections"
                    title="Collections"
                    isExpanded={expandedSidebarSections.has('collections')}
                    onToggle={() => toggleSidebarSection('collections')}
                  >
                    <div
                      className="p-1"
                      data-testid="sidebar-collections-scroll-container"
                    >
                      <CollectionHierarchy
                        onRequestSelect={async (request: Request) => {
                          setCurrentPage('home');
                          // Load request data and set it as selected
                          try {
                            const requestData =
                              await window.electronAPI.request.list(
                                request.collectionId
                              );
                            const fullRequest = requestData.find(
                              (r: any) => r.id === request.id
                            );
                            if (fullRequest) {
                              setSelectedRequest({
                                id: fullRequest.id,
                                name: fullRequest.name || '',
                                method: fullRequest.method,
                                url: fullRequest.url,
                                headers:
                                  typeof fullRequest.headers === 'string'
                                    ? JSON.parse(fullRequest.headers)
                                    : fullRequest.headers || {},
                                body: fullRequest.body || '',
                                queryParams: [],
                                auth: { type: 'none' },
                                collectionId: fullRequest.collectionId,
                                isFavorite: fullRequest.isFavorite,
                                lastResponse: fullRequest.lastResponse,
                              });
                            }
                          } catch (e) {
                            console.error('Failed to load request:', e);
                          }
                        }}
                      />
                    </div>
                  </CollapsibleSection>
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
          <div className="flex flex-1 flex-col min-w-0">
            {/* Top Bar - Only show for non-home pages */}
            {currentPage !== 'home' && (
              <div className="flex h-12 items-center border-b bg-card px-4 gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted"
                  onClick={() => setCurrentPage('home')}
                >
                  <ArrowLeft className="h-4 w-4 text-foreground/80" />
                </Button>
                <div className="h-4 w-px bg-border/60 mx-1" />
                <h2 className="text-base font-semibold capitalize tracking-tight font-display">
                  {currentPage}
                </h2>
              </div>
            )}

            {/* Page Content */}
            <div
              className={cn(
                'flex-1 min-h-0',
                currentPage === 'home'
                  ? 'p-0 overflow-hidden flex flex-col' // Home page: flex container for proper height propagation
                  : 'p-4 overflow-auto' // Other pages can scroll
              )}
            >
              {renderPage()}
            </div>
          </div>
        </div>

        {/* Clear All Unsaved Requests Confirmation Dialog */}
        <Dialog
          open={showClearAllDialog}
          onOpenChange={setShowClearAllDialog}
          title="Clear All Unsaved Requests"
          description={`Are you sure you want to clear all ${unsavedRequests.length} unsaved request${unsavedRequests.length !== 1 ? 's' : ''}? This action cannot be undone.`}
          maxWidth="sm"
        >
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowClearAllDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAllUnsaved}>
              Clear All
            </Button>
          </div>
        </Dialog>

        {/* Feature Dialogs */}
        {showEditCollectionDialog && collectionToEdit && (
          <CollectionEditDialog
            open={showEditCollectionDialog}
            onOpenChange={setShowEditCollectionDialog}
            collection={collectionToEdit}
            onSuccess={() => {
              // Refresh collections
              window.electronAPI.collection.list().then(setCollections);
            }}
          />
        )}

        {showSaveAsDialog && requestToSaveAs && (
          <SaveRequestAsDialog
            open={showSaveAsDialog}
            onOpenChange={setShowSaveAsDialog}
            request={requestToSaveAs}
            onSuccess={() => {
              // Refresh data
              triggerSidebarRefresh();
            }}
          />
        )}

        <ImportCollectionDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onSuccess={() => {
            triggerSidebarRefresh();
          }}
        />
      </div>
    </FontProvider>
  );
}

export default App;
