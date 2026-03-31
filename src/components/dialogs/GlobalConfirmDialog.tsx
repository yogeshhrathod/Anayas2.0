import { AlertTriangle, Info } from 'lucide-react';
import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';

export const GlobalConfirmDialog: React.FC = () => {
  const { isOpen, options, resolve } = useStore(state => state.confirmState);

  const handleOpenChange = (open: boolean) => {
    if (!open && resolve) {
      // If user closes dialog via overlay click/escape, resolve false
      resolve(false);
    }
  };

  const handleConfirm = () => {
    if (resolve) resolve(true);
  };

  const handleCancel = () => {
    if (resolve) resolve(false);
  };

  // Listen for Enter key to confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isOpen) {
        e.preventDefault();
        handleConfirm();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
       window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleConfirm]);

  if (!options) return null;

  const isDestructive = options.variant === 'destructive';
  const Icon = isDestructive ? AlertTriangle : Info;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-xl">{options.title}</span>
        </div>
      }
      maxWidth="sm"
    >
      <div className="space-y-6 pt-2">
        <p className="text-muted-foreground leading-relaxed">
          {options.message}
        </p>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            className="hover:bg-muted font-medium transition-colors"
          >
            {options.cancelText || 'Cancel'}
          </Button>
          <Button
            variant={options.variant || 'default'}
            onClick={handleConfirm}
            className={`min-w-[120px] font-semibold shadow-sm transition-all hover:-translate-y-[1px] active:scale-[0.98] ${
              isDestructive ? 'bg-destructive hover:bg-destructive/90 text-white' : ''
            }`}
          >
            {options.confirmText || 'Confirm'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
