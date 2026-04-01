import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

export type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  important?: boolean;
  open?: boolean;
  duration?: number;
};

// Keep the store for any remaining dependencies, but mark as legacy
export const useToastStore = {
  getState: () => ({
    addToast: (props: any) => toast(props),
  }),
  subscribe: () => () => {},
  toasts: [],
  dismissToast: () => {},
  removeToast: () => {},
};

export function useToast() {
  return React.useMemo(
    () => ({
      toast: (props: Omit<Toast, 'id'>) => toast(props),
      dismiss: (id?: string) => sonnerToast.dismiss(id),
      success: (title: React.ReactNode, description?: React.ReactNode) =>
        sonnerToast.success(String(title), { description: String(description) }),
      error: (title: React.ReactNode, description?: React.ReactNode) =>
        sonnerToast.error(String(title), { description: String(description) }),
      warning: (title: React.ReactNode, description?: React.ReactNode) =>
        sonnerToast.warning(String(title), { description: String(description) }),
    }),
    []
  );
}

export const toast = (props: Omit<Toast, 'id'>) => {
  const { title, description, variant, duration } = props;
  const options = { description: String(description), duration };
  
  switch (variant) {
    case 'success':
      return sonnerToast.success(String(title), options);
    case 'destructive':
      return sonnerToast.error(String(title), options);
    case 'warning':
      return sonnerToast.warning(String(title), options);
    default:
      return sonnerToast(String(title), options);
  }
};

