/**
 * CollectionGrid - Grid layout component for displaying collections
 *
 * Features:
 * - Responsive grid layout
 * - Empty state handling
 * - Loading state support
 *
 * @example
 * ```tsx
 * <CollectionGrid
 *   collections={collections}
 *   isLoading={isLoading}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onDuplicate={handleDuplicate}
 *   onToggleFavorite={handleToggleFavorite}
 * />
 * ```
 */

import React from 'react';
import { CollectionCard } from './CollectionCard';
import { EmptyState } from '../shared/EmptyState';
import { Button } from '../ui/button';
import { Collection } from '../../types/entities';

export interface CollectionGridProps {
  collections: Collection[];
  requestCounts: Record<number, number>;
  isLoading?: boolean;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onDuplicate: (collection: Collection) => void;
  onToggleFavorite: (collection: Collection) => void;
  onExport?: (collection: Collection) => void;
  onImport?: (collection: Collection) => void;
  onRun?: (collection: Collection) => void;
}

export const CollectionGrid: React.FC<CollectionGridProps> = ({
  collections,
  requestCounts,
  isLoading = false,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onExport,
  onImport,
  onRun,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-6xl">📁</span>}
        title="No Collections"
        description="Create your first collection to organize your API requests"
        action={
          <Button onClick={() => onEdit({} as Collection)}>
            Create Collection
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map(collection => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          requestCount={requestCounts[collection.id!] || 0}
          onEdit={() => onEdit(collection)}
          onDelete={() => onDelete(collection)}
          onDuplicate={() => onDuplicate(collection)}
          onToggleFavorite={() => onToggleFavorite(collection)}
          onExport={onExport ? () => onExport(collection) : undefined}
          onImport={onImport ? () => onImport(collection) : undefined}
          onRun={onRun ? () => onRun(collection) : undefined}
        />
      ))}
    </div>
  );
};
