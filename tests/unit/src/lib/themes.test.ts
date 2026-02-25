import { describe, expect, it, vi } from 'vitest';
import {
    createCustomTheme,
    getThemeById,
    lightTheme,
    resolveTheme,
    validateThemeColors
} from '../../../../src/lib/themes';

describe('themes', () => {
  describe('getThemeById', () => {
    it('should find built-in themes', () => {
      const theme = getThemeById('ocean');
      expect(theme).toBeDefined();
      expect(theme?.name).toBe('Ocean');
    });

    it('should find custom themes', () => {
      const custom = { id: 'my-theme', name: 'My Theme', type: 'dark', colors: {} } as any;
      const theme = getThemeById('my-theme', [custom]);
      expect(theme).toBe(custom);
    });
  });

  describe('resolveTheme', () => {
    it('should resolve light mode', () => {
      const theme = resolveTheme('light', 'light');
      expect(theme.id).toBe('light');
    });

    it('should resolve dark mode', () => {
      const theme = resolveTheme('dark', 'dark');
      expect(theme.id).toBe('dark');
    });

    it('should resolve system mode', () => {
      // Mock matchMedia
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
      }));

      const theme = resolveTheme('system', '');
      expect(theme.type).toBe('dark');
    });
  });

  describe('createCustomTheme', () => {
    it('should create a new theme based on light', () => {
      const theme = createCustomTheme('New', 'light');
      expect(theme.name).toBe('New');
      expect(theme.type).toBe('light');
      expect(theme.isCustom).toBe(true);
      expect(theme.colors.background).toBe(lightTheme.colors.background);
    });
  });

  describe('validateThemeColors', () => {
    it('should validate required colors', () => {
      expect(validateThemeColors({})).toBe(false);
      expect(validateThemeColors({
        background: '...',
        foreground: '...',
        primary: '...',
        primaryForeground: '...'
      })).toBe(true);
    });
  });
});
