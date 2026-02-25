import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useClickOutside } from '../../../../src/hooks/useClickOutside';

describe('useClickOutside', () => {
  it('should call onClose when clicking outside', () => {
    const onClose = vi.fn();
    const ref = { current: document.createElement('div') };
    document.body.appendChild(ref.current);

    renderHook(() => useClickOutside(ref as any, onClose, true));

    // Create an element outside the ref
    const outsideElement = document.createElement('span');
    document.body.appendChild(outsideElement);

    // Trigger mousedown on outside element
    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(onClose).toHaveBeenCalledTimes(1);
    
    document.body.removeChild(ref.current);
    document.body.removeChild(outsideElement);
  });

  it('should not call onClose when clicking inside', () => {
    const onClose = vi.fn();
    const ref = { current: document.createElement('div') };
    const insideElement = document.createElement('span');
    ref.current.appendChild(insideElement);
    document.body.appendChild(ref.current);

    renderHook(() => useClickOutside(ref as any, onClose, true));

    // Trigger mousedown on inside element
    const event = new MouseEvent('mousedown', { bubbles: true });
    insideElement.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
    
    document.body.removeChild(ref.current);
  });

  it('should call onClose when pressing Escape', () => {
    const onClose = vi.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useClickOutside(ref as any, onClose, true));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when inactive', () => {
    const onClose = vi.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useClickOutside(ref as any, onClose, false));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should respect handleEscape option', () => {
    const onClose = vi.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useClickOutside(ref as any, onClose, true, { handleEscape: false }));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
  });
});
