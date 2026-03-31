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
        variant: 'success',
        duration: options.duration || 3000,
        important: true,
      });
    },
    [toast]
  );

  const showError = useCallback(
    (message: string, details?: string, options: ToastOptions = {}) => {
      const truncatedDetails = details && details.length > 100 
        ? `${details.slice(0, 100)}...`
        : details;

      toast({
        title: options.title || 'Error',
        description: truncatedDetails ? `${message}: ${truncatedDetails}` : message,
        variant: 'destructive',
        duration: options.duration || 5000,
        important: true,
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
        important: false, // Info is usually not considered "important" enough for an alert
      });
    },
    [toast]
  );

  const showWarning = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast({
        title: options.title || 'Warning',
        description: message,
        variant: 'warning',
        duration: options.duration || 4000,
        important: true,
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
