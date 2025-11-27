import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { applyTheme, getThemeById, lightTheme, darkTheme } from '../lib/themes';

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
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        const systemTheme = getThemeById(currentThemeId, customThemes);

        if (systemTheme) {
          themeToApply = systemTheme;
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
