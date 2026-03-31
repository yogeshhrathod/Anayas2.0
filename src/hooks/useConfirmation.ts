/**
 * useConfirmation - Confirm dialogs for destructive actions
 *
 * Provides a standardized confirmation dialog with:
 * - Customizable title and message
 * - Destructive action styling
 * - Promise-based API
 * - Consistent behavior across the app
 *
 * @example
 * ```tsx
 * const confirm = useConfirmation();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Collection',
 *     message: 'Are you sure you want to delete this collection? This action cannot be undone.',
 *     confirmText: 'Delete',
 *     variant: 'destructive'
 *   });
 *
 *   if (confirmed) {
 *     await deleteCollection();
 *   }
 * };
 * ```
 */

import { useCallback } from 'react';
import { useStore } from '../store/useStore';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function useConfirmation() {
  const setConfirmState = useStore(state => state.setConfirmState);

  const confirm = useCallback(
    (options: ConfirmationOptions): Promise<boolean> => {
      return new Promise(resolve => {
        setConfirmState({
          isOpen: true,
          options,
          resolve: (value: boolean) => {
            setConfirmState({ isOpen: false });
            resolve(value);
          },
        });
      });
    },
    [setConfirmState]
  );

  return { confirm };
}
