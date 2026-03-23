import { describe, expect, it, vi, beforeEach } from 'vitest';
import { 
  applyTheme, 
  getThemeById, 
  resolveTheme, 
  createCustomTheme, 
  validateThemeColors, 
  exportTheme, 
  importTheme,
  lightTheme,
  darkTheme
} from '../../../../src/lib/themes';

describe('themes', () => {
  beforeEach(() => {
    // Mock document.documentElement
    const mockStyle = {
      setProperty: vi.fn()
    };
    const mockClassList = {
      remove: vi.fn(),
      add: vi.fn()
    };
    
    vi.stubGlobal('document', {
      documentElement: {
        style: mockStyle,
        classList: mockClassList
      }
    });

    // Mock window.matchMedia
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({ matches: false })
    });
  });

  describe('applyTheme', () => {
    it('should set CSS variables on document element', () => {
      applyTheme(lightTheme);
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark', 'light');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('light');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--background', lightTheme.colors.background);
    });
  });

  describe('getThemeById', () => {
    it('should find built-in themes', () => {
      const theme = getThemeById('dark');
      expect(theme?.name).toBe('Dark');
    });

    it('should find custom themes', () => {
      const custom = { id: 'c1', name: 'Custom', type: 'dark', colors: {} } as any;
      const theme = getThemeById('c1', [custom]);
      expect(theme?.name).toBe('Custom');
    });
  });

  describe('resolveTheme', () => {
    it('should resolve system theme', () => {
      // Mock light system
      (window.matchMedia as any).mockReturnValue({ matches: false });
      const theme = resolveTheme('system', 'light');
      expect(theme.type).toBe('light');

      // Mock dark system
      (window.matchMedia as any).mockReturnValue({ matches: true });
      const themeDark = resolveTheme('system', 'dark');
      expect(themeDark.type).toBe('dark');
    });

    it('should resolve explicit light/dark modes', () => {
       const theme = resolveTheme('dark', 'dark');
       expect(theme.id).toBe('dark');
       
       const theme2 = resolveTheme('light', 'light');
       expect(theme2.id).toBe('light');
    });
  });

  describe('createCustomTheme', () => {
    it('should create a new theme based on type', () => {
      const theme = createCustomTheme('New', 'dark');
      expect(theme.name).toBe('New');
      expect(theme.isCustom).toBe(true);
      expect(theme.type).toBe('dark');
    });
  });

  describe('validateThemeColors', () => {
    it('should return true for valid colors', () => {
      const colors = {
        background: '0 0% 100%',
        foreground: '0 0% 0%',
        primary: '0 0% 50%',
        primaryForeground: '0 0% 100%'
      };
      expect(validateThemeColors(colors)).toBe(true);
    });

    it('should return false for missing required colors', () => {
       expect(validateThemeColors({ background: 'white' })).toBe(false);
    });
  });

  describe('export and import', () => {
    it('should export theme to JSON', () => {
      const json = exportTheme(lightTheme);
      expect(typeof json).toBe('string');
      expect(json).toContain('"id": "light"');
    });

    it('should import theme from JSON', () => {
       const json = JSON.stringify(lightTheme);
       const theme = importTheme(json);
       expect(theme.name).toBe('Light');
       expect(theme.isCustom).toBe(true);
       expect(theme.id).toMatch(/^custom-/);
    });

    it('should throw for invalid JSON on import', () => {
       expect(() => importTheme('{}')).toThrow('Invalid theme format');
    });
  });
});
