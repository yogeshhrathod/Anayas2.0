import { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Dialog } from './dialog';
import { AlertCircle, Save } from 'lucide-react';
import { useToast } from './use-toast';
import { useStore, UnsavedRequest } from '../../store/useStore';
import { Request } from '../../types/entities';

interface Collection {
  id: number;
  name: string;
  description?: string;
  variables: Record<string, string>;
  isFavorite: number;
}

interface Folder {
  id: number;
  name: string;
  description?: string;
  collectionId: number;
}

interface PromoteRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unsavedRequest: UnsavedRequest | null;
}

interface ValidationErrors {
  name?: string;
  collection?: string;
}

export function PromoteRequestDialog({
  open,
  onOpenChange,
  unsavedRequest,
}: PromoteRequestDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [requestName, setRequestName] = useState(unsavedRequest?.name || '');
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { error, success } = useToast();
  const { triggerSidebarRefresh, setActiveUnsavedRequestId } = useStore();

  // Load collections and folders when dialog opens
  useEffect(() => {
    if (open && unsavedRequest) {
      loadData();
      setRequestName(unsavedRequest.name);
      setSelectedCollectionId(null);
      setSelectedFolderId(null);
      setValidationErrors({});
    }
  }, [open, unsavedRequest]);

  const loadData = async () => {
    try {
      const [collectionsData, foldersData] = await Promise.all([
        window.electronAPI.collection.list(),
        window.electronAPI.folder.list()
      ]);
      setCollections(collectionsData);
      setFolders(foldersData);
    } catch (e: unknown) {
      console.error('Failed to load collections and folders:', e);
      error('Load failed', 'Failed to load collections and folders');
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!requestName.trim()) {
      errors.name = 'Request name is required';
    } else if (requestName.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (requestName.length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    if (!selectedCollectionId) {
      errors.collection = 'Please select a collection';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!unsavedRequest) return;
    
    if (!validateForm()) {
      error('Validation failed', 'Please fix all validation errors before saving');
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.unsavedRequest.promote(unsavedRequest.id, {
        name: requestName.trim(),
        collectionId: selectedCollectionId,
        folderId: selectedFolderId || undefined,
        isFavorite: false,
      });
      
      if (result.success) {
        success('Request saved');
        
        // Load the newly saved request and set it as selected
        const savedRequest: Request = {
          id: result.id,
          name: requestName.trim(),
          method: unsavedRequest.method as Request['method'],
          url: unsavedRequest.url,
          headers: unsavedRequest.headers,
          body: unsavedRequest.body,
          queryParams: unsavedRequest.queryParams,
          auth: unsavedRequest.auth as Request['auth'],
          collectionId: selectedCollectionId,
          folderId: selectedFolderId ?? undefined,
          isFavorite: 0,
        };
        
        // Clear active unsaved request and set the saved request as selected
        setActiveUnsavedRequestId(null);
        const { setSelectedRequest, setCurrentPage, setUnsavedRequests } = useStore.getState();
        setSelectedRequest(savedRequest);
        setCurrentPage('home');
        
        // Reload unsaved requests to reflect the removal
        const updatedUnsaved = await window.electronAPI.unsavedRequest.getAll();
        setUnsavedRequests(updatedUnsaved);
        
        // Trigger sidebar refresh
        triggerSidebarRefresh();
        
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Failed to save request');
      }
    } catch (e: unknown) {
      console.error('Failed to promote unsaved request:', e);
      error('Save failed', e instanceof Error ? e.message : 'Failed to save request');
    } finally {
      setIsLoading(false);
    }
  };

  const getFoldersForCollection = (collectionId: number) => {
    return folders.filter(folder => folder.collectionId === collectionId);
  };

  const handleCollectionChange = (collectionId: string) => {
    const id = parseInt(collectionId);
    setSelectedCollectionId(id);
    setSelectedFolderId(null);
    
    if (validationErrors.collection) {
      setValidationErrors({ ...validationErrors, collection: undefined });
    }
  };

  const handleFolderChange = (folderId: string) => {
    const id = folderId === 'none' ? null : parseInt(folderId);
    setSelectedFolderId(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleNameChange = (value: string) => {
    setRequestName(value);
    if (validationErrors.name) {
      setValidationErrors({ ...validationErrors, name: undefined });
    }
  };

  if (!open || !unsavedRequest) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Save Request
        </span>
      }
      description="Convert this unsaved request to a saved request in a collection"
      maxWidth="sm"
      className="max-h-[80vh]"
    >
      <div className="space-y-4" onKeyDown={handleKeyDown}>
          <div className="space-y-2">
            <Label htmlFor="request-name">Request Name</Label>
            <Input
              id="request-name"
              value={requestName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter request name"
              className={validationErrors.name ? 'border-red-500' : ''}
              autoFocus
            />
            {validationErrors.name && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                <span>{validationErrors.name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-select">Collection</Label>
            <Select
              value={selectedCollectionId?.toString() || ''}
              onValueChange={handleCollectionChange}
            >
              <SelectTrigger className={validationErrors.collection ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No collections available</div>
                ) : (
                  collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{collection.name}</span>
                        {collection.isFavorite === 1 && (
                          <span className="text-yellow-500">★</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {validationErrors.collection && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                <span>{validationErrors.collection}</span>
              </div>
            )}
          </div>

          {selectedCollectionId && getFoldersForCollection(selectedCollectionId).length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="folder-select">Folder (Optional)</Label>
              <Select
                value={selectedFolderId?.toString() || 'none'}
                onValueChange={handleFolderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {getFoldersForCollection(selectedCollectionId).map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !requestName.trim() || !selectedCollectionId}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Request
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
      </div>
    </Dialog>
  );
}

