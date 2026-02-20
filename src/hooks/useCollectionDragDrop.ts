/**
 * useCollectionDragDrop - Drag and drop logic hook
 * 
 * Provides drag and drop functionality for collections, folders, and requests:
 * - Drag state management
 * - Drop zone handling
 * - Visual feedback with drop position indicators
 * - Move operations (between containers)
 * - Reorder operations (within same container)
 * 
 * @example
 * ```tsx
 * const {
 *   draggedItem,
 *   dragOverItem,
 *   dropPosition,
 *   handleDragStart,
 *   handleDragOver,
 *   handleDrop,
 *   handleDragEnd
 * } = useCollectionDragDrop({
 *   onMoveRequest: handleMoveRequest,
 *   onMoveFolder: handleMoveFolder,
 *   onReorderRequest: handleReorderRequest,
 *   onReorderFolder: handleReorderFolder,
 *   resolveFolderCollectionId: (folderId) => getCollectionIdForFolder(folderId)
 * });
 * ```
 */

import { useCallback, useState } from 'react';
import { EntityId } from '../types/entities';
import { useToastNotifications } from './useToastNotifications';

export interface DragItem {
  type: 'collection' | 'request' | 'folder';
  id: EntityId;
  collectionId?: number; // For requests/folders, track their current collection
  folderId?: number; // For requests, track their current folder
}

export type DropPosition = 'above' | 'below' | 'inside';

export interface DragDropConfig {
  onMoveRequest?: (requestId: EntityId, targetCollectionId: number, targetFolderId?: number) => Promise<void>;
  onMoveFolder?: (folderId: number, targetCollectionId: number) => Promise<void>;
  onReorderRequest?: (requestId: EntityId, targetRequestId: EntityId, position: 'above' | 'below') => Promise<void>;
  onReorderFolder?: (folderId: number, targetFolderId: number, position: 'above' | 'below') => Promise<void>;
  resolveFolderCollectionId?: (folderId: number) => number | undefined; // Helper to resolve folder's collectionId
}

export interface DragDropState {
  draggedItem: DragItem | null;
  dragOverItem: DragItem | null;
  dropPosition: DropPosition | null;
}

export interface DragDropActions {
  handleDragStart: (e: React.DragEvent, item: DragItem) => void;
  handleDragOver: (e: React.DragEvent, item: DragItem, position?: DropPosition) => void;
  handleDrop: (e: React.DragEvent, targetItem: DragItem, position?: DropPosition) => Promise<void>;
  handleDragEnd: () => void;
  canDrop: (draggedItem: DragItem, targetItem: DragItem) => boolean;
}

