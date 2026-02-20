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
import { useToast } from '../components/ui/use-toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export function useToastNotifications() {
  const { toast } = useToast();

  const showSuccess = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast({
        title: options.title || 'Success',
        description: message,
        variant: 'default',
        duration: options.duration || 3000,
      });
    },
    [toast]
  );

  const showError = useCallback(
    (message: string, details?: string, options: ToastOptions = {}) => {
      toast({
        title: options.title || 'Error',
        description: details ? `${message}: ${details}` : message,
        variant: 'destructive',
        duration: options.duration || 5000,
      });
    },
    [toast]
  );

  const showInfo = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast({
        title: options.title || 'Info',
        description: message,
        variant: 'default',
        duration: options.duration || 3000,
      });
    },
    [toast]
  );

  const showWarning = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast({
        title: options.title || 'Warning',
        description: message,
        variant: 'default',
        duration: options.duration || 4000,
      });
    },
    [toast]
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    toast,
  };
}
