import { useEffect } from 'react';
import { applyTheme, darkTheme, getThemeById, lightTheme } from '../lib/themes';
import { useStore } from '../store/useStore';

/**
 * ThemeManager component handles theme application based on mode and selected theme
 * Supports: light, dark, system modes + custom addon themes
 */
export function ThemeManager() {
  const { themeMode, currentThemeId, customThemes } = useStore();

  useEffect(() => {
    const applyCurrentTheme = () => {
      let themeToApply;

        if (themeMode === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const selectedTheme = getThemeById(currentThemeId, customThemes);
        
        // Only use the selected theme if it matches the system preference
        if (selectedTheme && selectedTheme.type === (prefersDark ? 'dark' : 'light')) {
          themeToApply = selectedTheme;
        } else {
          // Fallback to default light/dark based on system preference
          themeToApply = prefersDark ? darkTheme : lightTheme;
        }
      } else if (themeMode === 'light' || themeMode === 'dark') {
        // Use selected theme or fallback to default light/dark
        const selectedTheme = getThemeById(currentThemeId, customThemes);
        
        if (selectedTheme && selectedTheme.type === themeMode) {
          themeToApply = selectedTheme;
        } else {
          // Fallback to default theme matching the mode
          themeToApply = themeMode === 'dark' ? darkTheme : lightTheme;
        }
      } else {
        // Fallback to light theme
        themeToApply = lightTheme;
      }

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
