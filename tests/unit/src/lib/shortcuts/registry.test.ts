import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ShortcutRegistry } from '../../../../../src/lib/shortcuts/registry';

// Mock contexts to return isMac
vi.mock('../../../../../src/lib/shortcuts/contexts', () => ({
  isMac: vi.fn(),
  getModifierKey: vi.fn()
}));

import { isMac } from '../../../../../src/lib/shortcuts/contexts';

describe('shortcuts-registry', () => {
  let registry: ShortcutRegistry;

  beforeEach(() => {
    registry = new ShortcutRegistry();
    vi.clearAllMocks();
  });

  describe('register and getAllShortcuts', () => {
    it('should register and retrieve shortcuts', () => {
      const shortcut = { key: 'a', contexts: ['global'] } as any;
      registry.register('test', shortcut);
      expect(registry.getAllShortcuts().get('test')).toBe(shortcut);
    });
  });

  describe('findMatchingShortcut', () => {
    it('should find a matching shortcut in context', () => {
       (isMac as any).mockReturnValue(true);
       const shortcut = { key: 's', metaKey: true, contexts: ['global'] } as any;
       registry.register('save', shortcut);
       
       const event = { key: 's', metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } as any;
       const match = registry.findMatchingShortcut(event, ['global']);
       expect(match).toBe(shortcut);
    });

    it('should not match if context is different', () => {
       const shortcut = { key: 's', contexts: ['editor'] } as any;
       registry.register('save', shortcut);
       
       const event = { key: 's' } as any;
       const match = registry.findMatchingShortcut(event, ['sidebar']);
       expect(match).toBeNull();
    });

    it('should not match if key is different', () => {
       const shortcut = { key: 's', contexts: ['global'] } as any;
       registry.register('save', shortcut);
       
       const event = { key: 'a' } as any;
       const match = registry.findMatchingShortcut(event, ['global']);
       expect(match).toBeNull();
    });

    it('should handle Windows/Linux modifiers', () => {
       (isMac as any).mockReturnValue(false);
       const shortcut = { key: 's', ctrlKey: true, contexts: ['global'] } as any;
       registry.register('save', shortcut);
       
       const event = { key: 's', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false } as any;
       const match = registry.findMatchingShortcut(event, ['global']);
       expect(match).toBe(shortcut);
    });
  });
});
