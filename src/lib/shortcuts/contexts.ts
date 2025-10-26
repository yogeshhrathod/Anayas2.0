/**
 * Context detection logic for keyboard shortcuts
 */

import { ShortcutContext, ContextState } from './types';

/**
 * Detect current context based on DOM, store state, and focus
 */
export function detectContext(state: ContextState): ShortcutContext[] {
  const contexts: ShortcutContext[] = ['global'];
  
  // Check if user is typing in an input field
  const activeElement = document.activeElement;
  if (activeElement?.tagName === 'INPUT' || 
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.getAttribute('contenteditable') === 'true') {
    return ['global']; // Only global shortcuts when typing
  }
  
  // Page context
  if (state.page === 'home') {
    contexts.push('editor');
  } else if (state.page === 'collections') {
    contexts.push('collections-page');
  } else if (state.page === 'environments') {
    contexts.push('environments-page');
  } else if (state.page === 'history') {
    contexts.push('history-page');
  } else if (state.page === 'settings') {
    contexts.push('settings-page');
  }
  
  // Sidebar context
  if (state.sidebarOpen && state.selectedItem.type) {
    contexts.push('sidebar');
    if (state.selectedItem.type === 'collection') {
      contexts.push('sidebar:collection');
    } else if (state.selectedItem.type === 'folder') {
      contexts.push('sidebar:folder');
    } else if (state.selectedItem.type === 'request') {
      contexts.push('sidebar:request');
    }
  }
  
  // Focus context
  if (state.focusedContext === 'sidebar') {
    contexts.push('sidebar');
  } else if (state.focusedContext === 'editor') {
    contexts.push('editor');
  }
  
  return contexts;
}

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
