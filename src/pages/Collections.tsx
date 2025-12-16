/**
 * Collections - Refactored Collections page using smaller components
 * 
 * Features:
 * - Collection management (CRUD operations)
 * - Search and filtering
 * - Import/Export functionality
 * - Responsive grid layout
 * 
 * @example
 * ```tsx
 * <Collections />
 * ```
 */

import { useState, useRef } from 'react';
import { PageLayout } from '../components/shared/PageLayout';
import { CollectionForm } from '../components/collection/CollectionForm';
import { CollectionGrid } from '../components/collection/CollectionGrid';
import { CollectionActions } from '../components/collection/CollectionActions';
import { CollectionRunner } from '../components/collection/CollectionRunner';
import { CurlImportDialog } from '../components/curl/CurlImportDialog';
import { ImportCollectionDialog } from '../components/import';
import { useCollectionOperations } from '../hooks/useCollectionOperations';
import { useConfirmation } from '../hooks/useConfirmation';
import { useStore } from '../store/useStore';
import { Collection, Request } from '../types/entities';
import { CollectionFormData } from '../types/forms';
import { Button } from '../components/ui/button';
import { useToastNotifications } from '../hooks/useToastNotifications';

export function Collections() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [runningCollection, setRunningCollection] = useState<Collection | null>(null);
  const [showCurlImport, setShowCurlImport] = useState(false);
  const [showPostmanImport, setShowPostmanImport] = useState(false);
  const formRef = useRef<React.ElementRef<typeof CollectionForm>>(null);

  const { setCurrentPage, setSelectedRequest, triggerSidebarRefresh } = useStore();
  const { showSuccess, showError } = useToastNotifications();

  const {
    collections,
    isLoading,
    searchTerm,
    setSearchTerm,
    requestCounts,
    createCollection,
    updateCollection,
    deleteCollection,
    duplicateCollection,
    toggleFavorite,
    exportCollections
  } = useCollectionOperations();

  const { confirm } = useConfirmation();

  const handleNewCollection = () => {
    setEditingCollection(null);
    setIsEditing(true);
  };

  const handleNewRequest = () => {
    // Create a new empty request and set it as selected
    const newRequest = {
      name: '',
      method: 'GET' as const,
      url: '',
      headers: { 'Content-Type': 'application/json' },
      body: '',
      queryParams: [],
      auth: { type: 'none' as const },
      collectionId: undefined,
      folderId: undefined,
      isFavorite: 0,
    };
    
    setSelectedRequest(newRequest);
    setCurrentPage('home');
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setIsEditing(true);
  };

  const handleSaveCollection = async (data: CollectionFormData) => {
    try {
      setIsSaving(true);
      
      if (editingCollection?.id) {
        await updateCollection(editingCollection.id, data);
      } else {
        await createCollection(data);
      }
      
      setIsEditing(false);
      setEditingCollection(null);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingCollection(null);
  };

  const handleDeleteCollection = async (collection: Collection) => {
    const confirmed = await confirm({
      title: 'Delete Collection',
      message: `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`
    });

    if (confirmed) {
      await deleteCollection(collection.id!);
    }
  };

  const handleDuplicateCollection = async (collection: Collection) => {
    await duplicateCollection(collection);
  };

  const handleToggleFavorite = async (collection: Collection) => {
    await toggleFavorite(collection);
  };

  const handleRunCollection = (collection: Collection) => {
    setRunningCollection(collection);
  };

  const handleCloseRunner = () => {
    setRunningCollection(null);
  };

  const handleExport = () => {
    exportCollections();
  };

  const handleImport = () => {
    setShowPostmanImport(true);
  };

  const handleCurlImport = () => {
    setShowCurlImport(true);
  };

  const handleCurlImportComplete = async (
    requests: Request[],
    collectionId?: number,
    folderId?: number
  ) => {
    try {
      // Save each request
      if (!collectionId) {
        showError('Collection required', 'Please select a collection to import requests');
        return;
      }
      
      for (const request of requests) {
        await window.electronAPI.request.save({
          ...request,
          collectionId,
          folderId,
          isFavorite: request.isFavorite || 0,
        });
      }
      
      triggerSidebarRefresh();
      showSuccess('Import successful', {
        description: `Imported ${requests.length} request(s)`,
      });
    } catch (error: any) {
      console.error('Failed to import requests:', error);
      showError('Import failed', error.message || 'Failed to import requests');
      throw error;
    }
  };

  if (isEditing) {
    return (
      <PageLayout
        title={editingCollection ? 'Edit Collection' : 'New Collection'}
        description={editingCollection ? 'Update collection details and variables' : 'Create a new collection with variables'}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => formRef.current?.submit()} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        }
      >
        <CollectionForm
          ref={formRef}
          collection={editingCollection}
          onSave={handleSaveCollection}
          onCancel={handleCancelEdit}
          onCollectionUpdate={(updatedCollection) => {
            setEditingCollection(updatedCollection);
          }}
          isLoading={isSaving}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Collections"
      description="Organize your API requests into collections with shared environment variables"
    >
      <div className="space-y-6">
        <CollectionActions
          onImport={handleImport}
          onExport={handleExport}
          onCurlImport={handleCurlImport}
          onSearch={setSearchTerm}
          searchValue={searchTerm}
          onNewCollection={handleNewCollection}
          onNewRequest={handleNewRequest}
        />

        <CollectionGrid
          collections={collections}
          requestCounts={requestCounts}
          isLoading={isLoading}
          onEdit={handleEditCollection}
          onDelete={handleDeleteCollection}
          onDuplicate={handleDuplicateCollection}
          onToggleFavorite={handleToggleFavorite}
          onExport={handleExport}
          onRun={handleRunCollection}
        />
      </div>

      {runningCollection && (
        <CollectionRunner
          collectionId={runningCollection.id!}
          collectionName={runningCollection.name}
          onClose={handleCloseRunner}
          open={!!runningCollection}
        />
      )}

      <CurlImportDialog
        open={showCurlImport}
        onOpenChange={setShowCurlImport}
        onImport={handleCurlImportComplete}
      />

      <ImportCollectionDialog
        open={showPostmanImport}
        onOpenChange={setShowPostmanImport}
        onSuccess={async () => {
          // Refresh collections after import
          triggerSidebarRefresh();
          showSuccess('Collection imported', {
            description: 'Postman collection imported successfully',
          });
        }}
      />
    </PageLayout>
  );
}