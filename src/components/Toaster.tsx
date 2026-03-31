import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import {
  Toast,
  ToastProvider,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
} from './ui/toast';
import { useToastStore } from './ui/use-toast';

export function Toaster() {
  const { toasts, dismissToast, removeToast } = useToastStore();

  return (
    <ToastProvider duration={4000} swipeDirection="right" label="Notifications">
      {toasts.map(
        ({ id, title, description, action, variant = 'default', duration = 4000, ...props }) => (
          <Toast
            key={id}
            variant={variant as any}
            duration={duration}
            onOpenChange={open => {
              if (!open) {
                // mark closed then remove after delay
                dismissToast(id);
                setTimeout(() => removeToast(id), 1000);
              }
            }}
            {...props}
            open={props.open ?? true}
          >
            <div className="flex flex-col w-full">
              <div className="flex items-start gap-3 flex-1 pb-2">
                {variant === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : variant === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                ) : variant === 'destructive' ? (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                ) : null}
                <div className="grid gap-1 flex-1">
                  {title ? <ToastTitle>{title}</ToastTitle> : null}
                  {description ? (
                    <ToastDescription>{description}</ToastDescription>
                  ) : null}
                  {action ? <div className="mt-2">{action}</div> : null}
                </div>
              </div>
            </div>
            <ToastClose />
          </Toast>
        )
      )}
      <ToastViewport />
    </ToastProvider>
  );
}

export default Toaster;
