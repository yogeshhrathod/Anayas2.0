import { useEffect } from 'react';
import { applyTheme, resolveTheme } from '../lib/themes';
import { useStore } from '../store/useStore';

/**
 * ThemeManager component handles theme application based on mode and selected theme
 * Supports: light, dark, system modes + custom addon themes
 */
export function ThemeManager() {
  const { themeMode, currentThemeId, customThemes } = useStore();

  useEffect(() => {
    const applyCurrentTheme = () => {
      const themeToApply = resolveTheme(themeMode, currentThemeId, customThemes);
      applyTheme(themeToApply);
    };

    // Apply theme immediately
    applyCurrentTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        applyCurrentTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode, currentThemeId, customThemes]);

  return null; // This component doesn't render anything
}
