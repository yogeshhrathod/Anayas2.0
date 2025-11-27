/**
 * PageLayout - Standard page wrapper with header, title, description, and action buttons
 *
 * Provides a consistent layout structure for all pages with:
 * - Page header with title and description
 * - Action buttons area
 * - Main content area
 * - Optional breadcrumbs
 *
 * @example
 * ```tsx
 * <PageLayout
 *   title="Collections"
 *   description="Organize your API requests into collections"
 *   actions={<Button>New Collection</Button>}
 * >
 *   <CollectionGrid />
 * </PageLayout>
 * ```
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  actions,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      <div className={cn('flex items-center justify-between', headerClassName)}>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {/* Page Content */}
      <div className={cn('', contentClassName)}>{children}</div>
    </div>
  );
};
