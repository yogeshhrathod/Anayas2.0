/**
 * RequestItem - Individual request with inline editing
 * 
 * Displays a request with:
 * - HTTP method badge displayed before the request name
 * - Request name with inline editing
 * - Action menu
 * - Drag and drop support
 * - No request icon (cleaner layout)
 * 
 * @example
 * ```tsx
 * <RequestItem
 *   request={request}
 *   onSelect={handleSelect}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onDuplicate={handleDuplicate}
 *   dragProps={dragProps}
 * />
 * ```
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Edit, Copy, Download, Trash2 } from 'lucide-react';
import { ActionMenu } from '../shared/ActionMenu';
import { useInlineEdit } from '../../hooks/useInlineEdit';
import { Request } from '../../types/entities';
import { useStore } from '../../store/useStore';

export interface RequestItemProps {
  request: Request;
  onSelect: (request: Request) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onItemSelect?: () => void;
  dragProps?: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
  };
}

const methodColors = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-orange-500',
  PATCH: 'bg-purple-500',
  DELETE: 'bg-red-500',
  HEAD: 'bg-gray-500',
  OPTIONS: 'bg-gray-500',
};

export const RequestItem: React.FC<RequestItemProps> = ({
  request,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  onItemSelect,
  dragProps
}) => {
  const { selectedItem, triggerSidebarRefresh } = useStore();
  const isSelected = selectedItem.type === 'request' && selectedItem.id === request.id;
  const inlineEdit = useInlineEdit({
    initialValue: request.name,
    onSave: async (newName) => {
      try {
        await window.electronAPI.request.save({
          id: request.id,
          name: newName,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          queryParams: request.queryParams || [],
          auth: request.auth,
          collectionId: request.collectionId,
          folderId: request.folderId,
          isFavorite: Boolean(request.isFavorite),
        });
        
        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
      } catch (error) {
        console.error('Failed to update request name:', error);
        throw error; // Re-throw to let useInlineEdit handle the error
      }
    },
    validate: (value) => {
      if (!value.trim()) {
        return 'Request name cannot be empty';
      }
      return undefined;
    }
  });

  const actions = [
    { label: 'Edit', icon: <Edit className="h-3 w-3" />, onClick: onEdit, shortcut: '⌘E' },
    { label: 'Duplicate', icon: <Copy className="h-3 w-3" />, onClick: onDuplicate, shortcut: '⌘D' },
    { type: 'separator' as const },
    { label: 'Export', icon: <Download className="h-3 w-3" />, onClick: onExport, shortcut: '⌘⇧E' },
    { type: 'separator' as const },
    { label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: onDelete, destructive: true, shortcut: '⌘⌫' },
  ];

  return (
    <div
      className={`group flex items-center gap-2 p-2 pl-8 hover:bg-muted/50 rounded-md transition-colors cursor-pointer ${
        isSelected ? 'bg-primary/10 border border-primary/20' : ''
      }`}
      onClick={() => {
        onSelect(request);
        if (onItemSelect) {
          onItemSelect();
        }
      }}
      {...dragProps}
    >
      {/* Method Badge */}
      <Badge 
        variant="secondary" 
        className={`h-5 px-1.5 text-xs text-white font-mono ${
          methodColors[request.method as keyof typeof methodColors] || 'bg-gray-500'
        }`}
      >
        {request.method}
      </Badge>

      {/* Request Name */}
      <div className="flex-1 min-w-0">
        {inlineEdit.isEditing ? (
          <Input
            ref={inlineEdit.inputRef}
            value={inlineEdit.editValue}
            onChange={(e) => inlineEdit.setEditValue(e.target.value)}
            onBlur={inlineEdit.saveEdit}
            onKeyDown={inlineEdit.handleKeyDown}
            className="h-6 text-sm"
            placeholder="Request name"
          />
        ) : (
          <div
            className="text-sm font-medium truncate"
            onDoubleClick={inlineEdit.startEdit}
            title="Double-click to edit name"
          >
            {request.name}
          </div>
        )}
      </div>

      {/* Favorite Indicator */}
      {request.isFavorite === 1 && (
        <Badge variant="secondary" className="h-4 px-1 text-xs">
          ★
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
