/**
 * Shortcut registry and matching logic
 */

import { ShortcutDefinition, ShortcutContext } from './types';
import { isMac } from './contexts';

export class ShortcutRegistry {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  
  register(id: string, shortcut: ShortcutDefinition) {
    this.shortcuts.set(id, shortcut);
  }
  
  findMatchingShortcut(
    event: KeyboardEvent, 
    contexts: ShortcutContext[]
  ): ShortcutDefinition | null {
    for (const [id, shortcut] of this.shortcuts) {
      // Check if shortcut is active in current context
      const isActiveInContext = shortcut.contexts.some(ctx => 
        contexts.includes(ctx)
      );
      
      if (!isActiveInContext) continue;
      
      // Check if key combination matches
      if (this.matchesKey(event, shortcut)) {
        return shortcut;
      }
    }
    return null;
  }
  
  private matchesKey(event: KeyboardEvent, shortcut: ShortcutDefinition): boolean {
    // Check the main key
    if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
      return false;
    }
    
    // Platform-aware modifier checking
    if (isMac()) {
      return event.metaKey === (shortcut.metaKey || false) &&
             event.ctrlKey === false &&
             event.shiftKey === (shortcut.shiftKey || false) &&
             event.altKey === (shortcut.altKey || false);
    } else {
      return event.ctrlKey === (shortcut.ctrlKey || false) &&
             event.metaKey === false &&
             event.shiftKey === (shortcut.shiftKey || false) &&
             event.altKey === (shortcut.altKey || false);
    }
  }
  
  getAllShortcuts(): Map<string, ShortcutDefinition> {
    return new Map(this.shortcuts);
  }
}
