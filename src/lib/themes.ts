// Theme configuration system with support for custom addon themes

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Enhanced semantic colors
  success?: string;
  successForeground?: string;
  warning?: string;
  warningForeground?: string;
  info?: string;
  infoForeground?: string;
}

export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: ThemeColors;
  isCustom?: boolean;
  createdAt?: string;
}

// Built-in light theme - Enhanced with better contrast and modern colors
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  type: 'light',
  colors: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',
    primary: '221.2 83.2% 53.3%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    secondaryForeground: '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    accent: '210 40% 96.1%',
    accentForeground: '222.2 47.4% 11.2%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '210 40% 98%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '221.2 83.2% 53.3%',
    // Enhanced semantic colors
    success: '142 76% 36%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    info: '199 89% 48%',
    infoForeground: '0 0% 100%',
  },
};

// Built-in dark theme - Enhanced with better contrast and modern colors
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  type: 'dark',
  colors: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    popover: '222.2 84% 4.9%',
    popoverForeground: '210 40% 98%',
    primary: '217.2 91.2% 59.8%',
    primaryForeground: '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    secondaryForeground: '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    accent: '217.2 32.6% 17.5%',
    accentForeground: '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '210 40% 98%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '224.3 76.3% 48%',
    // Enhanced semantic colors
    success: '142 76% 36%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    info: '199 89% 48%',
    infoForeground: '0 0% 100%',
  },
};

// Additional preset themes - Enhanced with modern color palettes
export const oceanTheme: Theme = {
  id: 'ocean',
  name: 'Ocean',
  type: 'dark',
  colors: {
    background: '200 50% 8%',
    foreground: '180 100% 95%',
    card: '200 45% 10%',
    cardForeground: '180 100% 95%',
    popover: '200 45% 10%',
    popoverForeground: '180 100% 95%',
    primary: '190 95% 45%',
    primaryForeground: '200 50% 5%',
    secondary: '200 30% 20%',
    secondaryForeground: '180 100% 95%',
    muted: '200 30% 20%',
    mutedForeground: '180 20% 70%',
    accent: '180 80% 35%',
    accentForeground: '180 100% 95%',
    destructive: '0 70% 50%',
    destructiveForeground: '0 0% 100%',
    border: '200 30% 20%',
    input: '200 30% 20%',
    ring: '190 95% 45%',
    // Enhanced semantic colors
    success: '142 76% 36%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    info: '199 89% 48%',
    infoForeground: '0 0% 100%',
  },
};

export const forestTheme: Theme = {
  id: 'forest',
  name: 'Forest',
  type: 'dark',
  colors: {
    background: '140 30% 10%',
    foreground: '120 20% 95%',
    card: '140 25% 12%',
    cardForeground: '120 20% 95%',
    popover: '140 25% 12%',
    popoverForeground: '120 20% 95%',
    primary: '145 65% 45%',
    primaryForeground: '140 30% 5%',
    secondary: '140 20% 20%',
    secondaryForeground: '120 20% 95%',
    muted: '140 20% 20%',
    mutedForeground: '120 10% 70%',
    accent: '160 60% 35%',
    accentForeground: '120 20% 95%',
    destructive: '0 70% 50%',
    destructiveForeground: '0 0% 100%',
    border: '140 20% 20%',
    input: '140 20% 20%',
    ring: '145 65% 45%',
    // Enhanced semantic colors
    success: '142 76% 36%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    info: '199 89% 48%',
    infoForeground: '0 0% 100%',
  },
};

export const sunsetTheme: Theme = {
  id: 'sunset',
  name: 'Sunset',
  type: 'light',
  colors: {
    background: '30 100% 98%',
    foreground: '20 80% 15%',
    card: '30 100% 96%',
    cardForeground: '20 80% 15%',
    popover: '30 100% 96%',
    popoverForeground: '20 80% 15%',
    primary: '15 90% 55%',
    primaryForeground: '0 0% 100%',
    secondary: '40 60% 90%',
    secondaryForeground: '20 80% 15%',
    muted: '40 60% 90%',
    mutedForeground: '20 40% 40%',
    accent: '350 85% 65%',
    accentForeground: '0 0% 100%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',
    border: '40 40% 85%',
    input: '40 40% 85%',
    ring: '15 90% 55%',
    // Enhanced semantic colors
    success: '142 76% 36%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    info: '199 89% 48%',
    infoForeground: '0 0% 100%',
  },
};

export const midnightTheme: Theme = {
  id: 'midnight',
  name: 'Midnight',
  type: 'dark',
  colors: {
    background: '240 30% 8%',
    foreground: '240 10% 95%',
    card: '240 25% 10%',
    cardForeground: '240 10% 95%',
    popover: '240 25% 10%',
    popoverForeground: '240 10% 95%',
    primary: '250 80% 60%',
    primaryForeground: '0 0% 100%',
    secondary: '240 20% 18%',
    secondaryForeground: '240 10% 95%',
    muted: '240 20% 18%',
    mutedForeground: '240 10% 70%',
    accent: '270 70% 55%',
    accentForeground: '0 0% 100%',
    destructive: '0 70% 50%',
    destructiveForeground: '0 0% 100%',
    border: '240 20% 18%',
    input: '240 20% 18%',
    ring: '250 80% 60%',
    // Enhanced semantic colors
    success: '142 76% 36%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    info: '199 89% 48%',
    infoForeground: '0 0% 100%',
  },
};

