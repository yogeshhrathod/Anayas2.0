/**
 * CollectionHierarchy - Main collection hierarchy component (refactored)
 *
 * Orchestrates the collection hierarchy display using smaller, focused components:
 * - CollectionItem for individual collections
 * - FolderItem for folders within collections
 * - RequestItem for individual requests
 * - Drag and drop functionality
 * - Context menus and actions
 *
 * This refactored version is much smaller and more maintainable than the original.
 */

import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollectionDragDrop } from '../hooks/useCollectionDragDrop';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { calculateOrderForPosition } from '../lib/drag-drop-utils';
import logger from '../lib/logger';
import { useStore } from '../store/useStore';
import { EntityId, Request } from '../types/entities';
import { CollectionItem } from './collection/CollectionItem';
import { FolderItem } from './collection/FolderItem';
import { RequestItem } from './collection/RequestItem';
import { cn } from '../lib/utils';

export interface CollectionHierarchyProps {
  onRequestSelect: (request: Request) => void;
}

export function CollectionHierarchy({
  onRequestSelect,
}: CollectionHierarchyProps) {
  const collections = useStore(state => state.collections);
  const setCollections = useStore(state => state.setCollections);
  const expandedCollections = useStore(state => state.expandedCollections);
  const setExpandedCollections = useStore(state => state.setExpandedCollections);
  const setCurrentPage = useStore(state => state.setCurrentPage);
  const setSelectedRequest = useStore(state => state.setSelectedRequest);
  const setSelectedItem = useStore(state => state.setSelectedItem);
  const selectedRequest = useStore(state => state.selectedRequest);
  const setFocusedContext = useStore(state => state.setFocusedContext);
  const triggerSidebarRefresh = useStore(state => state.triggerSidebarRefresh);
  const requests = useStore(state => state.requests);
  const setRequests = useStore(state => state.setRequests);
  const folders = useStore(state => state.folders);
  const setFolders = useStore(state => state.setFolders);

  const { showSuccess, showError } = useToastNotifications();
  const { expandedFolders, setExpandedFolders, toggleFolderExpansion } = useStore();
  const prevCollectionIdsRef = useRef<Set<number>>(new Set());
  // Track unsaved request drag state for visual feedback
  const [unsavedDragOver, setUnsavedDragOver] = useState<{
    type: 'collection' | 'folder';
    id: number;
  } | null>(null);

  // Auto-expand and highlight on selected request
  useEffect(() => {
    if (!selectedRequest) return;
    
    // Auto-expand parents
    if (selectedRequest.collectionId) {
      const colId = Number(selectedRequest.collectionId);
      if (!expandedCollections.has(colId)) {
        setExpandedCollections(new Set([...expandedCollections, colId]));
      }
    }
    
    if (selectedRequest.folderId) {
      const folId = Number(selectedRequest.folderId);
      if (!expandedFolders.has(folId)) {
        setExpandedFolders(new Set([...expandedFolders, folId]));
      }
    }

    // Sync selectedItem for highlighting in sidebar if it's a saved request
    if (selectedRequest.id) {
       const { selectedItem } = useStore.getState();
       if (selectedItem.id !== selectedRequest.id || selectedItem.type !== 'request') {
         setSelectedItem({
           type: 'request',
           id: selectedRequest.id,
           data: selectedRequest
         });
       }

       // Scroll to the selected request in the sidebar
       // We use a small delay to ensure expansion animation has finished/is in progress
       setTimeout(() => {
         const element = document.querySelector(`[data-request-id="${selectedRequest.id}"]`);
         if (element) {
           element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
         }
       }, 300);
    }
  }, [selectedRequest?.id, selectedRequest?.collectionId, selectedRequest?.folderId]);

  // Auto-expand collections when new ones appear, but preserve manual collapse.
  useLayoutEffect(() => {
    if (!collections.length) {
      // If there are no collections, reset the previously seen IDs.
      prevCollectionIdsRef.current = new Set();
      return;
    }

    const prevIds = prevCollectionIdsRef.current;
    const currentIds = new Set<number>();

    collections.forEach(collection => {
      if (typeof collection.id === 'number') {
        currentIds.add(collection.id);
      }
    });

    // Only auto-expand collections that are newly added (not present in prevIds).
    const newExpanded = new Set(expandedCollections);
    let changed = false;

    collections.forEach(collection => {
      if (
        typeof collection.id === 'number' &&
        !prevIds.has(collection.id) &&
        !newExpanded.has(collection.id)
      ) {
        newExpanded.add(collection.id);
        changed = true;
      }
    });

    if (changed) {
      setExpandedCollections(newExpanded);
    }

    // Update previously seen IDs for the next run.
    prevCollectionIdsRef.current = currentIds;
  }, [collections, expandedCollections, setExpandedCollections]);

  // Check if dragging an unsaved request
  const isDraggingUnsavedRequest = (e: React.DragEvent): boolean => {
    return e.dataTransfer.types.includes('application/json');
  };

  // Handle drag over for unsaved requests (visual feedback)
  const handleUnsavedDragOver = (
    e: React.DragEvent,
    type: 'collection' | 'folder',
    id: number
  ) => {
    if (isDraggingUnsavedRequest(e)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setUnsavedDragOver({ type, id });
    }
  };

  // Handle drop on collection (including unsaved requests)
  const handleCollectionDrop = async (
    e: React.DragEvent,
    collectionId: number,
    folderId?: number
  ) => {
    e.preventDefault();
    setUnsavedDragOver(null);

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData || jsonData.trim() === '') return;

      const data = JSON.parse(jsonData);

      if (data.type === 'unsaved-request') {
        const result = await window.electronAPI.unsavedRequest.promote(
          data.id,
          {
            name: data.data.name,
            collectionId: collectionId,
            folderId: folderId,
            isFavorite: false,
          }
        );

        if (result.success) {
          showSuccess(folderId ? 'Unsaved request saved to folder' : 'Unsaved request saved to collection');

          const savedRequest = {
            id: result.id,
            name: data.data.name,
            method: data.data.method as any,
            url: data.data.url,
            headers: data.data.headers,
            body: data.data.body,
            queryParams: data.data.queryParams,
            auth: data.data.auth,
            collectionId: collectionId,
            folderId: folderId,
            isFavorite: 0,
            lastResponse: undefined,
          };

          setSelectedRequest(savedRequest);
          setCurrentPage('home');

          const { setActiveUnsavedRequestId, setUnsavedRequests } = useStore.getState();
          if (data.id) setActiveUnsavedRequestId(null);

          const [requestsData, foldersData, unsavedData] = await Promise.all([
            window.electronAPI.request.list(),
            window.electronAPI.folder.list(),
            window.electronAPI.unsavedRequest.getAll(),
          ]);
          setRequests(requestsData);
          setFolders(foldersData);
          setUnsavedRequests(unsavedData);
          triggerSidebarRefresh();
        }
      }
    } catch (error: any) {
      if (error instanceof SyntaxError && error.message.includes('JSON')) return;
      logger.error('Drop failed', { error });
      showError('Failed to save request', error.message);
    }
  };

  const getRequestsForFolder = (folderId: number) => {
    return requests
      .filter(r => r.folderId === folderId)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.id || '').localeCompare(String(b.id || '')));
  };

  const getRequestsForCollection = (collectionId: number) => {
    return requests
      .filter(r => r.collectionId === collectionId && !r.folderId)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.id || '').localeCompare(String(b.id || '')));
  };

  const getFoldersForCollection = (collectionId: number) => {
    return folders
      .filter(f => f.collectionId === collectionId)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.id || '').localeCompare(String(b.id || '')));
  };

  const handleReorderRequest = async (requestId: EntityId, targetRequestId: EntityId, position: 'above' | 'below') => {
    try {
      const draggedRequest = requests.find(r => r.id === requestId);
      const targetRequest = requests.find(r => r.id === targetRequestId);
      if (!draggedRequest || !targetRequest) throw new Error('Request not found');

      const containerRequests = draggedRequest.folderId ? getRequestsForFolder(draggedRequest.folderId) : getRequestsForCollection(draggedRequest.collectionId!);
      const targetIndex = containerRequests.findIndex(r => r.id === targetRequestId);
      const dropIndex = position === 'above' ? targetIndex : targetIndex + 1;
      const newOrder = calculateOrderForPosition(containerRequests, dropIndex);

      await window.electronAPI.request.reorder(requestId as any, newOrder);
      setRequests(await window.electronAPI.request.list());
      triggerSidebarRefresh();
    } catch (error: any) {
      showError('Failed to reorder request', error.message);
    }
  };

  const handleReorderFolder = async (folderId: number, targetFolderId: number, position: 'above' | 'below') => {
    try {
      const draggedFolder = folders.find(f => f.id === folderId);
      const targetFolder = folders.find(f => f.id === targetFolderId);
      if (!draggedFolder || !targetFolder) throw new Error('Folder not found');

      const collectionFolders = getFoldersForCollection(draggedFolder.collectionId);
      const targetIndex = collectionFolders.findIndex(f => f.id === targetFolderId);
      const dropIndex = position === 'above' ? targetIndex : targetIndex + 1;
      const newOrder = calculateOrderForPosition(collectionFolders, dropIndex);

      await window.electronAPI.folder.reorder(folderId, newOrder);
      setFolders(await window.electronAPI.folder.list());
      triggerSidebarRefresh();
    } catch (error: any) {
      showError('Failed to reorder folder', error.message);
    }
  };

  const dragDrop = useCollectionDragDrop({
    resolveFolderCollectionId: (folderId: number) => folders.find(f => f.id === folderId)?.collectionId,
    onMoveRequest: async (requestId, targetCollectionId, targetFolderId) => {
      try {
        const r = requests.find(req => req.id === requestId);
        if (!r) return;
        await window.electronAPI.request.save({ ...r, id: requestId as any, collectionId: targetCollectionId, folderId: targetFolderId });
        showSuccess('Request moved successfully');
        setRequests(await window.electronAPI.request.list());
        setFolders(await window.electronAPI.folder.list());
        triggerSidebarRefresh();
      } catch (error: any) {
        showError('Failed to move request', error.message);
      }
    },
    onMoveFolder: async (folderId, targetCollectionId) => {
      try {
        const f = folders.find(folder => folder.id === folderId);
        if (!f) return;
        await window.electronAPI.folder.save({ ...f, collectionId: targetCollectionId });
        showSuccess('Folder moved successfully');
        setFolders(await window.electronAPI.folder.list());
        triggerSidebarRefresh();
      } catch (error: any) {
        showError('Failed to move folder', error.message);
      }
    },
    onReorderRequest: handleReorderRequest,
    onReorderFolder: handleReorderFolder,
  });

  const toggleCollection = (id: number) => {
    const next = new Set(expandedCollections);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedCollections(next);
  };

  const toggleFolder = (id: number) => {
    toggleFolderExpansion(id);
  };

  const handleEditCollection = (id: number) => {
    const { setCollectionToEditId, setCurrentPage } = useStore.getState();
    setCollectionToEditId(id);
    setCurrentPage('collections');
  };

  const handleExportCollection = async (id: number) => {
    try {
      const c = collections.find(col => col.id === id);
      if (!c) return;
      const exportData = { collection: c, folders: folders.filter(f => f.collectionId === id), requests: requests.filter(r => r.collectionId === id), exportedAt: new Date().toISOString(), type: 'luna-collection-export', version: '1.0' };
      const fileName = `${c.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
      const result = await window.electronAPI.file.saveFile(fileName, JSON.stringify(exportData, null, 2));
      if (result.success) showSuccess('Collection exported successfully');
    } catch (error: any) {
      showError('Failed to export collection', error.message);
    }
  };

  const handleEditRequest = (request: Request) => onRequestSelect(request);

  const handleExportRequest = async (request: Request) => {
    try {
      const fileName = `${(request.name || 'request').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_request.json`;
      const result = await window.electronAPI.file.saveFile(fileName, JSON.stringify(request, null, 2));
      if (result.success) showSuccess('Request exported successfully');
    } catch (error: any) {
      showError('Failed to export request', error.message);
    }
  };

  const handleAddRequest = (collectionId: number, folderId?: number) => {
    const newRequest: Request = { name: 'New Request', method: 'GET', url: '', headers: { 'Content-Type': 'application/json' }, body: '', queryParams: [], auth: { type: 'none' }, collectionId, folderId, isFavorite: 0 };
    setSelectedRequest(newRequest);
    setCurrentPage('home');
  };

  const handleAddFolder = async (collectionId: number) => {
    try {
      const name = `New Folder ${folders.filter(f => f.collectionId === collectionId).length + 1}`;
      const result = await window.electronAPI.folder.save({ name, description: '', collectionId });
      if (result.success) {
        showSuccess('Folder created successfully');
        setFolders(await window.electronAPI.folder.list());
        triggerSidebarRefresh();
      }
    } catch (error: any) {
      showError('Failed to create folder', error.message);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    try {
      await window.electronAPI.collection.delete(id);
      showSuccess('Collection deleted successfully');
      setCollections(collections.filter(c => c.id !== id));
      triggerSidebarRefresh();
    } catch (error: any) {
      showError('Failed to delete collection', error.message);
    }
  };

  const handleDuplicateCollection = async (id: number) => {
    try {
      const c = collections.find(col => col.id === id);
      if (!c) return;
      const result = await window.electronAPI.collection.save({ ...c, id: undefined, name: `${c.name} (Copy)`, isFavorite: 0 });
      if (result.success) {
        const originalReqs = await window.electronAPI.request.list(id);
        for (const r of originalReqs) {
          await window.electronAPI.request.save({ ...r, id: undefined, name: `${r.name} (Copy)`, collectionId: result.id, isFavorite: 0 });
        }
        showSuccess('Collection duplicated successfully');
        setCollections(await window.electronAPI.collection.list());
        setRequests(await window.electronAPI.request.list());
        triggerSidebarRefresh();
      }
    } catch (error: any) {
      showError('Failed to duplicate collection', error.message);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    try {
      await window.electronAPI.folder.delete(id);
      showSuccess('Folder deleted successfully');
      setFolders(folders.filter(f => f.id !== id));
      triggerSidebarRefresh();
    } catch (error: any) {
      showError('Failed to delete folder', error.message);
    }
  };

  const handleDeleteRequest = async (id: EntityId) => {
    try {
      await window.electronAPI.request.delete(id as any);
      showSuccess('Request deleted successfully');
      setRequests(requests.filter(r => r.id !== id));
      triggerSidebarRefresh();
    } catch (error: any) {
      showError('Failed to delete request', error.message);
    }
  };

  const handleDuplicateRequest = async (id: EntityId) => {
    try {
      const r = requests.find(req => req.id === id);
      if (!r) return;
      await window.electronAPI.request.saveAfter({ ...r, id: undefined, name: `${r.name} (Copy)`, isFavorite: 0 }, id as any);
      showSuccess('Request duplicated successfully');
      setRequests(await window.electronAPI.request.list());
      triggerSidebarRefresh();
    } catch (error: any) {
      showError('Failed to duplicate request', error.message);
    }
  };

  const sidebarCompactMode = useStore(state => state.sidebarCompactMode);

  const renderRequests = (list: Request[], level: number, collectionId: number, folderId?: number) => (
    list.map(r => (
      <motion.div key={String(r.id)} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} layout>
        <RequestItem
          request={r}
          level={level}
          onSelect={onRequestSelect}
          onEdit={() => handleEditRequest(r)}
          onDelete={() => handleDeleteRequest(r.id!)}
          onDuplicate={() => handleDuplicateRequest(r.id!)}
          onExport={() => handleExportRequest(r)}
          onItemSelect={() => setSelectedItem({ type: 'request', id: r.id!, data: r })}
          dragProps={{
            draggable: true,
            onDragStart: e => dragDrop.handleDragStart(e, { type: 'request', id: r.id!, collectionId, folderId }),
            onDragOver: e => dragDrop.handleDragOver(e, { type: 'request', id: r.id!, collectionId, folderId }),
            onDrop: e => dragDrop.handleDrop(e, { type: 'request', id: r.id!, collectionId, folderId }),
            onDragEnd: dragDrop.handleDragEnd,
          }}
          isDragging={dragDrop.draggedItem?.type === 'request' && dragDrop.draggedItem?.id === r.id}
          isDragOver={dragDrop.dragOverItem?.type === 'request' && dragDrop.dragOverItem?.id === r.id}
          dropPosition={dragDrop.dragOverItem?.id === r.id ? dragDrop.dropPosition : null}
        />
      </motion.div>
    ))
  );

  const renderFolders = (list: any[], level: number, collectionId: number) => (
    list.map(f => {
      const expanded = expandedFolders.has(f.id!);
      const folderReqs = getRequestsForFolder(f.id!);
      return (
        <div key={f.id} className="relative">
          <FolderItem
            folder={f}
            level={level}
            requestCount={folderReqs.length}
            isExpanded={expanded}
            onToggle={() => toggleFolder(f.id!)}
            onEdit={() => {}}
            onDelete={() => handleDeleteFolder(f.id!)}
            onAddRequest={() => handleAddRequest(collectionId, f.id)}
            onSelect={() => setSelectedItem({ type: 'folder', id: f.id!, data: f })}
            dragProps={{
              draggable: true,
              onDragStart: e => dragDrop.handleDragStart(e, { type: 'folder', id: f.id!, collectionId }),
              onDragOver: e => isDraggingUnsavedRequest(e) ? handleUnsavedDragOver(e, 'folder', f.id!) : dragDrop.handleDragOver(e, { type: 'folder', id: f.id!, collectionId }),
              onDrop: e => handleCollectionDrop(e, collectionId, f.id).then(() => dragDrop.handleDrop(e, { type: 'folder', id: f.id!, collectionId })),
              onDragEnd: dragDrop.handleDragEnd,
            }}
            isDragging={dragDrop.draggedItem?.type === 'folder' && dragDrop.draggedItem?.id === f.id}
            isDragOver={(dragDrop.dragOverItem?.id === f.id) || (unsavedDragOver?.type === 'folder' && unsavedDragOver?.id === f.id)}
            dropPosition={dragDrop.dragOverItem?.id === f.id ? dragDrop.dropPosition : (unsavedDragOver?.id === f.id ? 'inside' : null)}
          />
          {expanded && <div className="absolute left-[19px] top-[40px] bottom-1 w-[1px] bg-border/40 pointer-events-none" style={{ left: `${level * 16 + 19}px` }} />}
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                {renderRequests(folderReqs, level + 1, collectionId, f.id)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    })
  );

  return (
    <div className={cn("space-y-1", sidebarCompactMode && "space-y-0")} data-testid="collection-hierarchy" onFocus={() => setFocusedContext('sidebar')} onBlur={() => setFocusedContext(null)}>
      <AnimatePresence initial={false}>
        {collections.map(c => {
          const expanded = expandedCollections.has(c.id!);
          const colReqs = getRequestsForCollection(c.id!);
          const colFolders = getFoldersForCollection(c.id!);
          const totalReqs = colReqs.length + colFolders.reduce((sum, f) => sum + getRequestsForFolder(f.id!).length, 0);
          return (
            <motion.div key={c.id} initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: "auto" }} exit={{ opacity: 0, x: -20, height: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.2 } }} layout data-testid="collection-group" className="overflow-hidden">
              <CollectionItem
                collection={c}
                level={0}
                isExpanded={expanded}
                requestCount={totalReqs}
                onToggle={() => toggleCollection(c.id!)}
                onSelect={() => setSelectedItem({ type: 'collection', id: c.id!, data: c })}
                onEdit={() => handleEditCollection(c.id!)}
                onDelete={() => handleDeleteCollection(c.id!)}
                onAddRequest={() => handleAddRequest(c.id!)}
                onAddFolder={() => handleAddFolder(c.id!)}
                onDuplicate={() => handleDuplicateCollection(c.id!)}
                onExport={() => handleExportCollection(c.id!)}
                onImport={() => {}}
                dragProps={{
                  draggable: true,
                  onDragStart: e => dragDrop.handleDragStart(e, { type: 'collection', id: c.id! }),
                  onDragOver: e => isDraggingUnsavedRequest(e) ? handleUnsavedDragOver(e, 'collection', c.id!) : dragDrop.handleDragOver(e, { type: 'collection', id: c.id! }),
                  onDrop: e => handleCollectionDrop(e, c.id!).then(() => dragDrop.handleDrop(e, { type: 'collection', id: c.id! })),
                  onDragEnd: dragDrop.handleDragEnd,
                }}
                isDragging={dragDrop.draggedItem?.type === 'collection' && dragDrop.draggedItem?.id === c.id}
                isDragOver={(dragDrop.dragOverItem?.id === c.id) || (unsavedDragOver?.type === 'collection' && unsavedDragOver?.id === c.id)}
                dropPosition={dragDrop.dragOverItem?.id === c.id ? dragDrop.dropPosition : (unsavedDragOver?.id === c.id ? 'inside' : null)}
              />
              <div className="relative">
                {expanded && <div className="absolute left-[19px] top-0 bottom-1 w-[1px] bg-border/40 pointer-events-none" />}
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      {renderFolders(colFolders, 1, c.id!)}
                      {renderRequests(colReqs, 1, c.id!)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
