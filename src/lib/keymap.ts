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
  },
  EDIT_ITEM: {
    key: 'e',
    metaKey: true, // Cmd+E on Mac
    ctrlKey: true, // Ctrl+E on Windows/Linux
    description: 'Edit Selected Item',
    action: 'edit-item'
  },
  DUPLICATE_ITEM: {
    key: 'd',
    metaKey: true, // Cmd+D on Mac
    ctrlKey: true, // Ctrl+D on Windows/Linux
    description: 'Duplicate Selected Item',
    action: 'duplicate-item'
  },
  DELETE_ITEM: {
    key: 'Backspace',
    metaKey: true, // Cmd+Backspace on Mac
    ctrlKey: true, // Ctrl+Backspace on Windows/Linux
    description: 'Delete Selected Item',
    action: 'delete-item'
  },
  EXPORT_ITEM: {
    key: 'e',
    metaKey: true, // Cmd+Shift+E on Mac
    ctrlKey: true, // Ctrl+Shift+E on Windows/Linux
    shiftKey: true,
    description: 'Export Selected Item',
    action: 'export-item'
  },
  ADD_REQUEST: {
    key: 'r',
    metaKey: true, // Cmd+R on Mac
    ctrlKey: true, // Ctrl+R on Windows/Linux
    description: 'Add New Request',
    action: 'add-request'
  },
  ADD_FOLDER: {
    key: 'n',
    metaKey: true, // Cmd+Shift+N on Mac
    ctrlKey: true, // Ctrl+Shift+N on Windows/Linux
    shiftKey: true,
    description: 'Add New Folder',
    action: 'add-folder'
  },
  IMPORT_ITEM: {
    key: 'i',
    metaKey: true, // Cmd+Shift+I on Mac
    ctrlKey: true, // Ctrl+Shift+I on Windows/Linux
    shiftKey: true,
    description: 'Import Item',
    action: 'import-item'
  },
  CREATE_PRESET: {
    key: 'p',
    metaKey: true, // Cmd+Shift+P on Mac
    ctrlKey: true, // Ctrl+Shift+P on Windows/Linux
    shiftKey: true,
    description: 'Create Preset',
    action: 'create-preset'
  },
  SELECT_PRESET_1: {
    key: '1',
    metaKey: true, // Cmd+Shift+1 on Mac
    ctrlKey: true, // Ctrl+Shift+1 on Windows/Linux
    shiftKey: true,
    description: 'Select Preset 1',
    action: 'select-preset-1'
  },
  SELECT_PRESET_2: {
    key: '2',
    metaKey: true, // Cmd+Shift+2 on Mac
    ctrlKey: true, // Ctrl+Shift+2 on Windows/Linux
    shiftKey: true,
    description: 'Select Preset 2',
    action: 'select-preset-2'
  },
  SELECT_PRESET_3: {
    key: '3',
    metaKey: true, // Cmd+Shift+3 on Mac
    ctrlKey: true, // Ctrl+Shift+3 on Windows/Linux
    shiftKey: true,
    description: 'Select Preset 3',
    action: 'select-preset-3'
  },
  SELECT_PRESET_4: {
    key: '4',
    metaKey: true, // Cmd+Shift+4 on Mac
    ctrlKey: true, // Ctrl+Shift+4 on Windows/Linux
    shiftKey: true,
    description: 'Select Preset 4',
    action: 'select-preset-4'
  },
  SELECT_PRESET_5: {
    key: '5',
    metaKey: true, // Cmd+Shift+5 on Mac
    ctrlKey: true, // Ctrl+Shift+5 on Windows/Linux
    shiftKey: true,
    description: 'Select Preset 5',
    action: 'select-preset-5'
  },
  SELECT_PRESET_6: {
    key: '6',
    metaKey: true, // Cmd+Shift+6 on Mac
    ctrlKey: true, // Ctrl+Shift+6 on Windows/Linux
    shiftKey: true,
    description: 'Select Preset 6',
    action: 'select-preset-6'
  },
  SELECT_PRESET_7: {
    key: '7',
    metaKey: true, // Cmd+Shift+7 on Mac
    ctrlKey: true, // Ctrl+Shift+7 on Windows/Linux
    shiftKey: true,
    description: 'Select Preset 7',
    action: 'select-preset-7'
  },
  SELECT_PRESET_8: {
    key: '8',
    metaKey: true, // Cmd+Shift+8 on Mac
    ctrlKey: true, // Ctrl+Shift+8 on Windows/Linux
    shiftKey: true,
    description: 'Select Preset 8',
    action: 'select-preset-8'
  },
  SELECT_PRESET_9: {
    key: '9',
    metaKey: true, // Cmd+Shift+9 on Mac
    ctrlKey: true, // Ctrl+Shift+9 on Windows/Linux
    shiftKey: true,
    description: 'Select Preset 9',
    action: 'select-preset-9'
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
    Object.entries(KEYMAP).forEach(([_, keymap]) => {
      const hasHandler = !!handlers[keymap.action];
      const matches = matchesKeymap(event, keymap);
      
      if (matches && hasHandler) {
        event.preventDefault();
        event.stopPropagation();
        handlers[keymap.action](event);
      }
    });
  };

  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};
