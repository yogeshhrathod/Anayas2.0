/**
 * Hook to register and handle keyboard shortcuts
 */

import { useEffect, useMemo, useRef } from 'react';
import { detectContext, ShortcutRegistry, SHORTCUTS } from '../lib/shortcuts';
import { ContextState } from '../lib/shortcuts/types';
import { useShortcutContext } from './useShortcutContext';

export function useShortcuts(
  handlers: Record<
    string,
    (event: KeyboardEvent, context: ContextState) => void
  >
) {
  const contextState = useShortcutContext();
  const registry = useMemo(() => new ShortcutRegistry(), []);
  const handlersRef = useRef(handlers);

  // Update ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    // Register all shortcuts with their handlers
    Object.entries(SHORTCUTS).forEach(([id, shortcut]) => {
      // Use the latest handler from the ref
      registry.register(id, {
        ...shortcut,
        handler: (event, context) => {
          const latestHandler = handlersRef.current[shortcut.action];
          if (latestHandler) {
            latestHandler(event, context);
          }
        },
      });
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
  }, [contextState, registry]); // No longer depends on handlers directly
}