// Modern themes with enhanced color palettes
export const cyberpunkTheme: Theme = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  type: 'dark',
  colors: {
    background: '280 50% 8%',
    foreground: '300 20% 95%',
    card: '280 45% 10%',
    cardForeground: '300 20% 95%',
    popover: '280 45% 10%',
    popoverForeground: '300 20% 95%',
    primary: '300 100% 60%',
    primaryForeground: '280 50% 5%',
    secondary: '280 30% 20%',
    secondaryForeground: '300 20% 95%',
    muted: '280 30% 20%',
    mutedForeground: '300 10% 70%',
    accent: '320 80% 50%',
    accentForeground: '0 0% 100%',
    destructive: '0 70% 50%',
    destructiveForeground: '0 0% 100%',
    border: '280 30% 20%',
    input: '280 30% 20%',
    ring: '300 100% 60%',
    // Enhanced semantic colors
    success: '120 100% 40%',
    successForeground: '0 0% 100%',
    warning: '60 100% 50%',
    warningForeground: '0 0% 100%',
    info: '200 100% 50%',
    infoForeground: '0 0% 100%',
  },
};

export const nordTheme: Theme = {
  id: 'nord',
  name: 'Nord',
  type: 'dark',
  colors: {
    background: '220 16% 8%',
    foreground: '220 13% 88%',
    card: '220 16% 10%',
    cardForeground: '220 13% 88%',
    popover: '220 16% 10%',
    popoverForeground: '220 13% 88%',
    primary: '213 32% 52%',
    primaryForeground: '220 13% 88%',
    secondary: '220 16% 15%',
    secondaryForeground: '220 13% 88%',
    muted: '220 16% 15%',
    mutedForeground: '220 9% 46%',
    accent: '179 25% 65%',
    accentForeground: '220 16% 8%',
    destructive: '354 42% 56%',
    destructiveForeground: '220 13% 88%',
    border: '220 16% 15%',
    input: '220 16% 15%',
    ring: '213 32% 52%',
    // Enhanced semantic colors
    success: '92 28% 65%',
    successForeground: '220 16% 8%',
    warning: '40 71% 73%',
    warningForeground: '220 16% 8%',
    info: '213 32% 52%',
    infoForeground: '220 13% 88%',
  },
};

export const roseTheme: Theme = {
  id: 'rose',
  name: 'Rose',
  type: 'light',
  colors: {
    background: '0 0% 100%',
    foreground: '240 10% 3.9%',
    card: '0 0% 100%',
    cardForeground: '240 10% 3.9%',
    popover: '0 0% 100%',
    popoverForeground: '240 10% 3.9%',
    primary: '346 87% 43%',
    primaryForeground: '0 0% 100%',
    secondary: '240 4.8% 95.9%',
    secondaryForeground: '240 5.9% 10%',
    muted: '240 4.8% 95.9%',
    mutedForeground: '240 3.8% 46.1%',
    accent: '240 4.8% 95.9%',
    accentForeground: '240 5.9% 10%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',
    border: '240 5.9% 90%',
    input: '240 5.9% 90%',
    ring: '346 87% 43%',
    // Enhanced semantic colors
    success: '142 76% 36%',
    successForeground: '0 0% 100%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 100%',
    info: '199 89% 48%',
    infoForeground: '0 0% 100%',
  },
};

// All built-in themes
export const builtInThemes: Theme[] = [
  lightTheme,
  darkTheme,
  oceanTheme,
  forestTheme,
  sunsetTheme,
  midnightTheme,
  cyberpunkTheme,
  nordTheme,
  roseTheme,
];

// Apply theme to document
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('dark', 'light');
  
  // Add theme type class
  root.classList.add(theme.type);
  
  // Apply CSS variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVarName, value);
  });
}

// Get theme by ID
export function getThemeById(
  id: string,
  customThemes: Theme[] = []
): Theme | undefined {
  const allThemes = [...builtInThemes, ...customThemes];
  return allThemes.find(theme => theme.id === id);
}

/**
 * Resolves which theme should be applied based on mode and settings
 */
export function resolveTheme(
  themeMode: 'light' | 'dark' | 'system',
  currentThemeId: string,
  customThemes: Theme[] = []
): Theme {
  if (themeMode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const selectedTheme = getThemeById(currentThemeId, customThemes);
    
    if (selectedTheme && selectedTheme.type === (prefersDark ? 'dark' : 'light')) {
      return selectedTheme;
    }
    return prefersDark ? darkTheme : lightTheme;
  }
  
  if (themeMode === 'light' || themeMode === 'dark') {
    const selectedTheme = getThemeById(currentThemeId, customThemes);
    
    if (selectedTheme && selectedTheme.type === themeMode) {
      return selectedTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  }
  
  return lightTheme;
}

// Create a new custom theme
export function createCustomTheme(
  name: string,
  type: 'light' | 'dark',
  baseTheme?: Theme
): Theme {
  const base = baseTheme || (type === 'dark' ? darkTheme : lightTheme);
  
  return {
    id: `custom-${Date.now()}`,
    name,
    type,
    colors: { ...base.colors },
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
}

// Validate theme colors
export function validateThemeColors(colors: Partial<ThemeColors>): boolean {
  const requiredKeys: (keyof ThemeColors)[] = [
    'background',
    'foreground',
    'primary',
    'primaryForeground',
  ];
  
  return requiredKeys.every(key => {
    const value = colors[key];
    return value && typeof value === 'string' && value.trim().length > 0;
  });
}

// Export theme to JSON
export function exportTheme(theme: Theme): string {
  return JSON.stringify(theme, null, 2);
}

// Import theme from JSON
export function importTheme(json: string): Theme {
  const theme = JSON.parse(json) as Theme;
  
  // Validate required fields
  if (!theme.name || !theme.type || !theme.colors) {
    throw new Error('Invalid theme format');
  }
  
  // Ensure it's marked as custom and has a unique ID
  return {
    ...theme,
    id: `custom-${Date.now()}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
}
