import { useCallback } from 'react';

/**
 * Hook to create event handlers that prevent default and stop propagation
 * Useful for buttons inside forms to prevent form submission
 */
export function useStopPropagation<T extends (...args: any[]) => any>(
  handler: T
): (e: React.MouseEvent) => void {
  return useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handler();
  }, [handler]);
}

/**
 * Hook to create event handlers that prevent default and stop propagation
 * with access to the event object
 */
export function useStopPropagationWithEvent<T extends (e: React.MouseEvent, ...args: any[]) => any>(
  handler: T
): (e: React.MouseEvent) => void {
  return useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handler(e);
  }, [handler]);
}

