import { create } from 'zustand';
import { Theme } from '../lib/themes';

interface Environment {
  id?: number;
  name: string;
  displayName: string;
  variables: Record<string, string>;
  isDefault?: boolean;
  lastUsed?: string;
  createdAt?: string;
}

interface RequestHistory {
  id?: number;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  responseBody?: string;
  headers?: string;
  createdAt?: string;
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

  // Request History
  requestHistory: RequestHistory[];
  setRequestHistory: (history: RequestHistory[]) => void;

  // Request Progress
  requestProgress: RequestProgress | null;
  setRequestProgress: (progress: RequestProgress | null) => void;

  // Settings
  settings: Record<string, any>;
  setSettings: (settings: Record<string, any>) => void;

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
  currentPage: 'home' | 'environments' | 'history' | 'logs' | 'settings';
  setCurrentPage: (page: 'home' | 'environments' | 'history' | 'logs' | 'settings') => void;
  
  // Legacy theme support (for backward compatibility)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useStore = create<AppState>((set) => ({
  // Environment
  environments: [],
  currentEnvironment: null,
  setEnvironments: (environments) => set({ environments }),
  setCurrentEnvironment: (currentEnvironment) => set({ currentEnvironment }),

  // Request History
  requestHistory: [],
  setRequestHistory: (requestHistory) => set({ requestHistory }),

  // Request Progress
  requestProgress: null,
  setRequestProgress: (requestProgress) => set({ requestProgress }),

  // Settings
  settings: {},
  setSettings: (settings) => set({ settings }),

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

  // Legacy theme support (for backward compatibility)
  theme: 'system',
  setTheme: (theme) => set({ theme, themeMode: theme }),
}));
