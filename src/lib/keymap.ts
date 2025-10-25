/**
 * Keyboard shortcut configuration for Anayas
 * Provides VSCode-like keyboard shortcuts with cross-platform support
 */

export interface KeymapConfig {
  key: string;
  metaKey?: boolean; // Cmd on Mac
  ctrlKey?: boolean;  // Ctrl on Windows/Linux
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: string;
}

export const KEYMAP: Record<string, KeymapConfig> = {
  SAVE_REQUEST: {
    key: 's',
    metaKey: true, // Cmd+S on Mac
    ctrlKey: true, // Ctrl+S on Windows/Linux
    description: 'Save Request',
    action: 'save-request'
  },
  GLOBAL_SEARCH: {
    key: 'k',
    metaKey: true, // Cmd+K on Mac
    ctrlKey: true, // Ctrl+K on Windows/Linux
    description: 'Global Search',
    action: 'global-search'
  },
  NEW_REQUEST: {
    key: 'n',
    metaKey: true, // Cmd+N on Mac
    ctrlKey: true, // Ctrl+N on Windows/Linux
    description: 'New Request',
    action: 'new-request'
  },
  SEND_REQUEST: {
    key: 'Enter',
    metaKey: true, // Cmd+Enter on Mac
    ctrlKey: true, // Ctrl+Enter on Windows/Linux
    description: 'Send Request',
    action: 'send-request'
  },
  FOCUS_URL: {
    key: 'l',
    metaKey: true, // Cmd+L on Mac
    ctrlKey: true, // Ctrl+L on Windows/Linux
    description: 'Focus URL Input',
    action: 'focus-url'
  },
  TOGGLE_SIDEBAR: {
    key: 'b',
    metaKey: true, // Cmd+B on Mac
    ctrlKey: true, // Ctrl+B on Windows/Linux
    description: 'Toggle Sidebar',
    action: 'toggle-sidebar'
  }
};

/**
 * Check if the current platform is macOS
 */
export const isMac = (): boolean => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

/**
 * Get the appropriate modifier key for the current platform
 */
export const getModifierKey = (): 'metaKey' | 'ctrlKey' => {
  return isMac() ? 'metaKey' : 'ctrlKey';
};

/**
 * Check if a keyboard event matches a keymap configuration
 */
export const matchesKeymap = (event: KeyboardEvent, keymap: KeymapConfig): boolean => {
  const modifierKey = getModifierKey();
  
  // Check the main key
  if (event.key.toLowerCase() !== keymap.key.toLowerCase()) {
    return false;
  }
  
  // Check modifiers based on platform
  if (modifierKey === 'metaKey') {
    return event.metaKey === keymap.metaKey &&
           event.ctrlKey === false &&
           event.shiftKey === (keymap.shiftKey || false) &&
           event.altKey === (keymap.altKey || false);
  } else {
    return event.ctrlKey === keymap.ctrlKey &&
           event.metaKey === false &&
           event.shiftKey === (keymap.shiftKey || false) &&
           event.altKey === (keymap.altKey || false);
  }
};

/**
 * Get keyboard shortcut display text for UI
 */
export const getShortcutDisplay = (keymap: KeymapConfig): string => {
  const modifierKey = getModifierKey();
  const modifierSymbol = modifierKey === 'metaKey' ? '⌘' : 'Ctrl';
  
  let shortcut = modifierSymbol;
  
  if (keymap.shiftKey) shortcut += '+Shift';
  if (keymap.altKey) shortcut += '+Alt';
  
  shortcut += `+${keymap.key.toUpperCase()}`;
  
  return shortcut;
};

/**
 * Create a keyboard event handler that checks against keymap
 */
export const createKeymapHandler = (
  keymap: KeymapConfig,
  handler: (event: KeyboardEvent) => void
) => {
  return (event: KeyboardEvent) => {
    if (matchesKeymap(event, keymap)) {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    }
  };
};

/**
 * Register global keyboard shortcuts
 */
export const registerGlobalShortcuts = (
  handlers: Record<string, (event: KeyboardEvent) => void>
) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Check each keymap against the event
    Object.entries(KEYMAP).forEach(([action, keymap]) => {
      if (matchesKeymap(event, keymap) && handlers[action]) {
        event.preventDefault();
        event.stopPropagation();
        handlers[action](event);
      }
    });
  };

  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};
