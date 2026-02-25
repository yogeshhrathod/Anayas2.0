import { describe, expect, it } from 'vitest';
import {
    getShortcutDisplay,
    matchesKeymap
} from '../../../../src/lib/keymap';

describe('keymap', () => {
  const metaConfig = {
    key: 's',
    metaKey: true,
    description: 'Save',
    action: 'save'
  };

  const ctrlConfig = {
    key: 's',
    ctrlKey: true,
    description: 'Save',
    action: 'save'
  };

  describe('matchesKeymap', () => {
    it('should match meta key on Mac', () => {
      // Mock navigator.platform for isMac
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true });
      
      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        ctrlKey: false
      });
      
      expect(matchesKeymap(event, metaConfig)).toBe(true);
    });

    it('should match ctrl key on non-Mac', () => {
      Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
      
      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: false,
        ctrlKey: true
      });
      
      expect(matchesKeymap(event, ctrlConfig)).toBe(true);
    });

    it('should not match if key is different', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', metaKey: true });
      expect(matchesKeymap(event, metaConfig)).toBe(false);
    });
  });

  describe('getShortcutDisplay', () => {
    it('should show ⌘ for Mac', () => {
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true });
      expect(getShortcutDisplay(metaConfig)).toBe('⌘+S');
    });

    it('should show Ctrl for non-Mac', () => {
      Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
      expect(getShortcutDisplay(ctrlConfig)).toBe('Ctrl+S');
    });

    it('should include Shift if configured', () => {
      Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
      expect(getShortcutDisplay({ ...ctrlConfig, shiftKey: true })).toBe('Ctrl+Shift+S');
    });
  });
});
