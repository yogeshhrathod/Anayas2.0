/**
 * EntityCard - Reusable card component for collections, environments, history items
 * 
 * Provides a consistent card layout with:
 * - Header with title, subtitle, and optional icon
 * - Content area with metadata
 * - Footer with action buttons
 * - Optional status indicators
 * 
 * @example
 * ```tsx
 * <EntityCard
 *   title="My Collection"
 *   subtitle="API Collection"
 *   icon={<FolderOpen className="h-5 w-5" />}
 *   metadata={[
 *     { label: 'Requests', value: '5' },
 *     { label: 'Last Used', value: '2 days ago' }
 *   ]}
 *   actions={<Button>Edit</Button>}
 *   status={{ type: 'success', text: 'Active' }}
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export interface EntityCardMetadata {
  label: string;
  value: string | number;
}

export interface EntityCardStatus {
  type: 'success' | 'warning' | 'error' | 'info' | 'default';
  text: string;
}

export interface EntityCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  metadata?: EntityCardMetadata[];
  actions?: React.ReactNode;
  status?: EntityCardStatus;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const statusVariants = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  default: 'bg-gray-500'
};

export const EntityCard: React.FC<EntityCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  metadata = [],
  actions,
  status,
  className = '',
  onClick,
  children
}) => {
  return (
    <Card 
      className={cn(
        'hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer hover:bg-accent/5',
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
              {status && (
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs', statusVariants[status.type])}
                >
                  {status.text}
                </Badge>
              )}
            </CardTitle>
            {subtitle && (
              <CardDescription className="mt-1">{subtitle}</CardDescription>
            )}
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Metadata */}
        {metadata.length > 0 && (
          <div className="space-y-1 text-xs text-muted-foreground">
            {metadata.map((item, index) => (
              <div key={index}>
                {item.label}: {item.value}
              </div>
            ))}
          </div>
        )}

        {/* Custom content */}
        {children}

        {/* Actions */}
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
