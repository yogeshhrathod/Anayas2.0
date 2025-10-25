import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { InputDialog } from '../components/ui/input-dialog';
import { 
  FolderPlus, 
  Plus, 
  Trash2, 
  Star, 
  StarOff, 
  Edit, 
  FolderOpen,
  AlertCircle,
  MoreVertical,
  Copy,
  Download,
  Upload,
  Folder
} from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { EnvironmentVariable } from '../components/EnvironmentVariable';
import { useStore } from '../store/useStore';

interface Collection {
  id?: number;
  name: string;
  description: string;
  variables: Record<string, string>;
  isFavorite: boolean;
  createdAt?: string;
  lastUsed?: string;
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

export function Collections() {
  const { success, error } = useToast();
  const { setCurrentPage, setSelectedRequest, setSelectedCollectionForNewRequest } = useStore();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderCollectionId, setFolderCollectionId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Collection>({
    name: '',
    description: '',
    variables: {},
    isFavorite: false,
  });

  const loadCollections = async () => {
    try {
      const collectionsData = await window.electronAPI.collection.list();
      setCollections(collectionsData);
    } catch (e: any) {
      console.error('Failed to load collections:', e);
      error('Load failed', 'Failed to load collections');
    }
  };

  const loadRequests = async () => {
    try {
      const requestsData = await window.electronAPI.request.list();
      setRequests(requestsData);
    } catch (e: any) {
      console.error('Failed to load requests:', e);
    }
  };

  useEffect(() => {
    loadCollections();
    loadRequests();
  }, []);

  const handleNew = () => {
    setEditingCollection(null);
    setFormData({
      name: '',
      description: '',
      variables: {},
      isFavorite: false,
    });
    setIsEditing(true);
    setValidationErrors({});
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description,
      variables: collection.variables || {},
      isFavorite: collection.isFavorite,
    });
    setIsEditing(true);
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Collection name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z0-9\s_-]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      error('Validation failed', 'Please fix all validation errors before saving');
      return;
    }

    try {
      const result = await window.electronAPI.collection.save(formData);
      
      if (result.success) {
        await loadCollections();
        setIsEditing(false);
        setValidationErrors({});
        success('Collection saved', `${formData.name} saved successfully`);
      }
    } catch (e: any) {
      console.error('Failed to save collection:', e);
      error('Save failed', 'Failed to save collection');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this collection? This will also delete all requests in this collection.')) return;

    try {
      await window.electronAPI.collection.delete(id);
      await loadCollections();
      await loadRequests();
      success('Collection deleted', 'The collection has been removed');
    } catch (e: any) {
      console.error('Failed to delete collection:', e);
      error('Delete failed', 'Could not delete collection');
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await window.electronAPI.collection.toggleFavorite(id);
      await loadCollections();
    } catch (e: any) {
      console.error('Failed to toggle favorite:', e);
      error('Update failed', 'Could not update collection');
    }
  };

  const getRequestsForCollection = (collectionId: number) => {
    return requests.filter(req => req.collection_id === collectionId);
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
        await loadCollections();
        success('Folder created', `Folder "${folderName}" has been created`);
      }
    } catch (e: any) {
      console.error('Failed to create folder:', e);
      error('Create failed', 'Could not create folder');
    }

    setShowFolderDialog(false);
    setFolderCollectionId(null);
  };

  const handleDuplicateCollection = async (collection: Collection) => {
    try {
      const duplicatedCollection = {
        ...collection,
        name: `${collection.name} (Copy)`,
        id: undefined, // Remove ID to create new collection
      };
      
      const result = await window.electronAPI.collection.save(duplicatedCollection);
      
      if (result.success) {
        await loadCollections();
        success('Collection duplicated', `${duplicatedCollection.name} has been created`);
      }
    } catch (e: any) {
      console.error('Failed to duplicate collection:', e);
      error('Duplicate failed', 'Could not duplicate collection');
    }
  };

  const handleExportCollection = async (collection: Collection) => {
    try {
      const collectionRequests = getRequestsForCollection(collection.id!);
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
          headers: typeof req.headers === 'string' 
            ? JSON.parse(req.headers) 
            : (req.headers || {}),
          body: req.body,
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

          await loadCollections();
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

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {editingCollection ? 'Edit Collection' : 'New Collection'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Organize your API requests into collections
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Collection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: undefined });
                    }
                  }}
                  placeholder="My API Collection"
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{validationErrors.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (validationErrors.description) {
                      setValidationErrors({ ...validationErrors, description: undefined });
                    }
                  }}
                  placeholder="Describe what this collection contains..."
                  rows={3}
                  className={validationErrors.description ? 'border-red-500' : ''}
                />
                {validationErrors.description && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{validationErrors.description}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <input
                  type="checkbox"
                  id="isFavorite"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isFavorite" className="cursor-pointer">
                  Mark as favorite collection
                </Label>
              </div>
            </div>

            {/* Collection Variables */}
            <EnvironmentVariable
              variables={formData.variables}
              onVariablesChange={(variables) => setFormData({ ...formData, variables })}
              title="Collection Variables"
              description="Add variables that are specific to this collection"
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Collection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="mt-2 text-muted-foreground">
              Organize your API requests into collections
            </p>
          </div>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderPlus className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No collections yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first collection to organize your API requests
            </p>
            <Button className="mt-4" onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection: any) => {
            const collectionRequests = getRequestsForCollection(collection.id);
            return (
              <Card key={collection.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        {collection.name}
                        {collection.is_favorite === 1 && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {collection.description || 'No description'}
                      </CardDescription>
                    </div>
                    
                    {/* Options Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleAddRequest(collection.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Request
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddFolder(collection.id)}>
                          <Folder className="h-4 w-4 mr-2" />
                          Add Folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(collection)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Collection
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateCollection(collection)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExportCollection(collection)}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleImportCollection()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Import
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(collection.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Requests: {collectionRequests.length}</div>
                    <div>Variables: {Object.keys(collection.variables || {}).length}</div>
                    {collection.last_used && (
                      <div>Last used: {new Date(collection.last_used).toLocaleDateString()}</div>
                    )}
                  </div>
                  
                  {/* Show sample requests */}
                  {collectionRequests.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Recent Requests:</div>
                      {collectionRequests.slice(0, 3).map((req: any) => (
                        <div key={req.id} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {req.method}
                          </Badge>
                          <span className="truncate">{req.name || req.url}</span>
                        </div>
                      ))}
                      {collectionRequests.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{collectionRequests.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddRequest(collection.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Request
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFavorite(collection.id)}
                    >
                      {collection.is_favorite === 1 ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
