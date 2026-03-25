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
  const contextRef = useRef(contextState);

  // Keep refs up-to-date with latest values (no re-registration needed)
  handlersRef.current = handlers;
  contextRef.current = contextState;

  useEffect(() => {
    // Register all shortcuts with their handlers once
    Object.entries(SHORTCUTS).forEach(([id, shortcut]) => {
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
      // Always use the latest context from the ref
      const currentContext = contextRef.current;
      const contexts = detectContext(currentContext);
      const matchedShortcut = registry.findMatchingShortcut(event, contexts);

      if (matchedShortcut?.handler) {
        event.preventDefault();
        event.stopPropagation();
        matchedShortcut.handler(event, currentContext);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // Registry is stable (useMemo with []). Only set up once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registry]);
}
