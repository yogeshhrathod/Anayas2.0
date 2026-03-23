import { describe, expect, it, vi, beforeEach } from 'vitest';
import { detectContext, isMac, getModifierKey } from '../../../../../src/lib/shortcuts/contexts';

describe('shortcuts-contexts', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      activeElement: { tagName: 'BODY', getAttribute: () => null }
    });
    vi.stubGlobal('navigator', {
      platform: 'MacIntel'
    });
  });

  describe('detectContext', () => {
    it('should return global only when in an input', () => {
      (document as any).activeElement = { tagName: 'INPUT' };
      const res = detectContext({ page: 'home', sidebarOpen: false, selectedItem: {} } as any);
      expect(res).toEqual(['global']);
    });

    it('should return context based on page', () => {
       expect(detectContext({ page: 'collections', sidebarOpen: false, selectedItem: { id: '', type: null }, focusedContext: 'page' } as any)).toContain('collections-page');
    expect(detectContext({ page: 'environments', sidebarOpen: false, selectedItem: { id: '', type: null }, focusedContext: 'page' } as any)).toContain('environments-page');
    expect(detectContext({ page: 'history', sidebarOpen: false, selectedItem: { id: '', type: null }, focusedContext: 'page' } as any)).toContain('history-page');
    expect(detectContext({ page: 'settings', sidebarOpen: false, selectedItem: { id: '', type: null }, focusedContext: 'page' } as any)).toContain('settings-page');
  });

  it('should detect sidebar item contexts', () => {
    const baseState = { page: 'collections', sidebarOpen: true, focusedContext: 'global' } as any;
    
    expect(detectContext({ ...baseState, selectedItem: { id: '1', type: 'collection' } })).toContain('sidebar:collection');
    expect(detectContext({ ...baseState, selectedItem: { id: '1', type: 'folder' } })).toContain('sidebar:folder');
    expect(detectContext({ ...baseState, selectedItem: { id: '1', type: 'request' } })).toContain('sidebar:request');
  });

    it('should return context based on sidebar state', () => {
       const res = detectContext({ 
         page: 'home', 
         sidebarOpen: true, 
         selectedItem: { type: 'collection' } 
       } as any);
       expect(res).toContain('sidebar');
       expect(res).toContain('sidebar:collection');
    });

    it('should return context based on focus', () => {
       const res = detectContext({
         page: 'home',
         focusedContext: 'sidebar',
         sidebarOpen: false,
         selectedItem: {}
       } as any);
       expect(res).toContain('sidebar');
    });
  });

  describe('isMac', () => {
    it('should return true for mac platforms', () => {
       (navigator as any).platform = 'MacIntel';
       expect(isMac()).toBe(true);
    });

    it('should return false for windows', () => {
       (navigator as any).platform = 'Win32';
       expect(isMac()).toBe(false);
    });
  });

  describe('getModifierKey', () => {
    it('should return metaKey for mac', () => {
       (navigator as any).platform = 'MacIntel';
       expect(getModifierKey()).toBe('metaKey');
    });

    it('should return ctrlKey for others', () => {
       (navigator as any).platform = 'Win32';
       expect(getModifierKey()).toBe('ctrlKey');
    });
  });
});
