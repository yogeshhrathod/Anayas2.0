import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createKeymapHandler,
    getModifierKey,
    getShortcutDisplay,
    isMac,
    matchesKeymap,
    registerGlobalShortcuts
} from '../../../../src/lib/keymap';

describe('keymap', () => {
    const originalPlatform = navigator.platform;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'platform', { value: originalPlatform, writable: true });
    });

    const metaConfig = {
        key: 's',
        metaKey: true,
        description: 'Save',
        action: 'save'
    };

    const ctrlConfig = {
        key: 's',
        ctrlKey: true,
        description: 'Save',
        action: 'save'
    };

    describe('isMac', () => {
        it('should return true for Mac platform', () => {
            Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true });
            expect(isMac()).toBe(true);
        });

        it('should return false for non-Mac platform', () => {
            Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
            expect(isMac()).toBe(false);
        });
    });

    describe('getModifierKey', () => {
        it('should return metaKey for Mac', () => {
            Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true });
            expect(getModifierKey()).toBe('metaKey');
        });

        it('should return ctrlKey for non-Mac', () => {
            Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
            expect(getModifierKey()).toBe('ctrlKey');
        });
    });

    describe('matchesKeymap', () => {
        it('should match meta key on Mac', () => {
            Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true });
            const event = { key: 's', metaKey: true, ctrlKey: false, shiftKey: false, altKey: false } as KeyboardEvent;
            expect(matchesKeymap(event, metaConfig)).toBe(true);
        });

        it('should match ctrl key on non-Mac', () => {
            Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
            const event = { key: 's', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false } as KeyboardEvent;
            expect(matchesKeymap(event, ctrlConfig)).toBe(true);
        });

        it('should match with Shift and Alt', () => {
            Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
            const config = { ...ctrlConfig, shiftKey: true, altKey: true };
            const event = { key: 's', ctrlKey: true, metaKey: false, shiftKey: true, altKey: true } as KeyboardEvent;
            expect(matchesKeymap(event, config)).toBe(true);
        });

        it('should not match if key is different', () => {
            const event = { key: 'a', metaKey: true } as KeyboardEvent;
            expect(matchesKeymap(event, metaConfig)).toBe(false);
        });
    });

    describe('getShortcutDisplay', () => {
        it('should show ⌘ for Mac', () => {
            Object.defineProperty(navigator, 'platform', { value: 'MacIntel', writable: true });
            expect(getShortcutDisplay(metaConfig)).toBe('⌘+S');
        });

        it('should show Ctrl for non-Mac', () => {
            Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
            expect(getShortcutDisplay(ctrlConfig)).toBe('Ctrl+S');
        });

        it('should include Shift and Alt if configured', () => {
            Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
            expect(getShortcutDisplay({ ...ctrlConfig, shiftKey: true, altKey: true })).toBe('Ctrl+Shift+Alt+S');
        });
    });

    describe('createKeymapHandler', () => {
        it('should call handler and prevent default if key matches', () => {
            Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });
            const handler = vi.fn();
            const event = {
                key: 's',
                ctrlKey: true,
                metaKey: false,
                shiftKey: false,
                altKey: false,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            } as unknown as KeyboardEvent;

            const keymapHandler = createKeymapHandler(ctrlConfig, handler);
            keymapHandler(event);

            expect(handler).toHaveBeenCalledWith(event);
            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
        });

        it('should not call handler if key does not match', () => {
            const handler = vi.fn();
            const event = { key: 'a' } as KeyboardEvent;
            const keymapHandler = createKeymapHandler(ctrlConfig, handler);
            keymapHandler(event);
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('registerGlobalShortcuts', () => {
        it('should add keydown listener and call appropriate handler', () => {
            const addSpy = vi.spyOn(document, 'addEventListener');
            const removeSpy = vi.spyOn(document, 'removeEventListener');
            const handler = vi.fn();
            const handlers = { 'save-request': handler };

            const cleanup = registerGlobalShortcuts(handlers);
            expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            const keyDownHandler = addSpy.mock.calls[0][1] as (e: KeyboardEvent) => void;
            Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });

            const event = {
                key: 's',
                ctrlKey: true,
                metaKey: false,
                shiftKey: false,
                altKey: false,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn()
            } as unknown as KeyboardEvent;

            keyDownHandler(event);

            expect(handler).toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();

            cleanup();
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });
    });
});

