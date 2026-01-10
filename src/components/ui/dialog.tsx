import { X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode; // Support both string and ReactNode for custom headers
  description?: string | React.ReactNode; // Support both string and ReactNode
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = '',
  maxWidth = 'md',
  showCloseButton = true,
}: DialogProps) {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  const dialogContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-dialog p-4"
      onClick={handleBackdropClick}
    >
      <Card className={`w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-hidden flex flex-col ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <CardTitle className="text-xl">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">
                {description}
              </CardDescription>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4 max-h-[calc(90vh-120px)]">
          {children}
        </CardContent>
      </Card>
    </div>
  );

  // Render dialog in a portal to ensure it's at the document root level, outside any form elements
  return createPortal(dialogContent, document.body);
}

