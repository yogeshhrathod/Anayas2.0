/**
 * StatusIndicator - Badge/status display used in multiple places
 * 
 * Provides consistent status indicators with:
 * - Color-coded status types
 * - Optional icons
 * - Consistent styling
 * - Support for custom variants
 * 
 * @example
 * ```tsx
 * <StatusIndicator
 *   type="success"
 *   text="Active"
 *   icon={<CheckCircle className="h-3 w-3" />}
 * />
 * ```
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface StatusIndicatorProps {
  type: StatusType;
  text: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const statusVariants: Record<StatusType, string> = {
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  default: 'bg-gray-500 text-white'
};

const statusIconColors: Record<StatusType, string> = {
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  default: 'text-gray-500'
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type,
  text,
  icon,
  className = '',
  variant = 'default'
}) => {
  if (variant === 'default') {
    return (
      <Badge 
        className={cn(
          'text-xs',
          statusVariants[type],
          className
        )}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {text}
      </Badge>
    );
  }

  return (
    <Badge 
      variant={variant}
      className={cn('text-xs', className)}
    >
      {icon && (
        <span className={cn('mr-1', statusIconColors[type])}>
          {icon}
        </span>
      )}
      {text}
    </Badge>
  );
};
