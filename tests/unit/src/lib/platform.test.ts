import { afterEach, describe, expect, it } from 'vitest';
import {
    formatShortcut,
    getModifierKeySymbol,
    getPlatform,
    isMac
} from '../../../../src/lib/platform';

describe('platform', () => {
  const originalPlatform = process.platform;
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, writable: true });
  });

  it('should detect darwin as Mac', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    expect(getPlatform()).toBe('darwin');
    expect(isMac()).toBe(true);
  });

  it('should detect win32 as Windows', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    expect(getPlatform()).toBe('win32');
    expect(isMac()).toBe(false);
  });

  it('should return correct modifier key symbol', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    expect(getModifierKeySymbol()).toBe('⌘');

    Object.defineProperty(process, 'platform', { value: 'win32' });
    expect(getModifierKeySymbol()).toBe('Ctrl');
  });

  it('should format shortcuts for Mac', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const shortcut = formatShortcut('S', { meta: true, shift: true });
    // Parts: Cmd Symbol (⌘), Shift Symbol (⇧), S -> joined by '' on Mac
    expect(shortcut).toBe('⌘⇧S');
  });

  it('should format shortcuts for Windows/Linux', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const shortcut = formatShortcut('S', { ctrl: true, shift: true });
    // Parts: Ctrl, Shift, S -> joined by + on Windows
    expect(shortcut).toBe('Ctrl+Shift+S');
  });

  it('should use navigator userAgent as fallback', () => {
    // Force process.platform to undefined (careful with TS)
    Object.defineProperty(process, 'platform', { value: undefined });
    
    // Test Mac user agent
    const macAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
    Object.defineProperty(navigator, 'userAgent', { value: macAgent, writable: true });
    expect(getPlatform()).toBe('darwin');

    // Test Win user agent
    const winAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
    Object.defineProperty(navigator, 'userAgent', { value: winAgent, writable: true });
    expect(getPlatform()).toBe('win32');
  });
});
