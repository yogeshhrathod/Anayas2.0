/**
 * useToastNotifications - Standardized toast message patterns
 *
 * Provides consistent toast notifications with:
 * - Predefined message patterns
 * - Success/error/info variants
 * - Consistent styling
 * - Action callbacks
 *
 * @example
 * ```tsx
 * const { showSuccess, showError, showInfo } = useToastNotifications();
 *
 * const handleSave = async () => {
 *   try {
 *     await saveData();
 *     showSuccess('Data saved successfully');
 *   } catch (error) {
 *     showError('Failed to save data', error.message);
 *   }
 * };
 * ```
 */

import { useCallback } from 'react';
import { toast } from 'sonner';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export function useToastNotifications() {
  const showSuccess = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast.success(options.title || 'Success', {
        description: message,
        duration: options.duration || 3000,
      });
    },
    []
  );

  const showError = useCallback(
    (message: string, details?: string, options: ToastOptions = {}) => {
      const truncatedDetails = details && details.length > 100 
        ? `${details.slice(0, 100)}...`
        : details;

      toast.error(options.title || 'Error', {
        description: truncatedDetails ? `${message}: ${truncatedDetails}` : message,
        duration: options.duration || 5000,
      });
    },
    []
  );

  const showInfo = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast.info(options.title || 'Info', {
        description: message,
        duration: options.duration || 3000,
      });
    },
    []
  );

  const showWarning = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast.warning(options.title || 'Warning', {
        description: message,
        duration: options.duration || 4000,
      });
    },
    []
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    toast,
  };
}
