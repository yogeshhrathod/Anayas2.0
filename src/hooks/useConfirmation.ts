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

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export interface ConfirmationState {
  isOpen: boolean;
  options: ConfirmationOptions | null;
  resolve: ((value: boolean) => void) | null;
}

export function useConfirmation() {
  const confirm = useCallback(
    (options: ConfirmationOptions): Promise<boolean> => {
      return new Promise(resolve => {
        // For now, use native confirm dialog
        // TODO: Replace with proper modal when AlertDialog is available
        const result = window.confirm(`${options.title}\n\n${options.message}`);
        resolve(result);
      });
    },
    []
  );

  return {
    confirm,
  };
}
