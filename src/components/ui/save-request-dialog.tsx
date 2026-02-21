import { AlertCircle, FolderPlus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import logger from '../../lib/logger';
import { Button } from './button';
import { Dialog } from './dialog';
import { Input } from './input';
import { Label } from './label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './select';
import { useToast } from './use-toast';

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

interface SaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    collectionId: number;
    folderId?: number;
  }) => void;
  currentRequestName?: string;
  currentCollectionId?: number;
  currentFolderId?: number;
}

interface ValidationErrors {
  name?: string;
  collection?: string;
}

export function SaveRequestDialog({
  open,
  onOpenChange,
  onSave,
  currentRequestName = '',
  currentCollectionId,
  currentFolderId,
}: SaveRequestDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [requestName, setRequestName] = useState(currentRequestName);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(currentCollectionId || null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    currentFolderId || null
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const { error } = useToast();

  // Load collections and folders when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
      setRequestName(currentRequestName);
      setSelectedCollectionId(currentCollectionId || null);
      setSelectedFolderId(currentFolderId || null);
      setValidationErrors({});
    }
  }, [open, currentRequestName, currentCollectionId, currentFolderId]);

  const loadData = async () => {
    try {
      const [collectionsData, foldersData] = await Promise.all([
        window.electronAPI.collection.list(),
        window.electronAPI.folder.list(),
      ]);
      setCollections(collectionsData);
      setFolders(foldersData);
    } catch (e: any) {
      logger.error('Failed to load collections and folders', { error: e.message });
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
    if (!validateForm()) {
      error(
        'Validation failed',
        'Please fix all validation errors before saving'
      );
      return;
    }

    setIsLoading(true);
    try {
      onSave({
        name: requestName.trim(),
        collectionId: selectedCollectionId!,
        folderId: selectedFolderId || undefined,
      });
      onOpenChange(false);
    } catch (e: any) {
      logger.error('Failed to save request', { error: e.message });
      error('Save failed', 'Failed to save request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = () => {
    // Navigate to collections page to create new collection
    onOpenChange(false);
    // This would need to be handled by the parent component
    // For now, we'll just close the dialog
  };

  const getFoldersForCollection = (collectionId: number) => {
    return folders.filter(folder => folder.collectionId === collectionId);
  };

  const handleCollectionChange = (collectionId: string) => {
    const id = parseInt(collectionId);
    setSelectedCollectionId(id);
    setSelectedFolderId(null); // Reset folder selection when collection changes

    // Clear collection validation error
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
    // Clear name validation error when user starts typing
    if (validationErrors.name) {
      setValidationErrors({ ...validationErrors, name: undefined });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <FolderPlus className="h-5 w-5" />
          Save Request
        </span>
      }
      description="Choose a name and collection for your request"
      maxWidth="sm"
      className="max-h-[80vh]"
    >
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {/* Request Name */}
        <div className="space-y-2">
          <Label htmlFor="request-name">Request Name</Label>
          <Input
            id="request-name"
            value={requestName}
            onChange={e => handleNameChange(e.target.value)}
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

        {/* Collection Selection */}
        <div className="space-y-2">
          <Label htmlFor="collection-select">Collection</Label>
          <Select
            value={selectedCollectionId?.toString() || ''}
            onValueChange={handleCollectionChange}
          >
            <SelectTrigger
              className={validationErrors.collection ? 'border-red-500' : ''}
            >
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {collections.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No collections available
                </div>
              ) : (
                collections.map(collection => (
                  <SelectItem
                    key={collection.id}
                    value={collection.id.toString()}
                  >
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
          {collections.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No collections available.
              <Button
                variant="link"
                size="sm"
                onClick={handleCreateCollection}
                className="h-auto p-0 ml-1"
              >
                Create one first
              </Button>
            </div>
          )}
        </div>

        {/* Folder Selection (Optional) */}
        {selectedCollectionId &&
          getFoldersForCollection(selectedCollectionId).length > 0 && (
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
                  {getFoldersForCollection(selectedCollectionId).map(folder => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        {/* Action Buttons */}
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
                <Plus className="h-4 w-4 mr-2" />
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
