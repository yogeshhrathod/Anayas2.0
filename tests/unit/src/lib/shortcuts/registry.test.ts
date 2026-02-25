import { describe, expect, it } from 'vitest';
import { ShortcutRegistry } from '../../../../../src/lib/shortcuts/registry';

describe('ShortcutRegistry', () => {
  const registry = new ShortcutRegistry();
  const definition = {
    key: 's',
    metaKey: true,
    contexts: ['global'],
    action: 'save',
    description: 'Save'
  } as any;

  registry.register('save', definition);

  it('should find matching shortcut in correct context', () => {
    // Mock isMac
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true });

    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
    const match = registry.findMatchingShortcut(event, ['global']);
    
    expect(match).toBe(definition);
  });

  it('should not find shortcut if context does not match', () => {
    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
    const match = registry.findMatchingShortcut(event, ['other-context']);
    
    expect(match).toBeNull();
  });

  it('should not find shortcut if key does not match', () => {
    const event = new KeyboardEvent('keydown', { key: 'a', metaKey: true });
    const match = registry.findMatchingShortcut(event, ['global']);
    
    expect(match).toBeNull();
  });
});
