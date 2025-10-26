/**
 * useCollectionDragDrop - Drag and drop logic hook
 * 
 * Provides drag and drop functionality for collections, folders, and requests:
 * - Drag state management
 * - Drop zone handling
 * - Visual feedback
 * - Move operations
 * 
 * @example
 * ```tsx
 * const {
 *   draggedItem,
 *   dragOverItem,
 *   handleDragStart,
 *   handleDragOver,
 *   handleDrop,
 *   handleDragEnd
 * } = useCollectionDragDrop({
 *   onMoveRequest: handleMoveRequest,
 *   onMoveFolder: handleMoveFolder
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { useToastNotifications } from './useToastNotifications';

export interface DragItem {
  type: 'collection' | 'request' | 'folder';
  id: number;
}

export interface DragDropConfig {
  onMoveRequest?: (requestId: number, targetCollectionId: number, targetFolderId?: number) => Promise<void>;
  onMoveFolder?: (folderId: number, targetCollectionId: number) => Promise<void>;
}

export interface DragDropState {
  draggedItem: DragItem | null;
  dragOverItem: DragItem | null;
}

export interface DragDropActions {
  handleDragStart: (e: React.DragEvent, item: DragItem) => void;
  handleDragOver: (e: React.DragEvent, item: DragItem) => void;
  handleDrop: (e: React.DragEvent, targetItem: DragItem) => Promise<void>;
  handleDragEnd: () => void;
  canDrop: (draggedItem: DragItem, targetItem: DragItem) => boolean;
}

export function useCollectionDragDrop(config: DragDropConfig) {
  const { showError } = useToastNotifications();
  const [state, setState] = useState<DragDropState>({
    draggedItem: null,
    dragOverItem: null,
  });

  const canDrop = useCallback((draggedItem: DragItem, targetItem: DragItem): boolean => {
    // Can't drop on itself
    if (draggedItem.id === targetItem.id && draggedItem.type === targetItem.type) {
      return false;
    }

    // Requests can be dropped on collections or folders
    if (draggedItem.type === 'request') {
      return targetItem.type === 'collection' || targetItem.type === 'folder';
    }

    // Folders can be dropped on collections
    if (draggedItem.type === 'folder') {
      return targetItem.type === 'collection';
    }

    // Collections can't be moved
    return false;
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, item: DragItem) => {
    setState(prev => ({ ...prev, draggedItem: item }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, item: DragItem) => {
    e.preventDefault();
    
    if (!state.draggedItem) return;
    
    if (canDrop(state.draggedItem, item)) {
      e.dataTransfer.dropEffect = 'move';
      setState(prev => ({ ...prev, dragOverItem: item }));
    } else {
      e.dataTransfer.dropEffect = 'none';
      setState(prev => ({ ...prev, dragOverItem: null }));
    }
  }, [state.draggedItem, canDrop]);

  const handleDrop = useCallback(async (e: React.DragEvent, targetItem: DragItem) => {
    e.preventDefault();
    
    if (!state.draggedItem || !canDrop(state.draggedItem, targetItem)) {
      return;
    }

    try {
      if (state.draggedItem.type === 'request') {
        if (config.onMoveRequest) {
          const targetCollectionId = targetItem.type === 'collection' 
            ? targetItem.id 
            : targetItem.type === 'folder' 
              ? targetItem.id // This would need to be resolved to collection ID
              : 0;
          
          const targetFolderId = targetItem.type === 'folder' ? targetItem.id : undefined;
          
          await config.onMoveRequest(state.draggedItem.id, targetCollectionId, targetFolderId);
        }
      } else if (state.draggedItem.type === 'folder') {
        if (config.onMoveFolder && targetItem.type === 'collection') {
          await config.onMoveFolder(state.draggedItem.id, targetItem.id);
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
