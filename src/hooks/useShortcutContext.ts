/**
 * Hook to provide current shortcut context
 */

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ContextState } from '../lib/shortcuts/types';

export function useShortcutContext(): ContextState {
  const { 
    currentPage, 
    selectedItem, 
    selectedRequest, 
    focusedContext
  } = useStore();
  
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
    focusedContext
  };
}
