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

import {
    ChevronDown,
    ChevronRight,
    Copy,
    Download,
    Edit,
    Folder,
    Plus,
    Trash2,
    Upload,
} from 'lucide-react';
import React from 'react';
import { useStore } from '../../store/useStore';
import { Collection } from '../../types/entities';
import { ActionMenu } from '../shared/ActionMenu';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

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
    onDragLeave?: (e: React.DragEvent<HTMLElement>) => void;
  };
  isDragging?: boolean;
  isDragOver?: boolean;
  dropPosition?: 'above' | 'below' | 'inside' | null;
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
  dragProps,
  isDragging = false,
  isDragOver = false,
  dropPosition = null,
}) => {
  const { selectedItem } = useStore();
  const isSelected =
    selectedItem.type === 'collection' && selectedItem.id === collection.id;
  const actions = [
    {
      label: 'Add Request',
      icon: <Plus className="h-3 w-3" />,
      onClick: onAddRequest,
      shortcut: '⌘R',
    },
    {
      label: 'Add Folder',
      icon: <Folder className="h-3 w-3" />,
      onClick: onAddFolder,
      shortcut: '⌘⇧N',
    },
    { type: 'separator' as const },
    {
      label: 'Edit',
      icon: <Edit className="h-3 w-3" />,
      onClick: onEdit,
      shortcut: '⌘E',
    },
    {
      label: 'Duplicate',
      icon: <Copy className="h-3 w-3" />,
      onClick: onDuplicate,
      shortcut: '⌘D',
    },
    { type: 'separator' as const },
    {
      label: 'Export',
      icon: <Download className="h-3 w-3" />,
      onClick: onExport,
      shortcut: '⌘⇧E',
    },
    {
      label: 'Import',
      icon: <Upload className="h-3 w-3" />,
      onClick: onImport,
      shortcut: '⌘⇧I',
    },
    { type: 'separator' as const },
    {
      label: 'Delete',
      icon: <Trash2 className="h-3 w-3" />,
      onClick: onDelete,
      destructive: true,
      shortcut: '⌘⌫',
    },
  ];

  return (
    <div className="relative">
      {/* Drop indicator line above */}
      {isDragOver && dropPosition === 'above' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />
      )}

      <div
        className={`group flex items-center gap-2.5 px-3 py-2 mx-1 mb-1 rounded-lg cursor-pointer transition-all duration-200 relative ${
          isSelected 
            ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        } ${isDragging ? 'opacity-50' : ''} ${
          isDragOver && dropPosition === 'inside'
            ? 'bg-primary/5 ring-1 ring-primary/30'
            : ''
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
          className="h-6 w-6 p-0 hover:bg-transparent -ml-1.5 focus:ring-0 pointer-events-none text-current"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* Colorful Dot Indicator */}
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            collection.isFavorite === 1 ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
        ></div>

        {/* Collection Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate transition-colors ${isSelected ? 'text-primary drop-shadow-sm' : 'group-hover:text-foreground'}`}>
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
        <div onClick={e => e.stopPropagation()}>
          <ActionMenu actions={actions} size="sm" />
        </div>
      </div>

      {/* Drop indicator line below */}
      {isDragOver && dropPosition === 'below' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
      )}
    </div>
  );
};
