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

import { useEffect, useRef, useState } from 'react';
import { useCollectionDragDrop } from '../hooks/useCollectionDragDrop';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { calculateOrderForPosition } from '../lib/drag-drop-utils';
import { useStore } from '../store/useStore';
import { Folder, Request } from '../types/entities';
import { CollectionItem } from './collection/CollectionItem';
import { FolderItem } from './collection/FolderItem';
import { RequestItem } from './collection/RequestItem';

export interface CollectionHierarchyProps {
  onRequestSelect: (request: Request) => void;
}

export function CollectionHierarchy({
  onRequestSelect,
}: CollectionHierarchyProps) {
  const {
    collections,
    setCollections,
    expandedCollections,
    setExpandedCollections,
    setCurrentPage,
    setSelectedRequest,
    setSelectedItem,
    setFocusedContext,
    sidebarRefreshTrigger,
    triggerSidebarRefresh,
  } = useStore();

  const { showSuccess, showError } = useToastNotifications();
  const [requests, setRequests] = useState<Request[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(
    new Set()
  );
  const prevCollectionIdsRef = useRef<Set<number>>(new Set());
  // Track unsaved request drag state for visual feedback
  const [unsavedDragOver, setUnsavedDragOver] = useState<{
    type: 'collection' | 'folder';
    id: number;
  } | null>(null);

  // Load requests and folders when collections change or refresh is triggered
  useEffect(() => {
    const loadData = async () => {
      try {
        const [requestsData, foldersData] = await Promise.all([
          window.electronAPI.request.list(),
          window.electronAPI.folder.list(),
        ]);
        setRequests(requestsData);
        setFolders(foldersData);
      } catch (error: unknown) {
        console.error('Failed to load requests and folders:', error);
      }
    };
    loadData();
  }, [collections, sidebarRefreshTrigger]);

  // Auto-expand collections when new ones appear, but preserve manual collapse.
  useEffect(() => {
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

  // Subscribe to collection/request/folder updates from the main process (if supported).
  // In test environments, the mocked electronAPI does not provide these events, so we
  // guard access to keep the UI rendering instead of crashing.
  useEffect(() => {
    const api = window.electronAPI;
    if (!api || !api.collection || !api.request || !api.folder) {
      return;
    }

    const hasCollectionEvents = typeof api.collection.onUpdated === 'function';
    const hasRequestEvents = typeof api.request.onUpdated === 'function';
    const hasFolderEvents = typeof api.folder.onUpdated === 'function';

    if (!hasCollectionEvents && !hasRequestEvents && !hasFolderEvents) {
      return;
    }

    const handleCollectionsUpdated = async () => {
      try {
        const latestCollections = await api.collection.list();
        setCollections(latestCollections);
      } catch (error) {
        console.error('Failed to refresh collections:', error);
      }
    };

    const handleRequestsUpdated = async () => {
      try {
        const latestRequests = await api.request.list();
        setRequests(latestRequests);
      } catch (error) {
        console.error('Failed to refresh requests:', error);
      }
    };

    const handleFoldersUpdated = async () => {
      try {
        const latestFolders = await api.folder.list();
        setFolders(latestFolders);
      } catch (error) {
        console.error('Failed to refresh folders:', error);
      }
    };

    const unsubscribeCollections = hasCollectionEvents
      ? api.collection.onUpdated(handleCollectionsUpdated)
      : undefined;
    const unsubscribeRequests = hasRequestEvents
      ? api.request.onUpdated(handleRequestsUpdated)
      : undefined;
    const unsubscribeFolders = hasFolderEvents
      ? api.folder.onUpdated(handleFoldersUpdated)
      : undefined;

    return () => {
      unsubscribeCollections?.();
      unsubscribeRequests?.();
      unsubscribeFolders?.();
    };
  }, [setCollections]);

  // Check if dragging an unsaved request
  // Note: getData() doesn't work during dragOver, so we check for the data type
  const isDraggingUnsavedRequest = (e: React.DragEvent): boolean => {
    // Check if the drag contains JSON data (unsaved requests use application/json)
    // Regular drag-drop items don't set this type
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
    setUnsavedDragOver(null); // Clear drag over state

    try {
      // Only handle unsaved requests here - regular drag-drop is handled by dragDrop hook
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData || jsonData.trim() === '') {
        // No data means it's a regular drag-drop, not an unsaved request
        return;
      }

      const data = JSON.parse(jsonData);

      if (data.type === 'unsaved-request') {
        // Promote unsaved request to this collection (and optionally folder)
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
          showSuccess(
            folderId
              ? 'Unsaved request saved to folder'
              : 'Unsaved request saved to collection'
          );

          // Load the newly saved request and set it as selected
          const savedRequest = {
            id: result.id,
            name: data.data.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

          // Clear active unsaved request ID if it was the one being dropped
          const { setActiveUnsavedRequestId, setUnsavedRequests } =
            useStore.getState();
          if (data.id) {
            setActiveUnsavedRequestId(null);
          }

          // Refresh data including unsaved requests
          const [requestsData, foldersData, unsavedData] = await Promise.all([
            window.electronAPI.request.list(),
            window.electronAPI.folder.list(),
            window.electronAPI.unsavedRequest.getAll(),
          ]);
          setRequests(requestsData);
          setFolders(foldersData);

          // Update unsaved requests in store
          setUnsavedRequests(unsavedData);

          // Trigger sidebar refresh
          triggerSidebarRefresh();
        }
      }
    } catch (error: unknown) {
      // Only show error if it's not a JSON parse error (which is expected for regular drag-drop)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        // This is expected when dragging regular items - they don't have JSON data
        return;
      }
      console.error('Drop failed:', error);
      showError(
        'Failed to save request',
        error instanceof Error ? error.message : 'Failed to save request'
      );
    }
  };

  // Reorder handlers
  const handleReorderRequest = async (
    requestId: number,
    targetRequestId: number,
    position: 'above' | 'below'
  ) => {
    try {
      const draggedRequest = requests.find(r => r.id === requestId);
      const targetRequest = requests.find(r => r.id === targetRequestId);

      if (!draggedRequest || !targetRequest) {
        throw new Error('Request not found');
      }

      // Verify both requests are in the same container
      if (
        draggedRequest.collectionId !== targetRequest.collectionId ||
        draggedRequest.folderId !== targetRequest.folderId
      ) {
        throw new Error('Requests must be in the same container');
      }

      // Get all requests in the same container
      const containerRequests = draggedRequest.folderId
        ? getRequestsForFolder(draggedRequest.folderId)
        : getRequestsForCollection(draggedRequest.collectionId!);

      // Find target index
      const targetIndex = containerRequests.findIndex(
        r => r.id === targetRequestId
      );
      if (targetIndex === -1) {
        throw new Error('Target request not found in container');
      }

      // Calculate drop index
      const dropIndex = position === 'above' ? targetIndex : targetIndex + 1;

      // Calculate new order value
      const newOrder = calculateOrderForPosition(containerRequests, dropIndex);

      // Update order
      await window.electronAPI.request.reorder(requestId, newOrder);

      // Refresh data
      const requestsData = await window.electronAPI.request.list();
      setRequests(requestsData);

      triggerSidebarRefresh();
    } catch (error: unknown) {
      showError(
        'Failed to reorder request',
        error instanceof Error ? error.message : 'Failed to reorder request'
      );
    }
  };

  const handleReorderFolder = async (
    folderId: number,
    targetFolderId: number,
    position: 'above' | 'below'
  ) => {
    try {
      const draggedFolder = folders.find(f => f.id === folderId);
      const targetFolder = folders.find(f => f.id === targetFolderId);

      if (!draggedFolder || !targetFolder) {
        throw new Error('Folder not found');
      }

      // Get all folders in the same collection
      const collectionFolders = getFoldersForCollection(
        draggedFolder.collectionId
      );

      // Find target index
      const targetIndex = collectionFolders.findIndex(
        f => f.id === targetFolderId
      );
      if (targetIndex === -1) {
        throw new Error('Target folder not found in collection');
      }

      // Calculate drop index
      const dropIndex = position === 'above' ? targetIndex : targetIndex + 1;

      // Calculate new order value
      const newOrder = calculateOrderForPosition(collectionFolders, dropIndex);

      // Update order
      await window.electronAPI.folder.reorder(folderId, newOrder);

      // Refresh data
      const foldersData = await window.electronAPI.folder.list();
      setFolders(foldersData);

      triggerSidebarRefresh();
    } catch (error: unknown) {
      showError(
        'Failed to reorder folder',
        error instanceof Error ? error.message : 'Failed to reorder folder'
      );
    }
  };

  // Helper to resolve folder's collectionId
  const resolveFolderCollectionId = (folderId: number): number | undefined => {
    const folder = folders.find(f => f.id === folderId);
    return folder?.collectionId;
  };

  // Drag and drop functionality
  const dragDrop = useCollectionDragDrop({
    resolveFolderCollectionId: resolveFolderCollectionId,
    onMoveRequest: async (requestId, targetCollectionId, targetFolderId) => {
      try {
        await window.electronAPI.request.save({
          id: requestId,
          name: requests.find(r => r.id === requestId)?.name || '',

          method:
            (requests.find(r => r.id === requestId)
              ?.method as Request['method']) || 'GET',
          url: requests.find(r => r.id === requestId)?.url || '',
          headers: requests.find(r => r.id === requestId)?.headers || {},
          body: requests.find(r => r.id === requestId)?.body || '',
          queryParams:
            requests.find(r => r.id === requestId)?.queryParams || [],
          auth: requests.find(r => r.id === requestId)?.auth || {
            type: 'none',
          },
          collectionId: targetCollectionId,
          folderId: targetFolderId,
          isFavorite: Boolean(
            requests.find(r => r.id === requestId)?.isFavorite
          ),
        });
        showSuccess('Request moved successfully');
        // Refresh data
        const [requestsData, foldersData] = await Promise.all([
          window.electronAPI.request.list(),
          window.electronAPI.folder.list(),
        ]);
        setRequests(requestsData);
        setFolders(foldersData);

        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
      } catch (error: unknown) {
        showError(
          'Failed to move request',
          error instanceof Error ? error.message : 'Failed to move request'
        );
      }
    },
    onMoveFolder: async (folderId, targetCollectionId) => {
      try {
        await window.electronAPI.folder.save({
          id: folderId,
          name: folders.find(f => f.id === folderId)?.name || '',
          description: folders.find(f => f.id === folderId)?.description || '',
          collectionId: targetCollectionId,
        });
        showSuccess('Folder moved successfully');
        // Refresh data
        const foldersData = await window.electronAPI.folder.list();
        setFolders(foldersData);

        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
      } catch (error: unknown) {
        showError(
          'Failed to move folder',
          error instanceof Error ? error.message : 'Failed to move folder'
        );
      }
    },
    onReorderRequest: handleReorderRequest,
    onReorderFolder: handleReorderFolder,
  });

  const toggleCollection = (collectionId: number) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getRequestsForCollection = (collectionId: number) => {
    return requests
      .filter(r => r.collectionId === collectionId && !r.folderId)
      .sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.id || 0) - (b.id || 0);
      });
  };

  const getRequestsForFolder = (folderId: number) => {
    return requests
      .filter(r => r.folderId === folderId)
      .sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.id || 0) - (b.id || 0);
      });
  };

  const getFoldersForCollection = (collectionId: number) => {
    return folders
      .filter(f => f.collectionId === collectionId)
      .sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.id || 0) - (b.id || 0);
      });
  };

  const handleAddRequest = (collectionId: number) => {
    // Set selected collection for keyboard shortcuts
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      setSelectedItem({
        type: 'collection',
        id: collectionId,
        data: collection,
      });
    }

    // Create a new empty request and set it as selected
    const newRequest: Request = {
      name: '',
      method: 'GET',
      url: '',
      headers: { 'Content-Type': 'application/json' },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: collectionId,
      folderId: undefined,
      isFavorite: 0,
    };

    setSelectedRequest(newRequest);
    setCurrentPage('home');
  };

  const handleAddFolder = async (collectionId: number) => {
    try {
      // Set selected collection for keyboard shortcuts
      const collection = collections.find(c => c.id === collectionId);
      if (collection) {
        setSelectedItem({
          type: 'collection',
          id: collectionId,
          data: collection,
        });
      }

      // Create a new folder with a default name
      const folderCount = folders.filter(
        f => f.collectionId === collectionId
      ).length;
      const folderName = `New Folder${folderCount > 0 ? ` ${folderCount + 1}` : ''}`;

      const result = await window.electronAPI.folder.save({
        name: folderName,
        description: '',
        collectionId: collectionId,
      });

      if (result.success) {
        showSuccess('Folder created successfully');

        // Refresh folders
        const foldersData = await window.electronAPI.folder.list();
        setFolders(foldersData);

        // Trigger sidebar refresh
        triggerSidebarRefresh();
      }
    } catch (error: unknown) {
      showError(
        'Failed to create folder',
        error instanceof Error ? error.message : 'Failed to create folder'
      );
    }
  };

  const handleDeleteCollection = async (collectionId: number) => {
    try {
      await window.electronAPI.collection.delete(collectionId);
      showSuccess('Collection deleted successfully');
      setCollections(collections.filter(c => c.id !== collectionId));
      // Trigger sidebar refresh for real-time updates
      triggerSidebarRefresh();
    } catch (error: unknown) {
      showError(
        'Failed to delete collection',
        error instanceof Error ? error.message : 'Failed to delete collection'
      );
    }
  };

  const handleDuplicateCollection = async (collectionId: number) => {
    try {
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) {
        showError('Collection not found');
        return;
      }

      // Create the duplicate collection
      const duplicateCollection = {
        name: `${collection.name} (Copy)`,
        description: collection.description || '',
        environments: collection.environments
          ? collection.environments.map(env => ({ ...env, id: undefined }))
          : [],
        isFavorite: false,
      };

      const result =
        await window.electronAPI.collection.save(duplicateCollection);
      if (!result.success) {
        showError('Failed to create duplicate collection');
        return;
      }

      const newCollectionId = result.id;

      // Get all requests for the original collection
      const originalRequests =
        await window.electronAPI.request.list(collectionId);

      // Duplicate all requests for the new collection
      for (const request of originalRequests) {
        const duplicateRequest = {
          name: `${request.name} (Copy)`,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          queryParams: request.queryParams || [],
          auth: request.auth,
          collectionId: newCollectionId,
          folderId: undefined, // Reset folder association for simplicity
          isFavorite: false,
        };

        await window.electronAPI.request.save(duplicateRequest);

        // Small delay to ensure unique IDs
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      showSuccess('Collection and requests duplicated successfully');

      // Refresh collections and requests
      const updatedCollections = await window.electronAPI.collection.list();
      const updatedRequests = await window.electronAPI.request.list();
      setCollections(updatedCollections);
      setRequests(updatedRequests);

      // Trigger sidebar refresh for real-time updates
      triggerSidebarRefresh();
    } catch (error: unknown) {
      showError(
        'Failed to duplicate collection',
        error instanceof Error
          ? error.message
          : 'Failed to duplicate collection'
      );
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    try {
      await window.electronAPI.folder.delete(folderId);
      showSuccess('Folder deleted successfully');
      setFolders(folders.filter(f => f.id !== folderId));
      // Trigger sidebar refresh for real-time updates
      triggerSidebarRefresh();
    } catch (error: unknown) {
      showError(
        'Failed to delete folder',
        error instanceof Error ? error.message : 'Failed to delete folder'
      );
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    try {
      await window.electronAPI.request.delete(requestId);
      showSuccess('Request deleted successfully');
      setRequests(requests.filter(r => r.id !== requestId));
      // Trigger sidebar refresh for real-time updates
      triggerSidebarRefresh();
    } catch (error: unknown) {
      showError(
        'Failed to delete request',
        error instanceof Error ? error.message : 'Failed to delete request'
      );
    }
  };

  const handleDuplicateRequest = async (requestId: number) => {
    try {
      const originalRequest = requests.find(r => r.id === requestId);
      if (!originalRequest) return;

      const duplicatedRequest = {
        name: `${originalRequest.name} (Copy)`,
        method: originalRequest.method,
        url: originalRequest.url,
        headers: originalRequest.headers,
        body: originalRequest.body,
        queryParams: originalRequest.queryParams || [],
        auth: originalRequest.auth,
        collectionId: originalRequest.collectionId,
        folderId: originalRequest.folderId,
        isFavorite: false,
      };

      // Use saveAfter to insert the duplicate right after the original request
      await window.electronAPI.request.saveAfter(duplicatedRequest, requestId);
      showSuccess('Request duplicated successfully');

      // Refresh requests
      const requestsData = await window.electronAPI.request.list();
      setRequests(requestsData);

      // Trigger sidebar refresh for real-time updates
      triggerSidebarRefresh();
    } catch (error: unknown) {
      showError(
        'Failed to duplicate request',
        error instanceof Error ? error.message : 'Failed to duplicate request'
      );
    }
  };

  return (
    <div
      className="space-y-1"
      data-testid="collection-hierarchy"
      onFocus={() => setFocusedContext('sidebar')}
      onBlur={() => setFocusedContext(null)}
    >
      {collections.map(collection => {
        const isExpanded = expandedCollections.has(collection.id!);
        const collectionRequests = getRequestsForCollection(collection.id!);
        const collectionFolders = getFoldersForCollection(collection.id!);
        const totalRequests =
          collectionRequests.length +
          collectionFolders.reduce(
            (sum, folder) => sum + getRequestsForFolder(folder.id!).length,
            0
          );

        return (
          <div
            key={collection.id}
            data-testid="collection-group"
            data-collection-id={collection.id}
            data-collection-name={collection.name}
          >
            <CollectionItem
              collection={collection}
              isExpanded={isExpanded}
              requestCount={totalRequests}
              onToggle={() => toggleCollection(collection.id!)}
              onSelect={() =>
                setSelectedItem({
                  type: 'collection',
                  id: collection.id!,
                  data: collection,
                })
              }
              onEdit={() => {
                // Handle edit collection
                console.log('Edit collection:', collection.id);
              }}
              onDelete={() => handleDeleteCollection(collection.id!)}
              onAddRequest={() => handleAddRequest(collection.id!)}
              onAddFolder={() => handleAddFolder(collection.id!)}
              onDuplicate={() => handleDuplicateCollection(collection.id!)}
              onExport={() => {
                // Handle export collection
                console.log('Export collection:', collection.id);
              }}
              onImport={() => {
                // Handle import collection
                console.log('Import collection:', collection.id);
              }}
              dragProps={{
                draggable: true,
                onDragStart: e => {
                  dragDrop.handleDragStart(e, {
                    type: 'collection',
                    id: collection.id!,
                  });
                  setUnsavedDragOver(null);
                },
                onDragOver: e => {
                  // Check for unsaved requests first
                  if (isDraggingUnsavedRequest(e)) {
                    handleUnsavedDragOver(e, 'collection', collection.id!);
                  } else {
                    // Clear unsaved drag over state when dragging regular items
                    if (unsavedDragOver) {
                      setUnsavedDragOver(null);
                    }
                    e.preventDefault();
                    dragDrop.handleDragOver(e, {
                      type: 'collection',
                      id: collection.id!,
                    });
                  }
                },
                onDrop: async e => {
                  // Handle unsaved requests first
                  await handleCollectionDrop(e, collection.id!);
                  // Then handle regular drag-drop
                  await dragDrop.handleDrop(e, {
                    type: 'collection',
                    id: collection.id!,
                  });
                },
                onDragEnd: () => {
                  dragDrop.handleDragEnd();
                  setUnsavedDragOver(null);
                },
              }}
              isDragging={
                dragDrop.draggedItem?.type === 'collection' &&
                dragDrop.draggedItem?.id === collection.id
              }
              isDragOver={
                (unsavedDragOver?.type === 'collection' &&
                  unsavedDragOver?.id === collection.id) ||
                (dragDrop.dragOverItem?.type === 'collection' &&
                  dragDrop.dragOverItem?.id === collection.id)
              }
              dropPosition={
                unsavedDragOver?.type === 'collection' &&
                unsavedDragOver?.id === collection.id
                  ? 'inside'
                  : dragDrop.dropPosition
              }
            />

            {/* Expanded Content */}
            {isExpanded && (
              <div
                className={`ml-4 space-y-1 min-h-[20px] rounded-md transition-all duration-150 ${
                  (unsavedDragOver?.type === 'collection' &&
                    unsavedDragOver?.id === collection.id) ||
                  (dragDrop.dragOverItem?.type === 'collection' &&
                    dragDrop.dragOverItem?.id === collection.id)
                    ? 'bg-primary/5 border-l-2 border-primary/50 pl-2 -ml-4'
                    : ''
                }`}
                data-testid="collection-children"
                onDragOver={e => {
                  // Check for unsaved requests first
                  if (isDraggingUnsavedRequest(e)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    handleUnsavedDragOver(e, 'collection', collection.id!);
                  } else {
                    // Clear unsaved drag over state when dragging regular items
                    if (
                      unsavedDragOver?.type === 'collection' &&
                      unsavedDragOver?.id === collection.id
                    ) {
                      setUnsavedDragOver(null);
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    dragDrop.handleDragOver(e, {
                      type: 'collection',
                      id: collection.id!,
                    });
                  }
                }}
                onDrop={async e => {
                  e.stopPropagation();
                  // Handle unsaved requests first
                  await handleCollectionDrop(e, collection.id!);
                  // Then handle regular drag-drop
                  await dragDrop.handleDrop(e, {
                    type: 'collection',
                    id: collection.id!,
                  });
                }}
                onDragEnter={e => {
                  // When entering the expanded area, ensure we show the collection as drag-over
                  if (isDraggingUnsavedRequest(e)) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUnsavedDragOver(e, 'collection', collection.id!);
                  }
                }}
                onDragLeave={e => {
                  // Only clear if we're actually leaving the collection group entirely
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (relatedTarget) {
                    const collectionGroup = e.currentTarget.closest(
                      '[data-testid="collection-group"]'
                    );
                    // Only clear if the relatedTarget is outside the collection group
                    if (
                      collectionGroup &&
                      !collectionGroup.contains(relatedTarget)
                    ) {
                      setUnsavedDragOver(null);
                    }
                  }
                  // If no relatedTarget, don't clear - might be moving to collection header
                }}
              >
                {/* Folders */}
                {collectionFolders.map(folder => {
                  const folderRequests = getRequestsForFolder(folder.id!);
                  const isFolderExpanded = expandedFolders.has(folder.id!);
                  return (
                    <div key={folder.id}>
                      <FolderItem
                        folder={folder}
                        requestCount={folderRequests.length}
                        isExpanded={isFolderExpanded}
                        onToggle={() => toggleFolder(folder.id!)}
                        onSelect={() =>
                          setSelectedItem({
                            type: 'folder',
                            id: folder.id!,
                            data: folder,
                          })
                        }
                        onEdit={() => {
                          // Handle edit folder
                          console.log('Edit folder:', folder.id);
                        }}
                        onDelete={() => handleDeleteFolder(folder.id!)}
                        onAddRequest={() => handleAddRequest(collection.id!)}
                        dragProps={{
                          draggable: true,
                          onDragStart: e => {
                            dragDrop.handleDragStart(e, {
                              type: 'folder',
                              id: folder.id!,
                              collectionId: folder.collectionId,
                            });
                            setUnsavedDragOver(null);
                          },
                          onDragOver: e => {
                            // Check for unsaved requests first
                            if (isDraggingUnsavedRequest(e)) {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                              handleUnsavedDragOver(e, 'folder', folder.id!);
                            } else {
                              // Clear unsaved drag over state when dragging regular items
                              if (
                                unsavedDragOver?.type === 'folder' &&
                                unsavedDragOver?.id === folder.id
                              ) {
                                setUnsavedDragOver(null);
                              }
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const mouseY = e.clientY;
                              const itemCenterY = rect.top + rect.height / 2;
                              const position =
                                mouseY < itemCenterY ? 'above' : 'below';
                              dragDrop.handleDragOver(
                                e,
                                {
                                  type: 'folder',
                                  id: folder.id!,
                                  collectionId: folder.collectionId,
                                },
                                position
                              );
                            }
                          },
                          onDrop: async e => {
                            e.stopPropagation();
                            // Handle unsaved requests first
                            await handleCollectionDrop(
                              e,
                              folder.collectionId,
                              folder.id!
                            );
                            // Then handle regular drag-drop
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            const mouseY = e.clientY;
                            const itemCenterY = rect.top + rect.height / 2;
                            const position =
                              mouseY < itemCenterY ? 'above' : 'below';
                            dragDrop.handleDrop(
                              e,
                              {
                                type: 'folder',
                                id: folder.id!,
                                collectionId: folder.collectionId,
                              },
                              position
                            );
                          },
                          onDragEnd: () => {
                            dragDrop.handleDragEnd();
                            setUnsavedDragOver(null);
                          },
                          onDragLeave: e => {
                            // Only clear if we're actually leaving the folder group entirely
                            const relatedTarget =
                              e.relatedTarget as HTMLElement;
                            if (relatedTarget) {
                              // Check if we're moving to the expanded area or another part of the folder
                              const folderContainer =
                                e.currentTarget.closest('div');
                              if (
                                folderContainer &&
                                !folderContainer.contains(relatedTarget)
                              ) {
                                setUnsavedDragOver(null);
                              }
                            }
                            // If no relatedTarget, don't clear - might be moving to expanded area
                          },
                        }}
                        isDragging={
                          dragDrop.draggedItem?.type === 'folder' &&
                          dragDrop.draggedItem?.id === folder.id
                        }
                        isDragOver={
                          (unsavedDragOver?.type === 'folder' &&
                            unsavedDragOver?.id === folder.id) ||
                          (dragDrop.dragOverItem?.type === 'folder' &&
                            dragDrop.dragOverItem?.id === folder.id)
                        }
                        dropPosition={
                          unsavedDragOver?.type === 'folder' &&
                          unsavedDragOver?.id === folder.id
                            ? 'inside'
                            : dragDrop.dropPosition
                        }
                      />

                      {/* Folder Expanded Content */}
                      {isFolderExpanded && (
                        <div
                          className={`ml-8 space-y-1 min-h-[20px] rounded-md transition-all duration-150 ${
                            (unsavedDragOver?.type === 'folder' &&
                              unsavedDragOver?.id === folder.id) ||
                            (dragDrop.dragOverItem?.type === 'folder' &&
                              dragDrop.dragOverItem?.id === folder.id)
                              ? 'bg-primary/5 border-l-2 border-primary/50 pl-2 -ml-8'
                              : ''
                          }`}
                          onDragOver={e => {
                            // Check for unsaved requests first
                            if (isDraggingUnsavedRequest(e)) {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                              handleUnsavedDragOver(e, 'folder', folder.id!);
                            } else {
                              // Clear unsaved drag over state when dragging regular items
                              if (
                                unsavedDragOver?.type === 'folder' &&
                                unsavedDragOver?.id === folder.id
                              ) {
                                setUnsavedDragOver(null);
                              }
                              e.preventDefault();
                              e.stopPropagation();
                              dragDrop.handleDragOver(
                                e,
                                {
                                  type: 'folder',
                                  id: folder.id!,
                                  collectionId: folder.collectionId,
                                },
                                'inside'
                              );
                            }
                          }}
                          onDrop={async e => {
                            e.stopPropagation();
                            // Handle unsaved requests first
                            await handleCollectionDrop(
                              e,
                              folder.collectionId,
                              folder.id!
                            );
                            // Then handle regular drag-drop
                            await dragDrop.handleDrop(
                              e,
                              {
                                type: 'folder',
                                id: folder.id!,
                                collectionId: folder.collectionId,
                              },
                              'inside'
                            );
                          }}
                          onDragEnter={e => {
                            // When entering the expanded area, ensure we show the folder as drag-over
                            if (isDraggingUnsavedRequest(e)) {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUnsavedDragOver(e, 'folder', folder.id!);
                            }
                          }}
                          onDragLeave={e => {
                            // Only clear if we're actually leaving the folder group entirely
                            const relatedTarget =
                              e.relatedTarget as HTMLElement;
                            if (relatedTarget) {
                              const folderGroup =
                                e.currentTarget.closest('div');
                              // Only clear if the relatedTarget is outside the folder group
                              if (
                                folderGroup &&
                                !folderGroup.contains(relatedTarget)
                              ) {
                                setUnsavedDragOver(null);
                              }
                            }
                            // If no relatedTarget, don't clear - might be moving to folder header
                          }}
                        >
                          {/* Folder Requests */}
                          {folderRequests.map(request => (
                            <RequestItem
                              key={request.id}
                              request={request}
                              onSelect={onRequestSelect}
                              onItemSelect={() =>
                                setSelectedItem({
                                  type: 'request',
                                  id: request.id!,
                                  data: request,
                                })
                              }
                              onEdit={() => {
                                // Handle edit request
                                console.log('Edit request:', request.id);
                              }}
                              onDelete={() => handleDeleteRequest(request.id!)}
                              onDuplicate={() =>
                                handleDuplicateRequest(request.id!)
                              }
                              onExport={() => {
                                // Handle export request
                                console.log('Export request:', request.id);
                              }}
                              dragProps={{
                                draggable: true,
                                onDragStart: e =>
                                  dragDrop.handleDragStart(e, {
                                    type: 'request',
                                    id: request.id!,
                                    collectionId: request.collectionId,
                                    folderId: request.folderId,
                                  }),
                                onDragOver: e => {
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  const mouseY = e.clientY;
                                  const itemCenterY =
                                    rect.top + rect.height / 2;
                                  const position =
                                    mouseY < itemCenterY ? 'above' : 'below';
                                  dragDrop.handleDragOver(
                                    e,
                                    {
                                      type: 'request',
                                      id: request.id!,
                                      collectionId: request.collectionId,
                                      folderId: request.folderId,
                                    },
                                    position
                                  );
                                },
                                onDrop: e => {
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  const mouseY = e.clientY;
                                  const itemCenterY =
                                    rect.top + rect.height / 2;
                                  const position =
                                    mouseY < itemCenterY ? 'above' : 'below';
                                  dragDrop.handleDrop(
                                    e,
                                    {
                                      type: 'request',
                                      id: request.id!,
                                      collectionId: request.collectionId,
                                      folderId: request.folderId,
                                    },
                                    position
                                  );
                                },
                                onDragEnd: dragDrop.handleDragEnd,
                              }}
                              isDragging={
                                dragDrop.draggedItem?.type === 'request' &&
                                dragDrop.draggedItem?.id === request.id
                              }
                              isDragOver={
                                dragDrop.dragOverItem?.type === 'request' &&
                                dragDrop.dragOverItem?.id === request.id
                              }
                              dropPosition={dragDrop.dropPosition}
                            />
                          ))}
                          {folderRequests.length === 0 && (
                            <div className="ml-8 text-xs text-muted-foreground p-2">
                              No requests in this folder
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Collection Requests (not in folders) */}
                {collectionRequests.map(request => (
                  <RequestItem
                    key={request.id}
                    request={request}
                    onSelect={onRequestSelect}
                    onItemSelect={() =>
                      setSelectedItem({
                        type: 'request',
                        id: request.id!,
                        data: request,
                      })
                    }
                    onEdit={() => {
                      // Handle edit request
                      console.log('Edit request:', request.id);
                    }}
                    onDelete={() => handleDeleteRequest(request.id!)}
                    onDuplicate={() => handleDuplicateRequest(request.id!)}
                    onExport={() => {
                      // Handle export request
                      console.log('Export request:', request.id);
                    }}
                    dragProps={{
                      draggable: true,
                      onDragStart: e =>
                        dragDrop.handleDragStart(e, {
                          type: 'request',
                          id: request.id!,
                          collectionId: request.collectionId,
                          folderId: request.folderId,
                        }),
                      onDragOver: e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const mouseY = e.clientY;
                        const itemCenterY = rect.top + rect.height / 2;
                        const position =
                          mouseY < itemCenterY ? 'above' : 'below';
                        dragDrop.handleDragOver(
                          e,
                          {
                            type: 'request',
                            id: request.id!,
                            collectionId: request.collectionId,
                            folderId: request.folderId,
                          },
                          position
                        );
                      },
                      onDrop: e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const mouseY = e.clientY;
                        const itemCenterY = rect.top + rect.height / 2;
                        const position =
                          mouseY < itemCenterY ? 'above' : 'below';
                        dragDrop.handleDrop(
                          e,
                          {
                            type: 'request',
                            id: request.id!,
                            collectionId: request.collectionId,
                            folderId: request.folderId,
                          },
                          position
                        );
                      },
                      onDragEnd: dragDrop.handleDragEnd,
                    }}
                    isDragging={
                      dragDrop.draggedItem?.type === 'request' &&
                      dragDrop.draggedItem?.id === request.id
                    }
                    isDragOver={
                      dragDrop.dragOverItem?.type === 'request' &&
                      dragDrop.dragOverItem?.id === request.id
                    }
                    dropPosition={dragDrop.dropPosition}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
