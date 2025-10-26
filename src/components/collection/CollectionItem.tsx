/**
 * CollectionItem - Single collection with expand/collapse
 * 
 * Displays a collection with:
 * - Expand/collapse functionality
 * - Collection name and metadata
 * - Action menu
 * - Drag and drop support
 * 
 * @example
 * ```tsx
 * <CollectionItem
 *   collection={collection}
 *   isExpanded={isExpanded}
 *   onToggle={handleToggle}
 *   onRequestSelect={handleRequestSelect}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   dragProps={dragProps}
 * />
 * ```
 */

import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';
import { ActionMenu } from '../shared/ActionMenu';
import { Collection } from '../../types/entities';

export interface CollectionItemProps {
  collection: Collection;
  isExpanded: boolean;
  requestCount: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddRequest: () => void;
  onAddFolder: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onImport: () => void;
  dragProps?: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
  };
}

export const CollectionItem: React.FC<CollectionItemProps> = ({
  collection,
  isExpanded,
  requestCount,
  onToggle,
  onEdit,
  onDelete,
  onAddRequest,
  onAddFolder,
  onDuplicate,
  onExport,
  onImport,
  dragProps
}) => {
  const actions = [
    { label: 'Add Request', icon: <span>+</span>, onClick: onAddRequest },
    { label: 'Add Folder', icon: <span>📁</span>, onClick: onAddFolder },
    { type: 'separator' as const },
    { label: 'Edit', icon: <span>✏️</span>, onClick: onEdit },
    { label: 'Duplicate', icon: <span>📋</span>, onClick: onDuplicate },
    { type: 'separator' as const },
    { label: 'Export', icon: <span>📤</span>, onClick: onExport },
    { label: 'Import', icon: <span>📥</span>, onClick: onImport },
    { type: 'separator' as const },
    { label: 'Delete', icon: <span>🗑️</span>, onClick: onDelete, destructive: true },
  ];

  return (
    <div
      className="group flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors"
      {...dragProps}
    >
      {/* Expand/Collapse Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-6 w-6 p-0"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Collection Icon */}
      <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />

      {/* Collection Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {collection.name}
          </span>
          {collection.is_favorite && (
            <Badge variant="secondary" className="h-4 px-1 text-xs">
              ★
            </Badge>
          )}
        </div>
        {collection.description && (
          <p className="text-xs text-muted-foreground truncate">
            {collection.description}
          </p>
        )}
      </div>

      {/* Request Count */}
      {requestCount > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-xs">
          {requestCount}
        </Badge>
      )}

      {/* Action Menu */}
      <ActionMenu
        actions={actions}
        size="sm"
      />
    </div>
  );
};
