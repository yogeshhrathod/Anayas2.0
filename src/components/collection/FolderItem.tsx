/**
 * FolderItem - Folder display with request count
 * 
 * Displays a folder with:
 * - Folder name and description
 * - Request count badge
 * - Action menu
 * - Drag and drop support
 * 
 * @example
 * ```tsx
 * <FolderItem
 *   folder={folder}
 *   requestCount={requestCount}
 *   onRequestSelect={handleRequestSelect}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   dragProps={dragProps}
 * />
 * ```
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { Folder, Plus, Edit, Trash2 } from 'lucide-react';
import { ActionMenu } from '../shared/ActionMenu';
import { Folder as FolderType } from '../../types/entities';
import { useStore } from '../../store/useStore';

export interface FolderItemProps {
  folder: FolderType;
  requestCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddRequest: () => void;
  onSelect?: () => void;
  dragProps?: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
  };
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  requestCount,
  onEdit,
  onDelete,
  onAddRequest,
  onSelect,
  dragProps
}) => {
  const { selectedItem } = useStore();
  const isSelected = selectedItem.type === 'folder' && selectedItem.id === folder.id;
  const actions = [
    { label: 'Add Request', icon: <Plus className="h-3 w-3" />, onClick: onAddRequest, shortcut: '⌘R' },
    { type: 'separator' as const },
    { label: 'Edit', icon: <Edit className="h-3 w-3" />, onClick: onEdit, shortcut: '⌘E' },
    { type: 'separator' as const },
    { label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: onDelete, destructive: true, shortcut: '⌘⌫' },
  ];

  return (
    <div
      className={`group flex items-center gap-2 p-2 pl-8 hover:bg-muted/50 rounded-md transition-colors cursor-pointer ${
        isSelected ? 'bg-primary/10 border border-primary/20' : ''
      }`}
      onClick={() => {
        if (onSelect) {
          onSelect();
        }
      }}
      {...dragProps}
    >
      {/* Folder Icon */}
      <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />

      {/* Folder Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {folder.name}
          </span>
        </div>
        {folder.description && (
          <p className="text-xs text-muted-foreground truncate">
            {folder.description}
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
