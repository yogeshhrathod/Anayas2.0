import { useEffect, useState } from "react";
import { useStore } from "./store/useStore";
import { EnvironmentSwitcher } from "./components/EnvironmentSwitcher";
import { TitleBar } from "./components/TitleBar";
import { ThemeManager } from "./components/ThemeManager";
import Toaster from "./components/Toaster";
import { Homepage } from "./pages/Homepage";
import { Environments } from "./pages/Environments";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { Logs } from "./pages/Logs";
import {
  Menu,
  Home,
  Globe,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ScrollText,
  FolderPlus,
} from "lucide-react";
import { cn } from "./lib/utils";

type Page =
  | "home"
  | "environments"
  | "history"
  | "logs"
  | "settings";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    currentPage,
    setCurrentPage,
    setEnvironments,
    setCurrentEnvironment,
    setRequestHistory,
    setSettings,
    setThemeMode,
    setCurrentThemeId,
    setCustomThemes,
  } = useStore();

  useEffect(() => {
    // Load initial data with error handling
    loadData().catch((error) => {
      console.error('[App] Critical error during initialization:', error);
    });
  }, []);

  const loadData = async () => {
    try {
      const [envs, currentEnv, history, settings] =
        await Promise.all([
          window.electronAPI.env.list(),
          window.electronAPI.env.getCurrent(),
          window.electronAPI.request.history(100),
          window.electronAPI.settings.getAll(),
        ]);

      setEnvironments(envs);
      setCurrentEnvironment(currentEnv);
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
            "flex flex-col border-r bg-card transition-all duration-300",
            sidebarOpen ? "w-64" : "w-16"
          )}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {sidebarOpen && (
              <h1 className="text-lg font-semibold">API Tester</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-2 hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col p-2">
            {/* Collections Section - Top */}
            {sidebarOpen && (
              <div className="mb-6">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collections</span>
                  <button className="p-1 hover:bg-accent rounded">
                    <FolderPlus className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1 rounded hover:bg-accent cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">My Collection</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded hover:bg-accent cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm">API Tests</span>
                  </div>
                </div>
                
                {/* Requests in Collections */}
                <div className="mt-2 ml-4 space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-xs">
                    <span className="text-muted-foreground">GET</span>
                    <span>Get Users</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-xs">
                    <span className="text-muted-foreground">POST</span>
                    <span>Create User</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-xs">
                    <span className="text-muted-foreground">PUT</span>
                    <span>Update User</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Navigation - Bottom */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        currentPage === item.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Top Bar */}
          <div className="flex h-16 items-center justify-between border-b bg-card px-6">
            <h2 className="text-xl font-semibold capitalize">{currentPage}</h2>
            <EnvironmentSwitcher />
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-6">{renderPage()}</div>
        </div>
      </div>
    </div>
    </>
  );
}

export default App;
