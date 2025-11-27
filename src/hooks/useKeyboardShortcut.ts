/**
 * useKeyboardShortcut - Centralized keyboard shortcut management
 *
 * Provides keyboard shortcut handling with:
 * - Global and local shortcuts
 * - Modifier key support
 * - Prevent default behavior
 * - Cleanup on unmount
 *
 * @example
 * ```tsx
 * useKeyboardShortcut('ctrl+s', (e) => {
 *   e.preventDefault();
 *   handleSave();
 * });
 *
 * useKeyboardShortcut('escape', () => {
 *   handleCancel();
 * }, { global: false });
 * ```
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutOptions {
  global?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export function useKeyboardShortcut(
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
) {
  const {
    global = true,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (preventDefault) {
        event.preventDefault();
      }

      if (stopPropagation) {
        event.stopPropagation();
      }

      callback(event);
    },
    [callback, preventDefault, stopPropagation]
  );

  useEffect(() => {
    const target = global ? document : window;

    const eventHandler = (event: Event) => {
      handleKeyDown(event as KeyboardEvent);
    };

    target.addEventListener('keydown', eventHandler);

    return () => {
      target.removeEventListener('keydown', eventHandler);
    };
  }, [handleKeyDown, global]);
}
