/**
 * Hook to provide current shortcut context
 */

import { useEffect, useState } from 'react';
import { ContextState } from '../lib/shortcuts/types';
import { useStore } from '../store/useStore';

export function useShortcutContext(): ContextState {
  const currentPage = useStore(state => state.currentPage);
  const selectedItem = useStore(state => state.selectedItem);
  const selectedRequest = useStore(state => state.selectedRequest);
  const focusedContext = useStore(state => state.focusedContext);

  const [focusedElement, setFocusedElement] = useState<Element | null>(null);

  useEffect(() => {
    const handleFocus = () => {
      setFocusedElement(document.activeElement);
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  return {
    page: currentPage,
    selectedItem,
    selectedRequest,
    focusedElement,
    sidebarOpen: true, // TODO: Get this from App.tsx or store
    focusedContext,
  };
}
