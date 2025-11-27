/**
 * TypeScript interfaces for the context-aware keyboard shortcuts system
 */

export type ShortcutContext =
  | 'global' // Always available
  | 'sidebar' // Sidebar has focus
  | 'sidebar:collection' // Collection selected in sidebar
  | 'sidebar:folder' // Folder selected in sidebar
  | 'sidebar:request' // Request selected in sidebar
  | 'editor' // Request editor has focus
  | 'editor:url' // URL input has focus
  | 'collections-page' // Collections page
  | 'environments-page' // Environments page
  | 'history-page' // History page
  | 'settings-page'; // Settings page

export interface ShortcutDefinition {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  contexts: ShortcutContext[]; // Which contexts this shortcut is active in
  action: string;
  description: string;
  handler?: (event: KeyboardEvent, context: ContextState) => void;
}

export interface ContextState {
  page: string;
  selectedItem: { type: string | null; id: number | null; data: unknown };
  selectedRequest: unknown;
  focusedElement: Element | null;
  sidebarOpen: boolean;
  focusedContext: 'sidebar' | 'editor' | 'page' | null;
}
