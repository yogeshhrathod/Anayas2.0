/**
 * Public API for the shortcuts system
 */

export { ShortcutRegistry } from './registry';
export { detectContext, isMac, getModifierKey } from './contexts';
export { SHORTCUTS } from './shortcuts';
export type { 
  ShortcutContext, 
  ShortcutDefinition, 
  ContextState 
} from './types';


