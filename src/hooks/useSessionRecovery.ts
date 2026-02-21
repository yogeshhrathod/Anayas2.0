/**
 * useSessionRecovery - Hook for restoring unsaved requests on app startup
 *
 * Loads unsaved requests from database and optionally restores the last active one
 */

import { useEffect } from 'react';
import logger from '../lib/logger';
import { useStore } from '../store/useStore';

export function useSessionRecovery() {
  const {
    setUnsavedRequests,
    setSelectedRequest,
    activeUnsavedRequestId,
    setCurrentPage,
  } = useStore();

  useEffect(() => {
    const loadUnsavedRequests = async () => {
      try {
        const requests = await window.electronAPI.unsavedRequest.getAll();
        setUnsavedRequests(requests);

        // Auto-restore the last active unsaved request if it exists
        if (requests.length > 0 && activeUnsavedRequestId) {
          const activeRequest = requests.find(
            (r: any) => r.id === activeUnsavedRequestId
          );
          if (activeRequest) {
            setSelectedRequest({
              id: undefined,
              name: activeRequest.name,
              method: activeRequest.method as any,
              url: activeRequest.url,
              headers: activeRequest.headers,
              body: activeRequest.body,
              queryParams: activeRequest.queryParams,
              auth: activeRequest.auth,
              collectionId: undefined,
              folderId: undefined,
              isFavorite: 0,
              lastResponse: activeRequest.lastResponse,
            });
            setCurrentPage('home');
          }
        }
      } catch (error) {
        logger.error('Failed to load unsaved requests', { error });
      }
    };

    loadUnsavedRequests();
  }, []); // Only run on mount

  // Hook doesn't need to return anything, it just loads data on mount
}
