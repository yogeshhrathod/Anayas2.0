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

import {
    ChevronDown,
    ChevronRight,
    Edit,
    Folder,
    Plus,
    Trash2,
} from 'lucide-react';
import React from 'react';
import { useInlineEdit } from '../../hooks/useInlineEdit';
import { useStore } from '../../store/useStore';
import { Folder as FolderType } from '../../types/entities';
import { ActionMenu } from '../shared/ActionMenu';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface FolderItemProps {
  folder: FolderType;
  requestCount: number;
  isExpanded: boolean;
  onToggle: () => void;
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
    onDragLeave?: (e: React.DragEvent<HTMLElement>) => void;
  };
  isDragging?: boolean;
  isDragOver?: boolean;
  dropPosition?: 'above' | 'below' | 'inside' | null;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  requestCount,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddRequest,
  onSelect,
  dragProps,
  isDragging = false,
  isDragOver = false,
  dropPosition = null,
}) => {
  const { selectedItem, triggerSidebarRefresh } = useStore();
  const isSelected =
    selectedItem.type === 'folder' && selectedItem.id === folder.id;
  const inlineEdit = useInlineEdit({
    initialValue: folder.name,
    onSave: async newName => {
      try {
        await window.electronAPI.folder.save({
          id: folder.id,
          name: newName,
          description: folder.description || '',
          collectionId: folder.collectionId,
        });

        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
      } catch (error) {
        console.error('Failed to update folder name:', error);
        throw error; // Re-throw to let useInlineEdit handle the error
      }
    },
    validate: value => {
      if (!value.trim()) {
        return 'Folder name cannot be empty';
      }
      return undefined;
    },
  });

  const actions = [
    {
      label: 'Add Request',
      icon: <Plus className="h-3 w-3" />,
      onClick: onAddRequest,
      shortcut: '⌘R',
    },
    { type: 'separator' as const },
    {
      label: 'Edit',
      icon: <Edit className="h-3 w-3" />,
      onClick: onEdit,
      shortcut: '⌘E',
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
        className={`group flex items-center gap-2.5 px-3 py-2 pl-8 mx-1 mb-1 rounded-lg cursor-pointer transition-all duration-200 relative ${
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

        {/* Folder Icon */}
        <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {/* Folder Name */}
        <div className="flex-1 min-w-0">
          {inlineEdit.isEditing ? (
            <Input
              ref={inlineEdit.inputRef}
              value={inlineEdit.editValue}
              onChange={e => inlineEdit.setEditValue(e.target.value)}
              onBlur={inlineEdit.saveEdit}
              onKeyDown={inlineEdit.handleKeyDown}
              className="h-6 text-sm"
              placeholder="Folder name"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div
              className={`text-sm font-medium truncate transition-colors ${isSelected ? 'text-primary drop-shadow-sm' : 'group-hover:text-foreground'}`}
              onDoubleClick={e => {
                e.stopPropagation();
                inlineEdit.startEdit();
              }}
              title="Double-click to edit name"
            >
              {folder.name}
            </div>
          )}
          {folder.description && !inlineEdit.isEditing && (
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
        <ActionMenu actions={actions} size="sm" />
      </div>

      {/* Drop indicator line below */}
      {isDragOver && dropPosition === 'below' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
      )}
    </div>
  );
};
