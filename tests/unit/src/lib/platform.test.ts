import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    formatShortcut,
    getAccelerator,
    getModifierKeyName,
    getModifierKeySymbol,
    getPlatform,
    isLinux,
    isMac,
    isPlatformModifierKey,
    isWindows
} from '../../../../src/lib/platform';

describe('platform', () => {
    const originalPlatform = process.platform;
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
        Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, writable: true });
        vi.restoreAllMocks();
    });

    it('should detect darwin as Mac', () => {
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        expect(getPlatform()).toBe('darwin');
        expect(isMac()).toBe(true);
        expect(isWindows()).toBe(false);
        expect(isLinux()).toBe(false);
    });

    it('should detect win32 as Windows', () => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
        expect(getPlatform()).toBe('win32');
        expect(isMac()).toBe(false);
        expect(isWindows()).toBe(true);
        expect(isLinux()).toBe(false);
    });

    it('should detect linux as Linux', () => {
        Object.defineProperty(process, 'platform', { value: 'linux' });
        expect(getPlatform()).toBe('linux');
        expect(isMac()).toBe(false);
        expect(isWindows()).toBe(false);
        expect(isLinux()).toBe(true);
    });

    it('should return correct modifier key symbol', () => {
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        expect(getModifierKeySymbol()).toBe('⌘');

        Object.defineProperty(process, 'platform', { value: 'win32' });
        expect(getModifierKeySymbol()).toBe('Ctrl');
    });

    it('should return correct modifier key name', () => {
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        expect(getModifierKeyName()).toBe('Cmd');

        Object.defineProperty(process, 'platform', { value: 'win32' });
        expect(getModifierKeyName()).toBe('Ctrl');
    });

    it('should format shortcuts for Mac', () => {
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        expect(formatShortcut('S', { meta: true, shift: true })).toBe('⌘⇧S');
        expect(formatShortcut('S', { alt: true })).toBe('⌥S');
    });

    it('should format shortcuts for Windows/Linux', () => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
        expect(formatShortcut('S', { ctrl: true, shift: true })).toBe('Ctrl+Shift+S');
        expect(formatShortcut('S', { alt: true })).toBe('Alt+S');
    });

    it('should get accelerator for Electron', () => {
        expect(getAccelerator({ key: 'S', metaKey: true })).toBe('CommandOrControl+S');
        expect(getAccelerator({ key: 'S', ctrlKey: true, shiftKey: true })).toBe('CommandOrControl+Shift+S');
        expect(getAccelerator({ key: 'S', altKey: true })).toBe('Alt+S');
        expect(getAccelerator({ key: 'Enter' })).toBe('Return');
        expect(getAccelerator({ key: 'Backspace' })).toBe('Backspace');
        expect(getAccelerator({ key: '\\' })).toBe('\\');
    });

    it('should correctly identify platform modifier key', () => {
        const cmdEvent = { metaKey: true, ctrlKey: false } as KeyboardEvent;
        const ctrlEvent = { metaKey: false, ctrlKey: true } as KeyboardEvent;

        Object.defineProperty(process, 'platform', { value: 'darwin' });
        expect(isPlatformModifierKey(cmdEvent)).toBe(true);
        expect(isPlatformModifierKey(ctrlEvent)).toBe(false);

        Object.defineProperty(process, 'platform', { value: 'win32' });
        expect(isPlatformModifierKey(cmdEvent)).toBe(false);
        expect(isPlatformModifierKey(ctrlEvent)).toBe(true);
    });

    it('should use navigator userAgent as fallback', () => {
        Object.defineProperty(process, 'platform', { value: undefined });

        // Mac
        Object.defineProperty(navigator, 'userAgent', { value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", writable: true });
        expect(getPlatform()).toBe('darwin');

        // Windows
        Object.defineProperty(navigator, 'userAgent', { value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", writable: true });
        expect(getPlatform()).toBe('win32');

        // Linux
        Object.defineProperty(navigator, 'userAgent', { value: "Mozilla/5.0 (X11; Linux x86_64)", writable: true });
        expect(getPlatform()).toBe('linux');

        // Unknown
        Object.defineProperty(navigator, 'userAgent', { value: "Unknown Browser", writable: true });
        expect(getPlatform()).toBe('unknown');
    });
});

