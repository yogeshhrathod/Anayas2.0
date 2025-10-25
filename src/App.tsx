import { useEffect, useState, useCallback } from "react";
import { useStore } from "./store/useStore";
import { EnvironmentSwitcher } from "./components/EnvironmentSwitcher";
import { TitleBar } from "./components/TitleBar";
import { ThemeManager } from "./components/ThemeManager";
import Toaster from "./components/Toaster";
import { Homepage } from "./pages/Homepage";
import { Environments } from "./pages/Environments";
import { Collections } from "./pages/Collections";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { Logs } from "./pages/Logs";
import { CollectionHierarchy } from "./components/CollectionHierarchy";
import { ResizeHandle } from "./components/ui/resize-handle";
import { KEYMAP, registerGlobalShortcuts } from "./lib/keymap";
import {
  Menu,
  Home,
  Globe,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ScrollText,
  FolderPlus,
  Zap,
} from "lucide-react";
import { cn } from "./lib/utils";

type Page =
  | "home"
  | "collections"
  | "environments"
  | "history"
  | "logs"
  | "settings";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
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
  } = useStore();

  useEffect(() => {
    // Load initial data with error handling
    loadData().catch((error) => {
      console.error('[App] Critical error during initialization:', error);
    });
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const cleanup = registerGlobalShortcuts({
      [KEYMAP.GLOBAL_SEARCH.action]: () => {
        // Global search is handled by GlobalSearch component
        const searchInput = document.querySelector('[data-global-search]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      [KEYMAP.NEW_REQUEST.action]: () => {
        setSelectedRequest(null);
        setCurrentPage('collections');
      },
      [KEYMAP.TOGGLE_SIDEBAR.action]: () => {
        if (sidebarOpen) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
          // Restore the saved width when reopening
          setSidebarWidth(Math.max(140, sidebarWidth));
        }
      }
    });

    return cleanup;
  }, [setSelectedRequest, setCurrentPage, sidebarOpen, sidebarWidth, setSidebarWidth]);

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

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const loadData = async () => {
    try {
      const [envs, currentEnv, collections, history, settings] =
        await Promise.all([
          window.electronAPI.env.list(),
          window.electronAPI.env.getCurrent(),
          window.electronAPI.collection.list(),
          window.electronAPI.request.history(100),
          window.electronAPI.settings.getAll(),
        ]);

      setEnvironments(envs);
      setCurrentEnvironment(currentEnv);
      setCollections(collections);
      setRequestHistory(history);
      setSettings(settings);

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

  const renderPage = () => {
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
  };

  const navItems = [
    { id: "home" as Page, label: "Home", icon: Home },
    { id: "collections" as Page, label: "Collections", icon: FolderPlus },
    { id: "environments" as Page, label: "Environments", icon: Globe },
    { id: "history" as Page, label: "History", icon: HistoryIcon },
    { id: "logs" as Page, label: "Logs", icon: ScrollText },
    { id: "settings" as Page, label: "Settings", icon: SettingsIcon },
  ];

  return (
    <>
      <ThemeManager />
      <Toaster />
      <div className="flex h-screen flex-col bg-background">
      {/* Title Bar */}
      <TitleBar />

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
          <div className="flex h-12 items-center justify-between border-b px-3">
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
              className="rounded-md p-1.5 hover:bg-accent transition-colors"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col p-1.5">
            {/* Collections Section - Top */}
            {sidebarOpen && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collections</span>
                  <button 
                    className="p-1 hover:bg-accent rounded transition-colors"
                    onClick={() => setCurrentPage('collections')}
                  >
                    <FolderPlus className="h-3 w-3" />
                  </button>
                </div>
                <CollectionHierarchy 
                  onRequestSelect={async (request) => {
                    setCurrentPage('home');
                    // Load request data and set it as selected
                    try {
                      const requestData = await window.electronAPI.request.list(request.collection_id);
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
                          collection_id: fullRequest.collection_id,
                          is_favorite: fullRequest.is_favorite
                        });
                      }
                    } catch (e) {
                      console.error('Failed to load request:', e);
                    }
                  }}
                />
              </div>
            )}
            
            {/* Main Navigation - Bottom */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="space-y-0.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                        currentPage === item.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
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
            <div className="flex h-12 items-center justify-between border-b bg-card px-4">
              <h2 className="text-lg font-semibold capitalize">{currentPage}</h2>
              <EnvironmentSwitcher />
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
