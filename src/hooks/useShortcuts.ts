/**
 * Hook to register and handle keyboard shortcuts
 */

import { useEffect, useMemo } from 'react';
import { ShortcutRegistry, detectContext, SHORTCUTS } from '../lib/shortcuts';
import { ContextState } from '../lib/shortcuts/types';
import { useShortcutContext } from './useShortcutContext';

export function useShortcuts(
  handlers: Record<string, (event: KeyboardEvent, context: ContextState) => void>
) {
  const contextState = useShortcutContext();
  const registry = useMemo(() => new ShortcutRegistry(), []);
  
  useEffect(() => {
    // Register all shortcuts with their handlers
    Object.entries(SHORTCUTS).forEach(([id, shortcut]) => {
      if (handlers[shortcut.action]) {
        registry.register(id, {
          ...shortcut,
          handler: handlers[shortcut.action]
        });
      }
    });
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const contexts = detectContext(contextState);
      const matchedShortcut = registry.findMatchingShortcut(event, contexts);
      
      if (matchedShortcut?.handler) {
        event.preventDefault();
        event.stopPropagation();
        matchedShortcut.handler(event, contextState);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [contextState, handlers, registry]);
}
