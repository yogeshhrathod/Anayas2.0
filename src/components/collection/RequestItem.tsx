/**
 * RequestItem - Individual request with inline editing
 * 
 * Displays a request with:
 * - Request name with inline editing
 * - Method badge
 * - Action menu
 * - Drag and drop support
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
import { FileText } from 'lucide-react';
import { ActionMenu } from '../shared/ActionMenu';
import { useInlineEdit } from '../../hooks/useInlineEdit';
import { Request } from '../../types/entities';

export interface RequestItemProps {
  request: Request;
  onSelect: (request: Request) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
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
  dragProps
}) => {
  const inlineEdit = useInlineEdit({
    initialValue: request.name,
    onSave: async (newName) => {
      // This would typically call an API to update the request name
      console.log('Saving request name:', newName);
    },
    validate: (value) => {
      if (!value.trim()) {
        return 'Request name cannot be empty';
      }
      return undefined;
    }
  });

  const actions = [
    { label: 'Edit', icon: <span>✏️</span>, onClick: onEdit },
    { label: 'Duplicate', icon: <span>📋</span>, onClick: onDuplicate },
    { type: 'separator' as const },
    { label: 'Export', icon: <span>📤</span>, onClick: onExport },
    { type: 'separator' as const },
    { label: 'Delete', icon: <span>🗑️</span>, onClick: onDelete, destructive: true },
  ];

  return (
    <div
      className="group flex items-center gap-2 p-2 pl-8 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
      onClick={() => onSelect(request)}
      {...dragProps}
    >
      {/* Request Icon */}
      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />

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

      {/* Method Badge */}
      <Badge 
        variant="secondary" 
        className={`h-5 px-1.5 text-xs text-white font-mono ${
          methodColors[request.method as keyof typeof methodColors] || 'bg-gray-500'
        }`}
      >
        {request.method}
      </Badge>

      {/* Favorite Indicator */}
      {request.is_favorite && (
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
