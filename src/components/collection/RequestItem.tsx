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

import { Copy, Download, Edit, Trash2 } from 'lucide-react';
import React from 'react';
import { useInlineEdit } from '../../hooks/useInlineEdit';
import logger from '../../lib/logger';
import { useStore } from '../../store/useStore';
import { Request } from '../../types/entities';
import { ActionMenu } from '../shared/ActionMenu';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

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
  isDragging?: boolean;
  isDragOver?: boolean;
  dropPosition?: 'above' | 'below' | 'inside' | null;
  level?: number;
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
  dragProps,
  isDragging = false,
  isDragOver = false,
  dropPosition = null,
  level = 0,
}) => {
  const sidebarCompactMode = useStore(state => state.sidebarCompactMode);
  const lastStatus = useStore(state => state.lastRequestStatuses[String(request.id)]);
  const selectedItem = useStore(state => state.selectedItem);
  const triggerSidebarRefresh = useStore(state => state.triggerSidebarRefresh);
  const isRequestLoading = useStore(state => !!state.loadingRequests[String(request.id)]);
  const isSelected =
    selectedItem.type === 'request' && selectedItem.id === request.id;
  const inlineEdit = useInlineEdit({
    initialValue: request.name,
    onSave: async newName => {
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
          isFavorite: request.isFavorite ? 1 : 0,
        });

        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
      } catch (error) {
        logger.error('Failed to update request name', { error });
        throw error; // Re-throw to let useInlineEdit handle the error
      }
    },
    validate: value => {
      if (!value.trim()) {
        return 'Request name cannot be empty';
      }
      return undefined;
    },
  });

  const actions = [
    {
      label: 'Edit',
      icon: <Edit className="h-3 w-3" />,
      onClick: () => { onEdit(); inlineEdit.startEdit(); },
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
        data-request-id={request.id}
        className={cn(
          "group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer relative mx-1 mb-1 transition-all duration-200",
          isSelected 
            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          isDragging && "opacity-50",
          isDragOver && dropPosition === "inside" && "bg-primary/5 ring-1 ring-primary/30",
          sidebarCompactMode && "py-1 mb-0",
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => {
          onSelect(request);
          if (onItemSelect) {
            onItemSelect();
          }
        }}
        {...dragProps}
      >
        {/* Activity indicator for loading requests */}
        {isRequestLoading ? (
          <div className="absolute left-2 w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]">
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />
          </div>
        ) : lastStatus && (
          <div 
            className={cn(
              "absolute left-2 w-2 h-2 rounded-full transition-all duration-300",
              lastStatus >= 200 && lastStatus < 300 ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" :
              lastStatus >= 400 ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" :
              "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]"
            )}
          />
        )}

        {/* Method Badge */}
        <Badge
          variant="secondary"
          className={`h-5 px-1.5 text-xs text-white font-mono ${
            methodColors[request.method as keyof typeof methodColors] ||
            'bg-gray-500'
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
              onChange={e => inlineEdit.setEditValue(e.target.value)}
              onBlur={inlineEdit.saveEdit}
              onKeyDown={inlineEdit.handleKeyDown}
              className="h-6 text-sm"
              placeholder="Request name"
            />
          ) : (
            <div
              className={`text-sm font-medium truncate ${isSelected ? 'text-primary drop-shadow-sm' : 'group-hover:text-foreground'}`}
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
        <ActionMenu actions={actions} size="sm" />
      </div>

      {/* Drop indicator line below */}
      {isDragOver && dropPosition === 'below' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
      )}
    </div>
  );
};
