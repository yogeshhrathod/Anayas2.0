/**
 * Platform detection and OS-specific utilities
 * Provides cross-platform support for Linux, Windows, and macOS
 */

export type Platform = 'darwin' | 'win32' | 'linux' | 'unknown';

/**
 * Detect the current operating system
 */
export function getPlatform(): Platform {
  // In Electron renderer process, we can access process.platform
  if (typeof process !== 'undefined' && process.platform) {
    return process.platform as Platform;
  }

  // Fallback for web context (shouldn't happen in Electron)
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mac')) return 'darwin';
  if (userAgent.includes('win')) return 'win32';
  if (userAgent.includes('linux')) return 'linux';

  return 'unknown';
}

/**
 * Check if running on macOS
 */
export function isMac(): boolean {
  return getPlatform() === 'darwin';
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return getPlatform() === 'win32';
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  return getPlatform() === 'linux';
}

/**
 * Get the appropriate modifier key symbol for the current platform
 * Returns '⌘' on Mac, 'Ctrl' on Windows/Linux
 */
export function getModifierKeySymbol(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Get the appropriate modifier key name for the current platform
 * Returns 'Cmd' on Mac, 'Ctrl' on Windows/Linux
 */
export function getModifierKeyName(): string {
  return isMac() ? 'Cmd' : 'Ctrl';
}

/**
 * Format a keyboard shortcut for display based on the current platform
 * @param key - The key to press (e.g., 'S', 'W', 'N')
 * @param modifiers - Object specifying which modifier keys are required
 */
export function formatShortcut(
  key: string,
  modifiers: {
    meta?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  } = {}
): string {
  const parts: string[] = [];

  // On Mac, use Cmd for meta/ctrl shortcuts
  // On Windows/Linux, use Ctrl
  if (modifiers.meta || modifiers.ctrl) {
    parts.push(getModifierKeySymbol());
  }

  if (modifiers.shift) {
    parts.push(isMac() ? '⇧' : 'Shift');
  }

  if (modifiers.alt) {
    parts.push(isMac() ? '⌥' : 'Alt');
  }

  parts.push(key.toUpperCase());

  return parts.join(isMac() ? '' : '+');
}

/**
 * Get Electron menu accelerator string for the current platform
 * @param shortcut - Shortcut definition
 */
export function getAccelerator(shortcut: {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): string {
  const parts: string[] = [];

  // Electron uses 'CommandOrControl' for cross-platform Cmd/Ctrl
  if (shortcut.metaKey || shortcut.ctrlKey) {
    parts.push('CommandOrControl');
  }

  if (shortcut.shiftKey) {
    parts.push('Shift');
  }

  if (shortcut.altKey) {
    parts.push('Alt');
  }

  // Map special key names
  let keyName = shortcut.key;
  if (keyName === 'Backspace') keyName = 'Backspace';
  else if (keyName === 'Enter') keyName = 'Return';
  else if (keyName === '\\') keyName = '\\';

  parts.push(keyName);

  return parts.join('+');
}

/**
 * Check if an event matches the platform-appropriate modifier key
 * Returns true if Cmd is pressed on Mac, or Ctrl is pressed on Windows/Linux
 */
export function isPlatformModifierKey(
  event: KeyboardEvent | MouseEvent
): boolean {
  if (isMac()) {
    return event.metaKey;
  }
  return event.ctrlKey;
}
