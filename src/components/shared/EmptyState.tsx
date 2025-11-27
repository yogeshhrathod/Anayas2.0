/**
 * EmptyState - Consistent empty state with icon, message, and CTA
 *
 * Provides a standardized empty state with:
 * - Large icon display
 * - Title and description
 * - Optional call-to-action button
 * - Consistent styling and spacing
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FolderPlus className="h-12 w-12" />}
 *   title="No collections yet"
 *   description="Create your first collection to organize your API requests"
 *   action={<Button>Create Collection</Button>}
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'card' | 'minimal';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  variant = 'card',
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  if (variant === 'minimal') {
    return <div className={cn('', className)}>{content}</div>;
  }

  return (
    <Card className={cn('', className)}>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
