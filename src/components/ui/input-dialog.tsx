import * as React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Dialog } from './dialog';

interface InputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  confirmText?: string;
  cancelText?: string;
}

export function InputDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder = 'Enter value',
  defaultValue = '',
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: InputDialogProps) {
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (open) {
      setValue(defaultValue);
    }
  }, [open, defaultValue]);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="input-dialog">Name</Label>
          <Input
            id="input-dialog"
            placeholder={placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button onClick={handleConfirm} disabled={!value.trim()}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
