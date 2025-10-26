/**
 * useCollectionOperations - Custom hook for collection CRUD operations
 * 
 * Features:
 * - Create, update, delete collections
 * - Import/export functionality
 * - Search and filtering
 * - Request count calculation
 * 
 * @example
 * ```tsx
 * const {
 *   collections,
 *   isLoading,
 *   createCollection,
 *   updateCollection,
 *   deleteCollection,
 *   searchCollections
 * } = useCollectionOperations();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { Collection } from '../types/entities';
import { CollectionFormData } from '../types/forms';
import { useToastNotifications } from './useToastNotifications';
import { useDebounce } from './useDebounce';

export function useCollectionOperations() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { showSuccess, showError } = useToastNotifications();

  // Load collections and requests
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [collectionsData, requestsData] = await Promise.all([
        window.electronAPI.collection.list(),
        window.electronAPI.request.list()
      ]);
      
      setCollections(collectionsData);
      setRequests(requestsData);
    } catch (error: any) {
      showError('Failed to load data', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Calculate request counts for each collection
  const getRequestCounts = useCallback(() => {
    const counts: Record<number, number> = {};
    
    requests.forEach(request => {
      if (request.collectionId) {
        counts[request.collectionId] = (counts[request.collectionId] || 0) + 1;
      }
    });
    
    return counts;
  }, [requests]);

  // Search and filter collections
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredCollections(collections);
      return;
    }

    const filtered = collections.filter(collection =>
      collection.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      collection.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    
    setFilteredCollections(filtered);
  }, [collections, debouncedSearchTerm]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Collection CRUD operations
  const createCollection = useCallback(async (data: CollectionFormData) => {
    try {
      const result = await window.electronAPI.collection.save({
        name: data.name,
        description: data.description,
        variables: data.variables,
        is_favorite: data.is_favorite
      });

      if (result.success) {
        await loadData();
        showSuccess('Collection created', { description: `${data.name} has been created successfully` });
        return result;
      }
    } catch (error: any) {
      showError('Failed to create collection', error.message);
      throw error;
    }
  }, [loadData, showSuccess, showError]);

  const updateCollection = useCallback(async (id: number, data: CollectionFormData) => {
    try {
      const result = await window.electronAPI.collection.save({
        id,
        name: data.name,
        description: data.description,
        variables: data.variables,
        is_favorite: data.is_favorite
      });

      if (result.success) {
        await loadData();
        showSuccess('Collection updated', { description: `${data.name} has been updated successfully` });
        return result;
      }
    } catch (error: any) {
      showError('Failed to update collection', error.message);
      throw error;
    }
  }, [loadData, showSuccess, showError]);

  const deleteCollection = useCallback(async (id: number) => {
    try {
      await window.electronAPI.collection.delete(id);
      await loadData();
      showSuccess('Collection deleted', { description: 'Collection has been deleted successfully' });
    } catch (error: any) {
      showError('Failed to delete collection', error.message);
      throw error;
    }
  }, [loadData, showSuccess, showError]);

  const duplicateCollection = useCallback(async (collection: Collection) => {
    try {
      const duplicatedData = {
        name: `${collection.name} (Copy)`,
        description: collection.description,
        variables: collection.variables,
        is_favorite: false
      };

      await createCollection(duplicatedData);
    } catch (error: any) {
      showError('Failed to duplicate collection', error.message);
      throw error;
    }
  }, [createCollection, showError]);

  const toggleFavorite = useCallback(async (collection: Collection) => {
    try {
      await updateCollection(collection.id!, {
        name: collection.name,
        description: collection.description,
        variables: collection.variables,
        is_favorite: !collection.is_favorite
      });
    } catch (error: any) {
      showError('Failed to update collection', error.message);
      throw error;
    }
  }, [updateCollection, showError]);

  // Import/Export operations
  const exportCollections = useCallback(async () => {
    try {
      const dataStr = JSON.stringify(collections, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `collections-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess('Export successful', { description: 'Collections have been exported successfully' });
    } catch (error: any) {
      showError('Failed to export collections', error.message);
    }
  }, [collections, showSuccess, showError]);

  const importCollections = useCallback(async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const text = await file.text();
        const importedCollections = JSON.parse(text);
        
        if (Array.isArray(importedCollections)) {
          for (const collection of importedCollections) {
            await createCollection({
              name: collection.name,
              description: collection.description,
              variables: collection.variables,
              is_favorite: false
            });
          }
          showSuccess('Import successful', { description: `${importedCollections.length} collections imported successfully` });
        } else {
          showError('Invalid file format', 'Please select a valid collections export file');
        }
      };
      
      input.click();
    } catch (error: any) {
      showError('Failed to import collections', error.message);
    }
  }, [createCollection, showSuccess, showError]);

  return {
    collections: filteredCollections,
    allCollections: collections,
    requests,
    isLoading,
    searchTerm,
    setSearchTerm,
    requestCounts: getRequestCounts(),
    createCollection,
    updateCollection,
    deleteCollection,
    duplicateCollection,
    toggleFavorite,
    exportCollections,
    importCollections,
    refreshData: loadData
  };
}
