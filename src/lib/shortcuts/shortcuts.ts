/**
 * All keyboard shortcut definitions organized by context
 */

import { ShortcutDefinition } from './types';

export const SHORTCUTS: Record<string, ShortcutDefinition> = {
  // Global shortcuts (always available)
  GLOBAL_SEARCH: {
    key: 'k',
    metaKey: true,
    ctrlKey: true,
    contexts: ['global'],
    action: 'global-search',
    description: 'Open global search'
  },
  
  TOGGLE_SIDEBAR: {
    key: 'b',
    metaKey: true,
    ctrlKey: true,
    contexts: ['global'],
    action: 'toggle-sidebar',
    description: 'Toggle sidebar'
  },
  
  SHOW_SHORTCUTS: {
    key: '?',
    metaKey: true,
    ctrlKey: true,
    contexts: ['global'],
    action: 'show-shortcuts',
    description: 'Show keyboard shortcuts'
  },
  
  // Sidebar item shortcuts (only when item selected)
  EDIT_SELECTED_ITEM: {
    key: 'e',
    metaKey: true,
    ctrlKey: true,
    contexts: ['sidebar:collection', 'sidebar:folder', 'sidebar:request'],
    action: 'edit-item',
    description: 'Edit selected item'
  },
  
  DUPLICATE_SELECTED_ITEM: {
    key: 'd',
    metaKey: true,
    ctrlKey: true,
    contexts: ['sidebar:collection', 'sidebar:request'],
    action: 'duplicate-item',
    description: 'Duplicate selected item'
  },
  
  DELETE_SELECTED_ITEM: {
    key: 'Backspace',
    metaKey: true,
    ctrlKey: true,
    contexts: ['sidebar:collection', 'sidebar:folder', 'sidebar:request'],
    action: 'delete-item',
    description: 'Delete selected item'
  },
  
  // Request editor shortcuts
  SEND_REQUEST: {
    key: 'Enter',
    metaKey: true,
    ctrlKey: true,
    contexts: ['editor'],
    action: 'send-request',
    description: 'Send API request'
  },
  
  SAVE_REQUEST: {
    key: 's',
    metaKey: true,
    ctrlKey: true,
    contexts: ['editor'],
    action: 'save-request',
    description: 'Save request'
  },
  
  FOCUS_URL: {
    key: 'l',
    metaKey: true,
    ctrlKey: true,
    contexts: ['editor'],
    action: 'focus-url',
    description: 'Focus URL input'
  },
  
  NEW_REQUEST: {
    key: 'n',
    metaKey: true,
    ctrlKey: true,
    contexts: ['global', 'editor'],
    action: 'new-request',
    description: 'Create new request'
  },
  
  // Collection-specific shortcuts
  ADD_REQUEST: {
    key: 'r',
    metaKey: true,
    ctrlKey: true,
    contexts: ['sidebar:collection', 'sidebar:folder', 'collections-page'],
    action: 'add-request',
    description: 'Add new request'
  },
  
  ADD_FOLDER: {
    key: 'n',
    metaKey: true,
    ctrlKey: true,
    shiftKey: true,
    contexts: ['sidebar:collection', 'collections-page'],
    action: 'add-folder',
    description: 'Add new folder'
  },
  
  NEW_COLLECTION: {
    key: 'n',
    metaKey: true,
    ctrlKey: true,
    shiftKey: true,
    contexts: ['collections-page'],
    action: 'new-collection',
    description: 'Create new collection'
  },
  
  // Export shortcuts
  EXPORT_COLLECTION: {
    key: 'e',
    metaKey: true,
    ctrlKey: true,
    shiftKey: true,
    contexts: ['sidebar:collection'],
    action: 'export-collection',
    description: 'Export collection'
  },
  
  EXPORT_REQUEST: {
    key: 'e',
    metaKey: true,
    ctrlKey: true,
    shiftKey: true,
    contexts: ['sidebar:request'],
    action: 'export-request',
    description: 'Export request'
  },
  
  // Import shortcuts
  IMPORT_COLLECTION: {
    key: 'i',
    metaKey: true,
    ctrlKey: true,
    shiftKey: true,
    contexts: ['sidebar:collection', 'collections-page'],
    action: 'import-collection',
    description: 'Import collection'
  },
  
  // Advanced shortcuts
  SAVE_REQUEST_AS: {
    key: 's',
    metaKey: true,
    ctrlKey: true,
    shiftKey: true,
    contexts: ['editor'],
    action: 'save-request-as',
    description: 'Save request as...'
  },
  
  CLOSE_TAB: {
    key: 'w',
    metaKey: true,
    ctrlKey: true,
    contexts: ['editor'],
    action: 'close-tab',
    description: 'Close current tab'
  },
  
  TOGGLE_SPLIT_VIEW: {
    key: '\\',
    metaKey: true,
    ctrlKey: true,
    contexts: ['editor'],
    action: 'toggle-split-view',
    description: 'Toggle split view'
  }
};
