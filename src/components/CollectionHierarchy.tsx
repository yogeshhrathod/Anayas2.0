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
    setSelectedItem,
    setFocusedContext,
    sidebarRefreshTrigger,
    triggerSidebarRefresh
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

  // Handle drop on collection (including unsaved requests)
  const handleCollectionDrop = async (e: React.DragEvent, collectionId: number) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'unsaved-request') {
        // Promote unsaved request to this collection
        const result = await window.electronAPI.unsavedRequest.promote(data.id, {
          name: data.data.name,
          collectionId: collectionId,
          folderId: undefined,
          isFavorite: false,
        });
        
        if (result.success) {
          showSuccess('Unsaved request saved to collection');
          
          // Load the newly saved request and set it as selected
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
            folderId: undefined,
            isFavorite: 0,
          };
          
          setSelectedRequest(savedRequest);
          
          // Refresh data including unsaved requests
          const [requestsData, foldersData, unsavedData] = await Promise.all([
            window.electronAPI.request.list(),
            window.electronAPI.folder.list(),
            window.electronAPI.unsavedRequest.getAll()
          ]);
          setRequests(requestsData);
          setFolders(foldersData);
          
          // Update unsaved requests in store
          const { setUnsavedRequests } = useStore.getState();
          setUnsavedRequests(unsavedData);
          
          // Trigger sidebar refresh
          triggerSidebarRefresh();
        }
      }
    } catch (error: any) {
      console.error('Drop failed:', error);
      showError('Failed to save request', error.message);
    }
  };

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
          isFavorite: Boolean(requests.find(r => r.id === requestId)?.isFavorite),
        });
        showSuccess('Request moved successfully');
        // Refresh data
        const [requestsData, foldersData] = await Promise.all([
          window.electronAPI.request.list(),
          window.electronAPI.folder.list()
        ]);
        setRequests(requestsData);
        setFolders(foldersData);
        
        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
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
        
        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
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
    return requests.filter(r => r.collectionId === collectionId);
  };

  const getRequestsForFolder = (folderId: number) => {
    return requests.filter(r => r.folderId === folderId);
  };

  const getFoldersForCollection = (collectionId: number) => {
    return folders.filter(f => f.collectionId === collectionId);
  };

  const handleAddRequest = (collectionId: number) => {
    // Set selected collection for keyboard shortcuts
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      setSelectedItem({ type: 'collection', id: collectionId, data: collection });
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

  const handleAddFolder = (collectionId: number) => {
    // Set selected collection for keyboard shortcuts
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      setSelectedItem({ type: 'collection', id: collectionId, data: collection });
    }
    
    // TODO: Implement folder creation dialog
    console.log('Add folder to collection:', collectionId);
  };

  const handleDeleteCollection = async (collectionId: number) => {
    try {
      await window.electronAPI.collection.delete(collectionId);
      showSuccess('Collection deleted successfully');
      setCollections(collections.filter(c => c.id !== collectionId));
      // Trigger sidebar refresh for real-time updates
      triggerSidebarRefresh();
    } catch (error: any) {
      showError('Failed to delete collection', error.message);
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
        environments: collection.environments ? collection.environments.map(env => ({ ...env, id: undefined })) : [],
        isFavorite: false
      };

      const result = await window.electronAPI.collection.save(duplicateCollection);
      if (!result.success) {
        showError('Failed to create duplicate collection');
        return;
      }

      const newCollectionId = result.id;

      // Get all requests for the original collection
      const originalRequests = await window.electronAPI.request.list(collectionId);
      
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
          isFavorite: false
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
    } catch (error: any) {
      showError('Failed to duplicate collection', error.message);
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    try {
      await window.electronAPI.folder.delete(folderId);
      showSuccess('Folder deleted successfully');
      setFolders(folders.filter(f => f.id !== folderId));
      // Trigger sidebar refresh for real-time updates
      triggerSidebarRefresh();
    } catch (error: any) {
      showError('Failed to delete folder', error.message);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    try {
      await window.electronAPI.request.delete(requestId);
      showSuccess('Request deleted successfully');
      setRequests(requests.filter(r => r.id !== requestId));
      // Trigger sidebar refresh for real-time updates
      triggerSidebarRefresh();
    } catch (error: any) {
      showError('Failed to delete request', error.message);
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
    } catch (error: any) {
      showError('Failed to duplicate request', error.message);
    }
  };

  return (
    <div 
      className="space-y-1"
      onFocus={() => setFocusedContext('sidebar')}
      onBlur={() => setFocusedContext(null)}
    >
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
              onSelect={() => setSelectedItem({ type: 'collection', id: collection.id!, data: collection })}
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
                onDragStart: (e) => dragDrop.handleDragStart(e, { type: 'collection', id: collection.id! }),
                onDragOver: (e) => {
                  e.preventDefault();
                  dragDrop.handleDragOver(e, { type: 'collection', id: collection.id! });
                },
                onDrop: (e) => {
                  handleCollectionDrop(e, collection.id!);
                  dragDrop.handleDrop(e, { type: 'collection', id: collection.id! });
                },
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
                        onSelect={() => setSelectedItem({ type: 'folder', id: folder.id!, data: folder })}
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
                          onItemSelect={() => setSelectedItem({ type: 'request', id: request.id!, data: request })}
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
                {collectionRequests.filter(r => !r.folderId).map((request) => (
                  <RequestItem
                    key={request.id}
                    request={request}
                    onSelect={onRequestSelect}
                    onItemSelect={() => setSelectedItem({ type: 'request', id: request.id!, data: request })}
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