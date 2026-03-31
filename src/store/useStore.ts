import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import logger from '../lib/logger';
import { Theme } from '../lib/themes';
import {
    Collection,
    EntityId,
    Environment,
    Folder,
    Request,
    RequestHistory,
    ResponseData,
} from '../types/entities';

export interface UnsavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  auth: any;
  lastResponse?: ResponseData;
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

  // Collection-Environment selection (stores which env is selected per collection)
  collectionEnvironmentSelection: Record<number, number>;
  setCollectionEnvironmentSelection: (
    collectionId: number,
    environmentId: number
  ) => void;

  // Collections
  collections: Collection[];
  setCollections: (collections: Collection[]) => void;

  // Requests
  requests: Request[];
  setRequests: (requests: Request[]) => void;

  // Folders
  folders: Folder[];
  setFolders: (folders: Folder[]) => void;

  // Collection to edit (triggered from variable context menu)
  collectionToEditId: number | null;
  setCollectionToEditId: (id: number | null) => void;

  // Environment to edit (triggered from variable context menu)
  environmentToEditId: number | null;
  variableToFocus: string | null;
  setEnvironmentToEdit: (
    environmentId: number | null,
    variableName?: string | null
  ) => void;

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
    id: EntityId | null;
    data: any;
  };
  setSelectedItem: (item: {
    type: 'collection' | 'request' | 'folder' | null;
    id: EntityId | null;
    data: any;
  }) => void;

  // Enhanced context tracking for shortcuts
  focusedContext: 'sidebar' | 'editor' | 'page' | null;
  setFocusedContext: (context: 'sidebar' | 'editor' | 'page' | null) => void;

  // Request History
  requestHistory: RequestHistory[];
  setRequestHistory: (history: RequestHistory[]) => void;
  historyFilter: { requestId?: EntityId; method?: string; url?: string } | null;
  setHistoryFilter: (
    filter: { requestId?: EntityId; method?: string; url?: string } | null
  ) => void;

  // Request Progress
  requestProgress: RequestProgress | null;
  setRequestProgress: (progress: RequestProgress | null) => void;

  // Settings
  settings: Record<string, any>;
  setSettings: (settings: Record<string, any>) => void;

  // Global Confirmation
  confirmState: {
    isOpen: boolean;
    options: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      variant?: 'default' | 'destructive';
    } | null;
    resolve: ((value: boolean) => void) | null;
  };
  setConfirmState: (state: Partial<AppState['confirmState']>) => void;

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
  currentPage:
    | 'home'
    | 'collections'
    | 'environments'
    | 'history'
    | 'settings'
    | 'privacy';
  setCurrentPage: (
    page:
      | 'home'
      | 'collections'
      | 'environments'
      | 'history'
      | 'settings'
      | 'privacy'
  ) => void;

  // Sidebar refresh trigger
  sidebarRefreshTrigger: number;
  triggerSidebarRefresh: () => void;

  // Sidebar width state
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  // Unsaved section height state for vertical resizing
  unsavedSectionHeight: number;
  setUnsavedSectionHeight: (height: number) => void;

  // Sidebar section state (VS Code-style collapsible sections)
  expandedSidebarSections: Set<string>;
  toggleSidebarSection: (section: string) => void;
  loadSidebarState: () => Promise<void>;
  saveSidebarState: () => void;

  // Presets sidebar state
  presetsExpanded: boolean;
  setPresetsExpanded: (expanded: boolean) => void;

  // Split view state for editor
  splitViewEnabled: boolean;
  setSplitViewEnabled: (enabled: boolean) => void;

  // Legacy theme support (for backward compatibility)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // App State
  appVersion: string;
  setAppVersion: (version: string) => void;
  isWelcomeDone: boolean;
  setIsWelcomeDone: (done: boolean) => void;

  // Active Requests (Global tracking for background execution)
  loadingRequests: Record<string, boolean>;
  setLoadingRequest: (id: string, isLoading: boolean) => void;
  requestStartTimes: Record<string, number>;
  setRequestStartTime: (id: string, startTime: number | null) => void;

  // Request Navigation History (browser-style back/forward)
  requestNavHistory: Array<Request | null>;
  requestNavIndex: number;
  pushRequestNav: (request: Request | null) => void;
  goBackRequest: () => Request | null | undefined;
  goForwardRequest: () => Request | null | undefined;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Environment
      environments: [],
      currentEnvironment: null,
      setEnvironments: environments => set({ environments }),
      setCurrentEnvironment: currentEnvironment => set({ currentEnvironment }),

      // Collection-Environment selection
      collectionEnvironmentSelection: {},
      setCollectionEnvironmentSelection: (collectionId, environmentId) =>
        set(state => ({
          collectionEnvironmentSelection: {
            ...state.collectionEnvironmentSelection,
            [collectionId]: environmentId,
          },
        })),

      // Collections
      collections: [],
      setCollections: collections => set({ collections }),

      requests: [],
      setRequests: requests => set({ requests }),

      // Folders
      folders: [],
      setFolders: folders => set({ folders }),

      // Collection to edit (triggered from variable context menu)
      collectionToEditId: null,
      setCollectionToEditId: collectionToEditId => set({ collectionToEditId }),

      // Environment to edit (triggered from variable context menu)
      environmentToEditId: null,
      variableToFocus: null,
      setEnvironmentToEdit: (environmentId, variableName) => {
        set({
          environmentToEditId: environmentId,
          variableToFocus: variableName || null,
        });
      },

      // Collection Hierarchy State
      expandedCollections: new Set<number>(),
      setExpandedCollections: expandedCollections =>
        set({ expandedCollections }),

      // Selected Request
      selectedRequest: null,
      setSelectedRequest: selectedRequest => {
        set({ selectedRequest });
        if (selectedRequest) {
          get().pushRequestNav(selectedRequest);
        }
      },

      // Selected Collection for new requests
      selectedCollectionForNewRequest: null,
      setSelectedCollectionForNewRequest: selectedCollectionForNewRequest =>
        set({ selectedCollectionForNewRequest }),

      // Selected Item for keyboard shortcuts
      selectedItem: { type: null, id: null, data: null },
      setSelectedItem: selectedItem => {
        set({ selectedItem });
      },

      // Enhanced context tracking for shortcuts
      focusedContext: null,
      setFocusedContext: focusedContext => set({ focusedContext }),

      // Request History
      requestHistory: [],
      setRequestHistory: requestHistory => set({ requestHistory }),
      historyFilter: null,
      setHistoryFilter: historyFilter => set({ historyFilter }),

      // Request Progress
      requestProgress: null,
      setRequestProgress: requestProgress => set({ requestProgress }),

      // Settings
      settings: {},
      setSettings: settings => set({ settings }),

      // Global Confirmation
      confirmState: {
        isOpen: false,
        options: null,
        resolve: null,
      },
      setConfirmState: state => set(prev => ({ 
        confirmState: { ...prev.confirmState, ...state } 
      })),

      // Unsaved Requests
      unsavedRequests: [],
      setUnsavedRequests: unsavedRequests => set({ unsavedRequests }),
      activeUnsavedRequestId: null,
      setActiveUnsavedRequestId: activeUnsavedRequestId =>
        set({ activeUnsavedRequestId }),

      // UI State - Theme Management
      themeMode: 'system',
      setThemeMode: themeMode => set({ themeMode, theme: themeMode }),
      currentThemeId: 'light',
      setCurrentThemeId: currentThemeId => set({ currentThemeId }),
      customThemes: [],
      setCustomThemes: customThemes => set({ customThemes }),
      addCustomTheme: theme =>
        set(state => ({
          customThemes: [...state.customThemes, theme],
        })),
      removeCustomTheme: themeId =>
        set(state => ({
          customThemes: state.customThemes.filter(t => t.id !== themeId),
        })),
      updateCustomTheme: (themeId, theme) =>
        set(state => ({
          customThemes: state.customThemes.map(t =>
            t.id === themeId ? theme : t
          ),
        })),

      // Navigation
      currentPage: 'home',
      setCurrentPage: currentPage => set({ currentPage }),

      // Sidebar refresh trigger
      sidebarRefreshTrigger: 0,
      triggerSidebarRefresh: () =>
        set(state => ({
          sidebarRefreshTrigger: state.sidebarRefreshTrigger + 1,
        })),

      // Sidebar width state
      sidebarWidth: 200, // Default width (reduced from 256px)
      setSidebarWidth: sidebarWidth => set({ sidebarWidth }),

      // Unsaved section height state for vertical resizing
      unsavedSectionHeight: 200,
      setUnsavedSectionHeight: unsavedSectionHeight =>
        set({ unsavedSectionHeight }),

      // Sidebar section state (VS Code-style collapsible sections)
      expandedSidebarSections: new Set<string>(['collections']), // Default: Collections expanded
      toggleSidebarSection: (section: string) =>
        set(state => {
          const newExpanded = new Set(state.expandedSidebarSections);
          if (newExpanded.has(section)) {
            newExpanded.delete(section);
          } else {
            newExpanded.add(section);
          }
          // Save to database after updating
          setTimeout(() => {
            window.electronAPI.sidebar.setState({
              expandedSections: Array.from(newExpanded),
              sectionOrder: ['unsaved', 'collections'],
            });
          }, 0);
          return { expandedSidebarSections: newExpanded };
        }),
      loadSidebarState: async () => {
        try {
          const sidebarState = await window.electronAPI.sidebar.getState();
          set({
            expandedSidebarSections: new Set(
              sidebarState.expandedSections || ['collections']
            ),
          });
        } catch (error) {
          logger.error('Failed to load sidebar state', { error });
          // Use default state on error
          set({ expandedSidebarSections: new Set(['collections']) });
        }
      },
      saveSidebarState: () => {
        const state = useStore.getState();
        window.electronAPI.sidebar
          .setState({
            expandedSections: Array.from(state.expandedSidebarSections),
            sectionOrder: ['unsaved', 'collections'],
          })
          .catch((error: unknown) => {
            logger.error('Failed to save sidebar state', { error });
          });
      },

      // Presets sidebar state
      presetsExpanded: false,
      setPresetsExpanded: presetsExpanded => set({ presetsExpanded }),

      // Split view state for editor
      splitViewEnabled: true, // Default enabled
      setSplitViewEnabled: splitViewEnabled => set({ splitViewEnabled }),

      // Legacy theme support (for backward compatibility)
      theme: 'system',
      setTheme: theme => set({ theme, themeMode: theme }),

      // App State
      appVersion: '',
      setAppVersion: appVersion => set({ appVersion }),
      isWelcomeDone: typeof localStorage !== 'undefined' ? localStorage.getItem('luna_welcome_seen') === 'true' : false,
      setIsWelcomeDone: isWelcomeDone => set({ isWelcomeDone }),

      // Active Requests
      loadingRequests: {},
      setLoadingRequest: (id, isLoading) =>
        set(state => {
          const newLoading = { ...state.loadingRequests };
          if (isLoading) {
            newLoading[id] = true;
          } else {
            delete newLoading[id];
          }
          return { loadingRequests: newLoading };
        }),
      requestStartTimes: {},
      setRequestStartTime: (id, startTime) =>
        set(state => {
          const newStartTimes = { ...state.requestStartTimes };
          if (startTime === null) {
            delete newStartTimes[id];
          } else {
            newStartTimes[id] = startTime;
          }
          return { requestStartTimes: newStartTimes };
        }),

      // Request Navigation History (browser-style back/forward)
      requestNavHistory: [],
      requestNavIndex: -1,
      pushRequestNav: (request) =>
        set(state => {
          // If we're in the middle of history, truncate forward entries
          const history = state.requestNavHistory.slice(0, state.requestNavIndex + 1);
          // Don't push duplicates of the current entry
          const current = history[history.length - 1];
          if (current?.id === request?.id && current?.id !== undefined) {
            return {};
          }
          // Limit history to 50 entries
          const newHistory = [...history, request].slice(-50);
          return {
            requestNavHistory: newHistory,
            requestNavIndex: newHistory.length - 1,
          };
        }),
      goBackRequest: () => {
        const state = get();
        if (state.requestNavIndex > 0) {
          const newIndex = state.requestNavIndex - 1;
          const request = state.requestNavHistory[newIndex];
          set({ requestNavIndex: newIndex, selectedRequest: request });
          return request;
        }
        return undefined;
      },
      goForwardRequest: () => {
        const state = get();
        if (state.requestNavIndex < state.requestNavHistory.length - 1) {
          const newIndex = state.requestNavIndex + 1;
          const request = state.requestNavHistory[newIndex];
          set({ requestNavIndex: newIndex, selectedRequest: request });
          return request;
        }
        return undefined;
      },
      canGoBack: () => {
        const state = get();
        return state.requestNavIndex > 0;
      },
      canGoForward: () => {
        const state = get();
        return state.requestNavIndex < state.requestNavHistory.length - 1;
      },
    }),
    {
      name: 'luna-store',
      partialize: state => ({
        expandedCollections: Array.from(state.expandedCollections),
        settings: state.settings,
        folders: state.folders,
        themeMode: state.themeMode,
        currentThemeId: state.currentThemeId,
        customThemes: state.customThemes,
        sidebarWidth: state.sidebarWidth,
        unsavedSectionHeight: state.unsavedSectionHeight,
        presetsExpanded: state.presetsExpanded,
        selectedRequest: state.selectedRequest,
        activeUnsavedRequestId: state.activeUnsavedRequestId,
        currentPage: state.currentPage,
        isWelcomeDone: state.isWelcomeDone,
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          // Convert array back to Set safely
          const expandedCollections = state.expandedCollections as any;
          if (Array.isArray(expandedCollections)) {
            state.expandedCollections = new Set(expandedCollections);
          } else {
            state.expandedCollections = new Set();
          }
        }
      },
    }
  )
);
