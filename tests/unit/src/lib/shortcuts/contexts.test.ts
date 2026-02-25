import { describe, expect, it } from 'vitest';
import { detectContext } from '../../../../../src/lib/shortcuts/contexts';

describe('detectContext', () => {
  const baseState = {
    page: 'home',
    selectedItem: { type: null, id: null, data: null },
    selectedRequest: null,
    focusedElement: null,
    sidebarOpen: false,
    focusedContext: null
  } as any;

  it('should always include global context', () => {
    const contexts = detectContext(baseState);
    expect(contexts).toContain('global');
  });

  it('should return only global when typing in input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const contexts = detectContext(baseState);
    expect(contexts).toEqual(['global']);
    
    document.body.removeChild(input);
  });

  it('should detect sidebar contexts', () => {
    const state = {
      ...baseState,
      sidebarOpen: true,
      selectedItem: { type: 'request', id: 1, data: {} }
    };
    const contexts = detectContext(state);
    expect(contexts).toContain('sidebar');
    expect(contexts).toContain('sidebar:request');
  });

  it('should detect page contexts', () => {
    expect(detectContext({ ...baseState, page: 'collections' })).toContain('collections-page');
    expect(detectContext({ ...baseState, page: 'environments' })).toContain('environments-page');
  });

  it('should detect editor context on home page', () => {
    expect(detectContext({ ...baseState, page: 'home' })).toContain('editor');
  });
});
