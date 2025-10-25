import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { InputDialog } from './ui/input-dialog';
import { 
  ChevronRight, 
  ChevronDown, 
  Star, 
  StarOff, 
  Trash2,
  GripVertical,
  MoreVertical,
  Plus,
  Folder,
  Edit,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { useToast } from './ui/use-toast';

// Use the Collection type from the store

interface Request {
  id: number;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  collection_id: number;
  folder_id?: number;
  is_favorite: number;
  created_at: string;
  headers?: Record<string, string>;
  body?: string;
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
  auth?: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
}

interface CollectionHierarchyProps {
  onRequestSelect?: (request: Request) => void;
}

export function CollectionHierarchy({ onRequestSelect }: CollectionHierarchyProps) {
  const { collections, setCollections, expandedCollections, setExpandedCollections, setCurrentPage, setSelectedRequest, setSelectedCollectionForNewRequest, sidebarRefreshTrigger } = useStore();
  const { success, error } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [draggedItem, setDraggedItem] = useState<{ type: 'collection' | 'request' | 'folder'; id: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ type: 'collection' | 'request' | 'folder'; id: number } | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderCollectionId, setFolderCollectionId] = useState<number | null>(null);
  
  // Inline editing state
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [tempRequestName, setTempRequestName] = useState('');

  const loadRequests = async () => {
    try {
      const requestsData = await window.electronAPI.request.list();
      setRequests(requestsData);
    } catch (e: any) {
      console.error('Failed to load requests:', e);
    }
  };

  const loadFolders = async () => {
    try {
      const foldersData = await window.electronAPI.folder.list();
      setFolders(foldersData);
    } catch (e: any) {
      console.error('Failed to load folders:', e);
    }
  };

  useEffect(() => {
    loadRequests();
    loadFolders();
  }, []);

  // Refresh when sidebar refresh trigger changes
  useEffect(() => {
    if (sidebarRefreshTrigger > 0) {
      loadRequests();
    }
  }, [sidebarRefreshTrigger]);

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
    return requests.filter(req => req.collection_id === collectionId && !req.folder_id);
  };

  const getFoldersForCollection = (collectionId: number) => {
    return folders.filter(folder => folder.collection_id === collectionId);
  };

  const getRequestsForFolder = (folderId: number) => {
    return requests.filter(req => req.folder_id === folderId);
  };

  const handleDragStart = (e: React.DragEvent, type: 'collection' | 'request' | 'folder', id: number) => {
    setDraggedItem({ type, id });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e: React.DragEvent, type: 'collection' | 'request' | 'folder', id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem({ type, id });
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetType: 'collection' | 'request' | 'folder', targetId: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    try {
      if (draggedItem.type === 'request' && targetType === 'collection') {
        // Move request to different collection (remove from folder)
        const request = requests.find(r => r.id === draggedItem.id);
        if (request) {
          await window.electronAPI.request.save({
            id: draggedItem.id,
            collectionId: targetId,
            folderId: undefined, // Remove from folder
            name: request.name,
            method: request.method,
            url: request.url,
            headers: request.headers || {},
            body: request.body || '',
            auth: request.auth || { type: 'none' },
            isFavorite: request.is_favorite === 1
          });
        }
      } else if (draggedItem.type === 'request' && targetType === 'folder') {
        // Move request to folder
        const request = requests.find(r => r.id === draggedItem.id);
        const folder = folders.find(f => f.id === targetId);
        if (request && folder) {
          await window.electronAPI.request.save({
            id: draggedItem.id,
            collectionId: folder.collection_id, // Keep same collection
            folderId: targetId, // Move to folder
            name: request.name,
            method: request.method,
            url: request.url,
            headers: request.headers || {},
            body: request.body || '',
            auth: request.auth || { type: 'none' },
            isFavorite: request.is_favorite === 1
          });
        }
      } else if (draggedItem.type === 'collection') {
        // Reorder collections (this would require backend support for ordering)
        console.log('Collection reordering not yet implemented');
      }
      
      // Reload data after successful move
      await loadRequests();
      success('Request moved', 'Request has been moved successfully');
    } catch (e: any) {
      console.error('Failed to move item:', e);
      error('Move failed', 'Could not move item');
    } finally {
      setDraggedItem(null);
      setDragOverItem(null);
    }
  };

  const handleToggleFavorite = async (collectionId: number) => {
    try {
      await window.electronAPI.collection.toggleFavorite(collectionId);
      const updatedCollections = await window.electronAPI.collection.list();
      setCollections(updatedCollections);
    } catch (e: any) {
      console.error('Failed to toggle favorite:', e);
      error('Update failed', 'Could not update collection');
    }
  };

  const handleToggleFavoriteRequest = async (requestId: number) => {
    try {
      // Find the request and toggle its favorite status
      const request = requests.find(r => r.id === requestId);
      if (request) {
        const updatedRequest = { 
          ...request, 
          is_favorite: request.is_favorite === 1 ? 0 : 1,
          headers: request.headers || {},
          body: request.body || '',
          queryParams: request.queryParams || [],
          auth: request.auth || { type: 'none' }
        };
        await window.electronAPI.request.save(updatedRequest);
        await loadRequests();
        success('Favorite toggled', `Request ${updatedRequest.is_favorite === 1 ? 'added to' : 'removed from'} favorites`);
      }
    } catch (e: any) {
      console.error('Failed to toggle request favorite:', e);
      error('Toggle failed', 'Could not toggle request favorite status');
    }
  };

  const handleDeleteCollection = async (collectionId: number) => {
    if (!confirm('Are you sure you want to delete this collection? This will also delete all requests in this collection.')) return;

    try {
      await window.electronAPI.collection.delete(collectionId);
      const updatedCollections = await window.electronAPI.collection.list();
      setCollections(updatedCollections);
      await loadRequests();
      success('Collection deleted', 'The collection has been removed');
    } catch (e: any) {
      console.error('Failed to delete collection:', e);
      error('Delete failed', 'Could not delete collection');
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      await window.electronAPI.request.delete(requestId);
      await loadRequests();
      success('Request deleted', 'The request has been removed');
    } catch (e: any) {
      console.error('Failed to delete request:', e);
      error('Delete failed', 'Could not delete request');
    }
  };

  const handleAddRequest = (collectionId: number) => {
    // Clear any selected request and set the collection for new request
    setSelectedRequest(null);
    setSelectedCollectionForNewRequest(collectionId);
    setCurrentPage('home');
    
    success('Ready to create request', 'Navigate to the request builder to create a new request');
  };

  const handleAddFolder = (collectionId: number) => {
    setFolderCollectionId(collectionId);
    setShowFolderDialog(true);
  };

  const handleCreateFolder = async (folderName: string) => {
    if (!folderCollectionId) return;

    try {
      const result = await window.electronAPI.folder.save({
        name: folderName,
        description: `Folder in ${collections.find(c => c.id === folderCollectionId)?.name || 'collection'}`,
        collectionId: folderCollectionId,
      });
      
      if (result.success) {
        const updatedCollections = await window.electronAPI.collection.list();
        setCollections(updatedCollections);
        success('Folder created', `Folder "${folderName}" has been created`);
      }
    } catch (e: any) {
      console.error('Failed to create folder:', e);
      error('Create failed', 'Could not create folder');
    }

    setShowFolderDialog(false);
    setFolderCollectionId(null);
  };

  const handleEditCollection = () => {
    setCurrentPage('collections');
  };

  const handleImportCollection = () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (!importData.collection || !importData.requests) {
          throw new Error('Invalid collection format');
        }

        // Create the collection
        const collection = {
          name: importData.collection.name,
          description: importData.collection.description || '',
          variables: importData.collection.variables || {},
          isFavorite: false,
        };

        const result = await window.electronAPI.collection.save(collection);
        
        if (result.success) {
          const collectionId = result.id;
          
          // Import all requests
          for (const requestData of importData.requests) {
            await window.electronAPI.request.save({
              name: requestData.name || '',
              method: requestData.method || 'GET',
              url: requestData.url || '',
              headers: requestData.headers || {},
              body: requestData.body || '',
              collectionId: collectionId,
              isFavorite: false,
            });
          }

          const updatedCollections = await window.electronAPI.collection.list();
          setCollections(updatedCollections);
          await loadRequests();
          success('Collection imported', `Collection "${collection.name}" with ${importData.requests.length} requests has been imported`);
        }
      } catch (e: any) {
        console.error('Failed to import collection:', e);
        error('Import failed', 'Could not import collection. Please check the file format.');
      }
    };

    input.click();
  };

  // Inline editing functions for requests
  const handleRequestNameDoubleClick = (request: Request) => {
    setEditingRequestId(request.id);
    setTempRequestName(request.name);
  };

  const handleRequestNameSave = async (request: Request) => {
    if (!tempRequestName.trim()) {
      setTempRequestName(request.name);
      setEditingRequestId(null);
      return;
    }

    if (tempRequestName.trim() === request.name) {
      setEditingRequestId(null);
      return;
    }

    try {
      await window.electronAPI.request.save({
        id: request.id,
        name: tempRequestName.trim(),
        method: request.method,
        url: request.url,
        headers: request.headers || {},
        body: request.body || '',
        queryParams: request.queryParams || [],
        auth: request.auth || { type: 'none' },
        collectionId: request.collection_id,
        folderId: request.folder_id,
        isFavorite: request.is_favorite === 1,
      });
      
      // Update local state
      setRequests(requests.map(r => 
        r.id === request.id ? { ...r, name: tempRequestName.trim() } : r
      ));
      
      success('Request updated', 'Request name has been updated');
    } catch (e: any) {
      console.error('Failed to update request name:', e);
      error('Update failed', 'Failed to update request name');
      setTempRequestName(request.name);
    }
    
    setEditingRequestId(null);
  };

  const handleRequestNameCancel = (request: Request) => {
    setTempRequestName(request.name);
    setEditingRequestId(null);
  };

  const handleRequestNameKeyDown = (e: React.KeyboardEvent, request: Request) => {
    if (e.key === 'Enter') {
      handleRequestNameSave(request);
    } else if (e.key === 'Escape') {
      handleRequestNameCancel(request);
    }
  };

  const handleDuplicateCollection = async (collection: any) => {
    try {
      const duplicatedCollection = {
        ...collection,
        name: `${collection.name} (Copy)`,
        id: undefined,
      };
      
      await window.electronAPI.collection.save(duplicatedCollection);
      const updatedCollections = await window.electronAPI.collection.list();
      setCollections(updatedCollections);
      success('Collection duplicated', `${duplicatedCollection.name} has been created`);
    } catch (e: any) {
      console.error('Failed to duplicate collection:', e);
      error('Duplicate failed', 'Could not duplicate collection');
    }
  };

  const handleExportCollection = async (collection: any) => {
    try {
      const collectionRequests = getRequestsForCollection(collection.id);
      const exportData = {
        collection: {
          name: collection.name,
          description: collection.description,
          variables: collection.variables,
        },
        requests: collectionRequests.map(req => ({
          name: req.name,
          method: req.method,
          url: req.url,
          headers: typeof (req as any).headers === 'string' 
            ? JSON.parse((req as any).headers) 
            : ((req as any).headers || {}),
          body: (req as any).body || '',
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success('Collection exported', `${collection.name} has been exported successfully`);
    } catch (e: any) {
      console.error('Failed to export collection:', e);
      error('Export failed', 'Could not export collection');
    }
  };

  return (
    <div className="space-y-1">
      {collections.map((collection: any) => {
        const collectionRequests = getRequestsForCollection(collection.id);
        const collectionFolders = getFoldersForCollection(collection.id);
        const isExpanded = expandedCollections.has(collection.id);
        const isDraggedOver = dragOverItem?.type === 'collection' && dragOverItem.id === collection.id;
        const isDragging = draggedItem?.type === 'collection' && draggedItem.id === collection.id;

        return (
          <div key={collection.id}>
            {/* Collection Item */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'collection', collection.id)}
              onDragOver={(e) => handleDragOver(e, 'collection', collection.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'collection', collection.id)}
              onClick={() => toggleCollection(collection.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded hover:bg-accent cursor-pointer group transition-colors ${
                isDraggedOver ? 'bg-primary/20 border border-primary' : ''
              } ${isDragging ? 'opacity-50' : ''}`}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="p-0.5">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>

              <div className={`w-2 h-2 rounded-full ${
                collection.is_favorite === 1 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></div>

              <span className="text-sm truncate flex-1">
                {collection.name}
              </span>

              {collection.is_favorite === 1 && (
                <Star className="h-3 w-3 text-yellow-500" />
              )}

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(collection.id);
                  }}
                >
                  {collection.is_favorite === 1 ? (
                    <StarOff className="h-3 w-3" />
                  ) : (
                    <Star className="h-3 w-3" />
                  )}
                </Button>
                
                <div className="relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleAddRequest(collection.id)}>
                        <Plus className="h-3 w-3 mr-2" />
                        Add Request
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddFolder(collection.id)}>
                        <Folder className="h-3 w-3 mr-2" />
                        Add Folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditCollection()}>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateCollection(collection)}>
                        <Copy className="h-3 w-3 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportCollection(collection)}>
                        <Download className="h-3 w-3 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleImportCollection()}>
                        <Upload className="h-3 w-3 mr-2" />
                        Import
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCollection(collection.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Collection Content */}
            {isExpanded && (
              <div className="ml-6 space-y-1">
                {/* Folders */}
                {collectionFolders.map((folder: any) => {
                  const folderRequests = getRequestsForFolder(folder.id);
                  const isFolderExpanded = expandedCollections.has(folder.id);
                  
                  return (
                    <div key={folder.id}>
                      {/* Folder Item */}
                      <div 
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
                        onDragOver={(e) => handleDragOver(e, 'folder', folder.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'folder', folder.id)}
                        onClick={() => toggleCollection(folder.id)}
                        className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer group transition-colors ${
                          dragOverItem?.type === 'folder' && dragOverItem.id === folder.id ? 'bg-primary/20 border border-primary' : ''
                        } ${draggedItem?.type === 'folder' && draggedItem.id === folder.id ? 'opacity-50' : ''}`}
                      >
                        <div className="p-0.5">
                          {isFolderExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </div>

                        <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

                        <Folder className="h-3 w-3 text-muted-foreground" />
                        
                        <span className="text-xs truncate flex-1">
                          {folder.name}
                        </span>
                        
                        <span className="text-xs text-muted-foreground">
                          {folderRequests.length}
                        </span>
                      </div>

                      {/* Folder Requests */}
                      {isFolderExpanded && (
                        <div className="ml-4 space-y-1">
                          {folderRequests.map((request: Request) => {
                            const isRequestDraggedOver = dragOverItem?.type === 'request' && dragOverItem.id === request.id;
                            const isRequestDragging = draggedItem?.type === 'request' && draggedItem.id === request.id;

                            return (
                              <div
                                key={request.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'request', request.id)}
                                onDragOver={(e) => handleDragOver(e, 'request', request.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, 'request', request.id)}
                                className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer group transition-colors ${
                                  isRequestDraggedOver ? 'bg-primary/20 border border-primary' : ''
                                } ${isRequestDragging ? 'opacity-50' : ''}`}
                                onClick={() => onRequestSelect?.(request)}
                              >
                                <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <Badge variant="outline" className="text-xs font-mono">
                                  {request.method}
                                </Badge>
                                
                                {editingRequestId === request.id ? (
                                  <Input
                                    value={tempRequestName}
                                    onChange={(e) => setTempRequestName(e.target.value)}
                                    onBlur={() => handleRequestNameSave(request)}
                                    onKeyDown={(e) => handleRequestNameKeyDown(e, request)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs h-6 flex-1"
                                    autoFocus
                                  />
                                ) : (
                                  <span 
                                    className="text-xs truncate flex-1 cursor-pointer px-1 py-0.5 rounded"
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      handleRequestNameDoubleClick(request);
                                    }}
                                    title="Double-click to edit name"
                                  >
                                    {request.name || request.url}
                                  </span>
                                )}
                                
                                {request.is_favorite === 1 && (
                                  <Star className="h-3 w-3 text-yellow-500" />
                                )}

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavoriteRequest(request.id);
                                    }}
                                  >
                                    {request.is_favorite === 1 ? (
                                      <StarOff className="h-3 w-3" />
                                    ) : (
                                      <Star className="h-3 w-3" />
                                    )}
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRequest(request.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Direct Collection Requests (not in folders) */}
                {collectionRequests.map((request: Request) => {
                  const isRequestDraggedOver = dragOverItem?.type === 'request' && dragOverItem.id === request.id;
                  const isRequestDragging = draggedItem?.type === 'request' && draggedItem.id === request.id;

                  return (
                    <div
                      key={request.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'request', request.id)}
                      onDragOver={(e) => handleDragOver(e, 'request', request.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'request', request.id)}
                      className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer group transition-colors ${
                        isRequestDraggedOver ? 'bg-primary/20 border border-primary' : ''
                      } ${isRequestDragging ? 'opacity-50' : ''}`}
                      onClick={() => onRequestSelect?.(request)}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <Badge variant="outline" className="text-xs font-mono">
                        {request.method}
                      </Badge>
                      
                      {editingRequestId === request.id ? (
                        <Input
                          value={tempRequestName}
                          onChange={(e) => setTempRequestName(e.target.value)}
                          onBlur={() => handleRequestNameSave(request)}
                          onKeyDown={(e) => handleRequestNameKeyDown(e, request)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs h-6 flex-1"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="text-xs truncate flex-1 cursor-pointer px-1 py-0.5 rounded"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleRequestNameDoubleClick(request);
                          }}
                          title="Double-click to edit name"
                        >
                          {request.name || request.url}
                        </span>
                      )}
                      
                      {request.is_favorite === 1 && (
                        <Star className="h-3 w-3 text-yellow-500" />
                      )}

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavoriteRequest(request.id);
                          }}
                        >
                          {request.is_favorite === 1 ? (
                            <StarOff className="h-3 w-3" />
                          ) : (
                            <Star className="h-3 w-3" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRequest(request.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {collectionRequests.length === 0 && collectionFolders.length === 0 && (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    No requests or folders in this collection
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {collections.length === 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          No collections yet
        </div>
      )}
      
      {/* Folder Creation Dialog */}
      <InputDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        title="Create Folder"
        description="Enter a name for the new folder"
        placeholder="Folder name"
        onConfirm={handleCreateFolder}
        confirmText="Create Folder"
      />
    </div>
  );
}