export function useCollectionDragDrop(config: DragDropConfig) {
  const { showError } = useToastNotifications();
  const [state, setState] = useState<DragDropState>({
    draggedItem: null,
    dragOverItem: null,
    dropPosition: null,
  });

  const canDrop = useCallback((draggedItem: DragItem, targetItem: DragItem): boolean => {
    // Can't drop on itself
    if (draggedItem.id === targetItem.id && draggedItem.type === targetItem.type) {
      return false;
    }

    // Requests can be dropped on:
    // - Collections (move to collection root)
    // - Folders (move to folder)
    // - Other requests (reorder within same container)
    if (draggedItem.type === 'request') {
      if (targetItem.type === 'collection' || targetItem.type === 'folder') {
        return true; // Move operation
      }
      if (targetItem.type === 'request') {
        // Reorder: only allow if in same container (same collectionId and folderId)
        return draggedItem.collectionId === targetItem.collectionId &&
               draggedItem.folderId === targetItem.folderId;
      }
      return false;
    }

    // Folders can be dropped on:
    // - Collections (move to collection)
    // - Other folders (reorder within same collection) - but NOT nested folders
    if (draggedItem.type === 'folder') {
      if (targetItem.type === 'collection') {
        return true; // Move operation
      }
      if (targetItem.type === 'folder') {
        // Reorder: only allow if in same collection (nested folders not supported)
        return draggedItem.collectionId === targetItem.collectionId;
      }
      return false;
    }

    // Collections can't be moved
    return false;
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, item: DragItem) => {
    setState(prev => ({ ...prev, draggedItem: item, dropPosition: null }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, item: DragItem, position?: DropPosition) => {
    e.preventDefault();
    
    if (!state.draggedItem) return;
    
    // Auto-detect position if not provided
    let dropPosition: DropPosition = position || 'inside';
    if (!position && state.draggedItem.type === item.type && e.currentTarget) {
      // For same-type items, detect position based on mouse Y
      try {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const mouseY = e.clientY;
        const itemCenterY = rect.top + rect.height / 2;
        dropPosition = mouseY < itemCenterY ? 'above' : 'below';
      } catch (error) {
        // Fallback to inside if getBoundingClientRect fails
        dropPosition = 'inside';
      }
    }
    
    if (canDrop(state.draggedItem, item)) {
      e.dataTransfer.dropEffect = 'move';
      setState(prev => ({ 
        ...prev, 
        dragOverItem: item,
        dropPosition: dropPosition
      }));
    } else {
      e.dataTransfer.dropEffect = 'none';
      setState(prev => ({ 
        ...prev, 
        dragOverItem: null,
        dropPosition: null
      }));
    }
  }, [state.draggedItem, canDrop]);

  const handleDrop = useCallback(async (e: React.DragEvent, targetItem: DragItem, position?: DropPosition) => {
    e.preventDefault();
    
    if (!state.draggedItem || !canDrop(state.draggedItem, targetItem)) {
      return;
    }

    // Auto-detect position if not provided
    let dropPosition: DropPosition = position || 'inside';
    if (!position && state.draggedItem.type === targetItem.type && e.currentTarget) {
      try {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const mouseY = e.clientY;
        const itemCenterY = rect.top + rect.height / 2;
        dropPosition = mouseY < itemCenterY ? 'above' : 'below';
      } catch (error) {
        // Fallback to inside if getBoundingClientRect fails
        dropPosition = 'inside';
      }
    }

    try {
      if (state.draggedItem.type === 'request') {
        if (targetItem.type === 'collection' || targetItem.type === 'folder') {
          // Move operation
          if (config.onMoveRequest) {
            let targetCollectionId: number;
            
            if (targetItem.type === 'collection') {
              targetCollectionId = targetItem.id as number;
            } else {
              // Folder - need to resolve collectionId
              if (config.resolveFolderCollectionId) {
                targetCollectionId = config.resolveFolderCollectionId(targetItem.id as number) || 0;
              } else {
                // Fallback: use folder's collectionId if provided
                targetCollectionId = targetItem.collectionId || 0;
              }
              
              if (!targetCollectionId) {
                throw new Error('Could not resolve collection ID for folder');
              }
            }
            
            const targetFolderId = targetItem.type === 'folder' ? targetItem.id as number : undefined;
            
            await config.onMoveRequest(state.draggedItem.id, targetCollectionId, targetFolderId);
          }
        } else if (targetItem.type === 'request') {
          // Reorder operation
          if (config.onReorderRequest && (dropPosition === 'above' || dropPosition === 'below')) {
            await config.onReorderRequest(state.draggedItem.id, targetItem.id, dropPosition);
          }
        }
      } else if (state.draggedItem.type === 'folder') {
        if (targetItem.type === 'collection') {
          // Move operation
          if (config.onMoveFolder) {
            await config.onMoveFolder(state.draggedItem.id as number, targetItem.id as number);
          }
        } else if (targetItem.type === 'folder') {
          // Reorder operation
          if (config.onReorderFolder && (dropPosition === 'above' || dropPosition === 'below')) {
            await config.onReorderFolder(state.draggedItem.id as number, targetItem.id as number, dropPosition);
          }
        }
      }
    } catch (error: any) {
      showError('Move Failed', error.message || 'Failed to move item');
    }
  }, [state.draggedItem, canDrop, config, showError]);

  const handleDragEnd = useCallback(() => {
    setState({
      draggedItem: null,
      dragOverItem: null,
      dropPosition: null,
    });
  }, []);

  return {
    ...state,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    canDrop,
  };
}
