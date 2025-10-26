import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme } from '../lib/themes';
import { Request, Environment, Collection, RequestHistory } from '../types/entities';

export interface UnsavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  auth: any;
  lastModified: string;
  createdAt: string;
}

interface RequestProgress {
  step: string;
  message: string;
  progress: number;
  status?: string;
  responseTime?: number;
  size?: number;
}

interface AppState {
  // Environment
  environments: Environment[];
  currentEnvironment: Environment | null;
  setEnvironments: (environments: Environment[]) => void;
  setCurrentEnvironment: (env: Environment | null) => void;

  // Collections
  collections: Collection[];
  setCollections: (collections: Collection[]) => void;
  
  // Collection Hierarchy State
  expandedCollections: Set<number>;
  setExpandedCollections: (expanded: Set<number>) => void;

  // Selected Request
  selectedRequest: Request | null;
  setSelectedRequest: (request: Request | null) => void;

  // Selected Collection for new requests
  selectedCollectionForNewRequest: number | null;
  setSelectedCollectionForNewRequest: (collectionId: number | null) => void;

  // Selected Item for keyboard shortcuts
  selectedItem: {
    type: 'collection' | 'request' | 'folder' | null;
    id: number | null;
    data: any;
  };
  setSelectedItem: (item: { type: 'collection' | 'request' | 'folder' | null; id: number | null; data: any }) => void;

  // Enhanced context tracking for shortcuts
  focusedContext: 'sidebar' | 'editor' | 'page' | null;
  setFocusedContext: (context: 'sidebar' | 'editor' | 'page' | null) => void;

  // Request History
  requestHistory: RequestHistory[];
  setRequestHistory: (history: RequestHistory[]) => void;

  // Request Progress
  requestProgress: RequestProgress | null;
  setRequestProgress: (progress: RequestProgress | null) => void;

  // Settings
  settings: Record<string, any>;
  setSettings: (settings: Record<string, any>) => void;

  // Unsaved Requests
  unsavedRequests: UnsavedRequest[];
  setUnsavedRequests: (requests: UnsavedRequest[]) => void;
  activeUnsavedRequestId: string | null;
  setActiveUnsavedRequestId: (id: string | null) => void;

  // UI State - Theme Management
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  currentThemeId: string;
  setCurrentThemeId: (themeId: string) => void;
  customThemes: Theme[];
  setCustomThemes: (themes: Theme[]) => void;
  addCustomTheme: (theme: Theme) => void;
  removeCustomTheme: (themeId: string) => void;
  updateCustomTheme: (themeId: string, theme: Theme) => void;
  
  // Navigation
  currentPage: 'home' | 'collections' | 'environments' | 'history' | 'logs' | 'settings';
  setCurrentPage: (page: 'home' | 'collections' | 'environments' | 'history' | 'logs' | 'settings') => void;
  
  // Sidebar refresh trigger
  sidebarRefreshTrigger: number;
  triggerSidebarRefresh: () => void;
  
  // Sidebar width state
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  
  // Unsaved section height state for vertical resizing
  unsavedSectionHeight: number;
  setUnsavedSectionHeight: (height: number) => void;
  
  // Legacy theme support (for backward compatibility)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Environment
      environments: [],
      currentEnvironment: null,
      setEnvironments: (environments) => set({ environments }),
      setCurrentEnvironment: (currentEnvironment) => set({ currentEnvironment }),

      // Collections
      collections: [],
      setCollections: (collections) => set({ collections }),
      
      // Collection Hierarchy State
      expandedCollections: new Set<number>(),
      setExpandedCollections: (expandedCollections) => set({ expandedCollections }),

      // Selected Request
      selectedRequest: null,
      setSelectedRequest: (selectedRequest) => set({ selectedRequest }),

      // Selected Collection for new requests
      selectedCollectionForNewRequest: null,
      setSelectedCollectionForNewRequest: (selectedCollectionForNewRequest) => set({ selectedCollectionForNewRequest }),

      // Selected Item for keyboard shortcuts
      selectedItem: { type: null, id: null, data: null },
      setSelectedItem: (selectedItem) => {
        set({ selectedItem });
      },

      // Enhanced context tracking for shortcuts
      focusedContext: null,
      setFocusedContext: (focusedContext) => set({ focusedContext }),

      // Request History
      requestHistory: [],
      setRequestHistory: (requestHistory) => set({ requestHistory }),

      // Request Progress
      requestProgress: null,
      setRequestProgress: (requestProgress) => set({ requestProgress }),

      // Settings
      settings: {},
      setSettings: (settings) => set({ settings }),

      // Unsaved Requests
      unsavedRequests: [],
      setUnsavedRequests: (unsavedRequests) => set({ unsavedRequests }),
      activeUnsavedRequestId: null,
      setActiveUnsavedRequestId: (activeUnsavedRequestId) => set({ activeUnsavedRequestId }),

      // UI State - Theme Management
      themeMode: 'system',
      setThemeMode: (themeMode) => set({ themeMode, theme: themeMode }),
      currentThemeId: 'light',
      setCurrentThemeId: (currentThemeId) => set({ currentThemeId }),
      customThemes: [],
      setCustomThemes: (customThemes) => set({ customThemes }),
      addCustomTheme: (theme) => set((state) => ({ 
        customThemes: [...state.customThemes, theme] 
      })),
      removeCustomTheme: (themeId) => set((state) => ({ 
        customThemes: state.customThemes.filter(t => t.id !== themeId) 
      })),
      updateCustomTheme: (themeId, theme) => set((state) => ({ 
        customThemes: state.customThemes.map(t => t.id === themeId ? theme : t) 
      })),

      // Navigation
      currentPage: 'home',
      setCurrentPage: (currentPage) => set({ currentPage }),

      // Sidebar refresh trigger
      sidebarRefreshTrigger: 0,
      triggerSidebarRefresh: () => set((state) => ({ 
        sidebarRefreshTrigger: state.sidebarRefreshTrigger + 1 
      })),

      // Sidebar width state
      sidebarWidth: 200, // Default width (reduced from 256px)
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),

      // Unsaved section height state for vertical resizing
      unsavedSectionHeight: 200,
      setUnsavedSectionHeight: (unsavedSectionHeight) => set({ unsavedSectionHeight }),

      // Legacy theme support (for backward compatibility)
      theme: 'system',
      setTheme: (theme) => set({ theme, themeMode: theme }),
    }),
    {
      name: 'anayas-store',
      partialize: (state) => ({
        expandedCollections: Array.from(state.expandedCollections),
        settings: state.settings,
        themeMode: state.themeMode,
        currentThemeId: state.currentThemeId,
        customThemes: state.customThemes,
        sidebarWidth: state.sidebarWidth,
        unsavedSectionHeight: state.unsavedSectionHeight,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert array back to Set
          state.expandedCollections = new Set(state.expandedCollections as unknown as number[]);
        }
      },
    }
  )
);
