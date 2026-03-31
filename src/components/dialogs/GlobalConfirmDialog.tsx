import React from 'react';
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

  if (!options) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={options.title}
      description={options.message}
      maxWidth="sm"
    >
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleCancel}>
          {options.cancelText || 'Cancel'}
        </Button>
        <Button
          variant={options.variant || 'default'}
          onClick={handleConfirm}
        >
          {options.confirmText || 'Confirm'}
        </Button>
      </div>
    </Dialog>
  );
};
