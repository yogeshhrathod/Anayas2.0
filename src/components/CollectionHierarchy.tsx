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

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useCollectionDragDrop } from '../hooks/useCollectionDragDrop';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { CollectionItem } from './collection/CollectionItem';
import { FolderItem } from './collection/FolderItem';
import { RequestItem } from './collection/RequestItem';
import { Request, Folder } from '../types/entities';

export interface CollectionHierarchyProps {
  onRequestSelect: (request: Request) => void;
}

export function CollectionHierarchy({ onRequestSelect }: CollectionHierarchyProps) {
  const { 
    collections, 
    setCollections, 
    expandedCollections, 
    setExpandedCollections, 
    setCurrentPage, 
    setSelectedRequest, 
    setSelectedCollectionForNewRequest, 
    sidebarRefreshTrigger 
  } = useStore();
  
  const { showSuccess, showError } = useToastNotifications();
  const [requests, setRequests] = useState<Request[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  // Load requests and folders when collections change
  useEffect(() => {
    const loadData = async () => {
      try {
        const [requestsData, foldersData] = await Promise.all([
          window.electronAPI.request.list(),
          window.electronAPI.folder.list()
        ]);
        setRequests(requestsData);
        setFolders(foldersData);
      } catch (error: any) {
        console.error('Failed to load requests and folders:', error);
      }
    };
    loadData();
  }, [collections, sidebarRefreshTrigger]);

  // Drag and drop functionality
  const dragDrop = useCollectionDragDrop({
    onMoveRequest: async (requestId, targetCollectionId, targetFolderId) => {
      try {
        await window.electronAPI.request.save({
          id: requestId,
          name: requests.find(r => r.id === requestId)?.name || '',
          method: requests.find(r => r.id === requestId)?.method as any || 'GET',
          url: requests.find(r => r.id === requestId)?.url || '',
          headers: requests.find(r => r.id === requestId)?.headers || {},
          body: requests.find(r => r.id === requestId)?.body || '',
          queryParams: requests.find(r => r.id === requestId)?.queryParams || [],
          auth: requests.find(r => r.id === requestId)?.auth || { type: 'none' },
          collectionId: targetCollectionId,
          folderId: targetFolderId,
          isFavorite: Boolean(requests.find(r => r.id === requestId)?.is_favorite),
        });
        showSuccess('Request moved successfully');
        // Refresh data
        const [requestsData, foldersData] = await Promise.all([
          window.electronAPI.request.list(),
          window.electronAPI.folder.list()
        ]);
        setRequests(requestsData);
        setFolders(foldersData);
      } catch (error: any) {
        showError('Failed to move request', error.message);
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
      } catch (error: any) {
        showError('Failed to move folder', error.message);
      }
    }
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

  const getRequestsForCollection = (collectionId: number) => {
    return requests.filter(r => r.collection_id === collectionId);
  };

  const getRequestsForFolder = (folderId: number) => {
    return requests.filter(r => r.folder_id === folderId);
  };

  const getFoldersForCollection = (collectionId: number) => {
    return folders.filter(f => f.collection_id === collectionId);
  };

  const handleAddRequest = (collectionId: number) => {
    setSelectedCollectionForNewRequest(collectionId);
    setCurrentPage('collections');
    setSelectedRequest(null);
  };

  const handleAddFolder = (collectionId: number) => {
    // TODO: Implement folder creation dialog
    console.log('Add folder to collection:', collectionId);
  };

  const handleDeleteCollection = async (collectionId: number) => {
    try {
      await window.electronAPI.collection.delete(collectionId);
      showSuccess('Collection deleted successfully');
      setCollections(collections.filter(c => c.id !== collectionId));
    } catch (error: any) {
      showError('Failed to delete collection', error.message);
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    try {
      await window.electronAPI.folder.delete(folderId);
      showSuccess('Folder deleted successfully');
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (error: any) {
      showError('Failed to delete folder', error.message);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    try {
      await window.electronAPI.request.delete(requestId);
      showSuccess('Request deleted successfully');
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (error: any) {
      showError('Failed to delete request', error.message);
    }
  };

  return (
    <div className="space-y-1">
      {collections.map((collection) => {
        const isExpanded = expandedCollections.has(collection.id!);
        const collectionRequests = getRequestsForCollection(collection.id!);
        const collectionFolders = getFoldersForCollection(collection.id!);
        const totalRequests = collectionRequests.length + 
          collectionFolders.reduce((sum, folder) => sum + getRequestsForFolder(folder.id!).length, 0);

        return (
          <div key={collection.id}>
            <CollectionItem
              collection={collection}
              isExpanded={isExpanded}
              requestCount={totalRequests}
              onToggle={() => toggleCollection(collection.id!)}
              onEdit={() => {
                // Handle edit collection
                console.log('Edit collection:', collection.id);
              }}
              onDelete={() => handleDeleteCollection(collection.id!)}
              onAddRequest={() => handleAddRequest(collection.id!)}
              onAddFolder={() => handleAddFolder(collection.id!)}
              onDuplicate={() => {
                // Handle duplicate collection
                console.log('Duplicate collection:', collection.id);
              }}
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
                onDragStart: (e) => dragDrop.handleDragStart(e, { type: 'collection', id: collection.id! }),
                onDragOver: (e) => dragDrop.handleDragOver(e, { type: 'collection', id: collection.id! }),
                onDrop: (e) => dragDrop.handleDrop(e, { type: 'collection', id: collection.id! }),
                onDragEnd: dragDrop.handleDragEnd,
              }}
            />

            {/* Expanded Content */}
            {isExpanded && (
              <div className="ml-4 space-y-1">
                {/* Folders */}
                {collectionFolders.map((folder) => {
                  const folderRequests = getRequestsForFolder(folder.id!);
                  return (
                    <div key={folder.id}>
                      <FolderItem
                        folder={folder}
                        requestCount={folderRequests.length}
                        onEdit={() => {
                          // Handle edit folder
                          console.log('Edit folder:', folder.id);
                        }}
                        onDelete={() => handleDeleteFolder(folder.id!)}
                        onAddRequest={() => handleAddRequest(collection.id!)}
                        dragProps={{
                          draggable: true,
                          onDragStart: (e) => dragDrop.handleDragStart(e, { type: 'folder', id: folder.id! }),
                          onDragOver: (e) => dragDrop.handleDragOver(e, { type: 'folder', id: folder.id! }),
                          onDrop: (e) => dragDrop.handleDrop(e, { type: 'folder', id: folder.id! }),
                          onDragEnd: dragDrop.handleDragEnd,
                        }}
                      />

                      {/* Folder Requests */}
                      {folderRequests.map((request) => (
                        <RequestItem
                          key={request.id}
                          request={request}
                          onSelect={onRequestSelect}
                          onEdit={() => {
                            // Handle edit request
                            console.log('Edit request:', request.id);
                          }}
                          onDelete={() => handleDeleteRequest(request.id!)}
                          onDuplicate={() => {
                            // Handle duplicate request
                            console.log('Duplicate request:', request.id);
                          }}
                          onExport={() => {
                            // Handle export request
                            console.log('Export request:', request.id);
                          }}
                          dragProps={{
                            draggable: true,
                            onDragStart: (e) => dragDrop.handleDragStart(e, { type: 'request', id: request.id! }),
                            onDragOver: (e) => dragDrop.handleDragOver(e, { type: 'request', id: request.id! }),
                            onDrop: (e) => dragDrop.handleDrop(e, { type: 'request', id: request.id! }),
                            onDragEnd: dragDrop.handleDragEnd,
                          }}
                        />
                      ))}
                    </div>
                  );
                })}

                {/* Collection Requests (not in folders) */}
                {collectionRequests.filter(r => !r.folder_id).map((request) => (
                  <RequestItem
                    key={request.id}
                    request={request}
                    onSelect={onRequestSelect}
                    onEdit={() => {
                      // Handle edit request
                      console.log('Edit request:', request.id);
                    }}
                    onDelete={() => handleDeleteRequest(request.id!)}
                    onDuplicate={() => {
                      // Handle duplicate request
                      console.log('Duplicate request:', request.id);
                    }}
                    onExport={() => {
                      // Handle export request
                      console.log('Export request:', request.id);
                    }}
                    dragProps={{
                      draggable: true,
                      onDragStart: (e) => dragDrop.handleDragStart(e, { type: 'request', id: request.id! }),
                      onDragOver: (e) => dragDrop.handleDragOver(e, { type: 'request', id: request.id! }),
                      onDrop: (e) => dragDrop.handleDrop(e, { type: 'request', id: request.id! }),
                      onDragEnd: dragDrop.handleDragEnd,
                    }}
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