/**
 * CollectionItem - Single collection with expand/collapse
 * 
 * Displays a collection with:
 * - Expand/collapse functionality
 * - Collection name (no description shown)
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
import { useStore } from '../../store/useStore';

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
  onSelect?: () => void;
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
  onSelect,
  dragProps
}) => {
  const { selectedItem } = useStore();
  const isSelected = selectedItem.type === 'collection' && selectedItem.id === collection.id;
  const actions = [
    { label: 'Add Request', onClick: onAddRequest, shortcut: '⌘R' },
    { label: 'Add Folder', onClick: onAddFolder, shortcut: '⌘⇧N' },
    { type: 'separator' as const },
    { label: 'Edit', onClick: onEdit, shortcut: '⌘E' },
    { label: 'Duplicate', onClick: onDuplicate, shortcut: '⌘D' },
    { type: 'separator' as const },
    { label: 'Export', onClick: onExport, shortcut: '⌘⇧E' },
    { label: 'Import', onClick: onImport, shortcut: '⌘⇧I' },
    { type: 'separator' as const },
    { label: 'Delete', onClick: onDelete, destructive: true, shortcut: '⌘⌫' },
  ];

  return (
    <div
      className={`group flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer ${
        isSelected ? 'bg-primary/10 border border-primary/20' : ''
      }`}
      onClick={() => {
        onToggle();
        if (onSelect) {
          onSelect();
        }
      }}
      {...dragProps}
    >
      {/* Expand/Collapse Button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 pointer-events-none"
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
          {collection.isFavorite === 1 && (
            <Badge variant="secondary" className="h-4 px-1 text-xs">
              ★
            </Badge>
          )}
        </div>
      </div>

      {/* Request Count */}
      {requestCount > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-xs">
          {requestCount}
        </Badge>
      )}

      {/* Action Menu */}
      <div onClick={(e) => e.stopPropagation()}>
        <ActionMenu
          actions={actions}
          size="sm"
        />
      </div>
    </div>
  );
};
