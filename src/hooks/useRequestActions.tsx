/**
 * useRequestActions - Custom hook for request actions (send, save, etc.)
 *
 * Provides actions for API request operations:
 * - Send request
 * - Save request
 * - Copy/download response
 * - Preset management
 *
 * @example
 * ```tsx
 * const {
 *   sendRequest,
 *   saveRequest,
 *   copyResponse,
 *   downloadResponse,
 *   isLoading,
 *   response
 * } = useRequestActions(requestData);
 * ```
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import logger from '../lib/logger';
import { getStatusText, safeStringifyBody } from '../lib/response-utils';
import { useStore } from '../store/useStore';
import { RequestPreset, ResponseData } from '../types/entities';
import { RequestFormData } from '../types/forms';
import { useToastNotifications } from './useToastNotifications';
import { useConfirmation } from './useConfirmation';

export interface RequestActionsState {
  response: ResponseData | null;
  isLoading: boolean;
  presets: RequestPreset[];
  showCreatePresetDialog: boolean;
  showSaveRequestDialog: boolean;
  newPresetName: string;
  newPresetDescription: string;
  isPresetsExpanded: boolean;
  activePresetId: string | null;
  activeTransactionId: string | null;
  startTime: number | null;
}

export interface RequestActionsActions {
  sendRequest: () => Promise<void>;
  cancelRequest: () => Promise<void>;
  saveRequest: () => Promise<void>;
  copyResponse: () => void;
  downloadResponse: () => void;
  createPreset: () => void;
  applyPreset: (
    preset: RequestPreset,
    onApply?: (data: RequestPreset['requestData']) => void
  ) => void;
  deletePreset: (presetId: string) => void;
  setShowCreatePresetDialog: (show: boolean) => void;
  setShowSaveRequestDialog: (show: boolean) => void;
  setNewPresetName: (name: string) => void;
  setNewPresetDescription: (description: string) => void;
  setIsPresetsExpanded: (expanded: boolean) => void;
  setActivePresetId: (id: string | null) => void;
}

export function useRequestActions(requestData: RequestFormData) {
  const triggerSidebarRefresh = useStore(state => state.triggerSidebarRefresh);
  const setSelectedRequest = useStore(state => state.setSelectedRequest);
  const selectedRequest = useStore(state => state.selectedRequest);
  const currentEnvironment = useStore(state => state.currentEnvironment);
  const activeUnsavedRequestId = useStore(state => state.activeUnsavedRequestId);
  const presetsExpanded = useStore(state => state.presetsExpanded);
  const setPresetsExpanded = useStore(state => state.setPresetsExpanded);
  const { showSuccess, showError } = useToastNotifications();
  const { confirm } = useConfirmation();

  const [state, setState] = useState<RequestActionsState>({
    response: selectedRequest?.lastResponse || null, // Load saved response
    isLoading: false,
    presets: [],
    showCreatePresetDialog: false,
    showSaveRequestDialog: false,
    newPresetName: '',
    newPresetDescription: '',
    isPresetsExpanded: presetsExpanded ?? false,
    activePresetId: null,
    activeTransactionId: null,
    startTime: null,
  });

  // Load saved response when request changes
  useEffect(() => {
    // Load the response from the selected request and clear loading state
    // so the user can switch requests without the new one seeming blocked.
    setState(prev => ({
      ...prev,
      response: selectedRequest?.lastResponse || null,
      isLoading: false,
      activeTransactionId: null,
      startTime: null,
    }));
  }, [selectedRequest?.id, selectedRequest?.lastResponse]);

  // Load presets from database when request changes
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const requestId = requestData.id;
        
        if (!requestId) {
          setState(prev => ({
            ...prev,
            presets: [],
            activePresetId: null,
          }));
          return;
        }

        const loadedPresets = await window.electronAPI.preset.list(requestId);
        setState(prev => {
          // Reset active preset if it doesn't belong to the current request
          const activePresetStillValid =
            prev.activePresetId &&
            loadedPresets.some(
              (p: RequestPreset) => p.id === prev.activePresetId
            );

          return {
            ...prev,
            presets: loadedPresets,
            activePresetId: activePresetStillValid ? prev.activePresetId : null,
          };
        });
      } catch (error) {
        logger.error('Failed to load presets', { error });
      }
    };
    loadPresets();
  }, [requestData.id]);

  const cancelRequest = useCallback(async () => {
    setState(prev => {
      if (prev.activeTransactionId) {
        window.electronAPI.request.cancel(prev.activeTransactionId).catch((err: any) => {
          logger.error('Cancel request failed', { error: err });
        });
      }
      return { ...prev, isLoading: false, activeTransactionId: null };
    });
  }, []);

  const sendRequest = useCallback(async () => {
    if (!requestData.url.trim()) {
      showError('Invalid URL', 'Please enter a valid URL');
      return;
    }

    const transactionId = Date.now().toString() + Math.random().toString(36).substring(7);
    const trackingId = String(requestData.id || activeUnsavedRequestId || 'new_request');
    
    const startTime = Date.now();
    useStore.getState().setLoadingRequest(trackingId, true);
    useStore.getState().setRequestStartTime(trackingId, startTime);
    setState(prev => ({ ...prev, isLoading: true, response: null, activeTransactionId: transactionId }));

    try {
      const result = await window.electronAPI.request.send({
        method: requestData.method,
        url: requestData.url,
        headers: requestData.headers,
        body: requestData.body,
        auth: requestData.auth,
        collectionId: selectedRequest?.collectionId,
        queryParams: requestData.queryParams,
        requestId: requestData.id || activeUnsavedRequestId || undefined, // Link to saved request for history
        environmentId: currentEnvironment?.id,
        transactionId,
      });

      // Convert response to ResponseData format
      const response: ResponseData = {
        status: result.status ?? 0,
        statusText: getStatusText(result.status, result.statusText),
        headers: result.headers ?? {},
        data: result.data ?? null,
        time: result.responseTime ?? 0,
        requestDetails: result.requestDetails,
      };

      setState(prev => ({ ...prev, response }));

      // Update the selected request in store so it's persisted by zustand/persist
      const setLastRequestStatus = useStore.getState().setLastRequestStatus;
      setLastRequestStatus(trackingId, response.status);

      if (selectedRequest) {
        setSelectedRequest({
          ...selectedRequest,
          lastResponse: response,
        });
      }

      // Show appropriate notification based on success/failure
      if (result.success) {
        showSuccess('Request completed', {
          description: `Status: ${response.status}`,
        });
      } else {
        showError('Request Failed', result.error || response.statusText);
      }

      // Save response with the request if it's a saved request
      if (requestData.id && requestData.collectionId) {
        try {
          await window.electronAPI.request.save({
            ...requestData,
            isFavorite: requestData.isFavorite ? 1 : 0,
            lastResponse: response,
          });
        } catch (error) {
          logger.error('Failed to save response with request', { error });
        }
      } else if (activeUnsavedRequestId) {
        // Save response for unsaved draft requests
        try {
          await window.electronAPI.unsavedRequest.save({
            id: activeUnsavedRequestId,
            name: requestData.name || 'Unsaved Request',
            method: requestData.method,
            url: requestData.url,
            headers: requestData.headers,
            body: requestData.body || '',
            queryParams: requestData.queryParams,
            auth: requestData.auth,
            lastResponse: response,
          });

          // Refresh unsaved requests list to ensure consistency
          const updatedUnsaved =
            await window.electronAPI.unsavedRequest.getAll();
          useStore.getState().setUnsavedRequests(updatedUnsaved);
        } catch (error) {
          logger.error('Failed to save response for unsaved request', { error });
        }
      }
    } catch (err: any) {
      // Fallback error handling if IPC call itself fails
      const errorResponse: ResponseData = {
        status: 0,
        statusText: err.message || 'Request Failed',
        headers: {},
        data: {
          error: err.message || 'An error occurred while sending the request',
        },
        time: 0,
      };
      setState(prev => ({ ...prev, response: errorResponse }));
      showError(
        'Request Failed',
        err.message || 'An error occurred while sending the request'
      );
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
      useStore.getState().setLoadingRequest(trackingId, false);
      useStore.getState().setRequestStartTime(trackingId, null);
    }
  }, [requestData, showSuccess, showError, selectedRequest, activeUnsavedRequestId, currentEnvironment]);

  const saveRequest = useCallback(async () => {
    if (!requestData.name.trim()) {
      showError('Validation failed', 'Request name is required');
      return;
    }

    try {
      const result = await window.electronAPI.request.save({
        id: requestData.id,
        name: requestData.name,
        method: requestData.method,
        url: requestData.url,
        headers: requestData.headers,
        body: requestData.body,
        queryParams: requestData.queryParams,
        auth: requestData.auth,
        collectionId: requestData.collectionId,
        folderId: requestData.folderId,
        isFavorite: requestData.isFavorite ? 1 : 0,
      });

      showSuccess('Request saved', {
        description: `${requestData.name} has been saved`,
      });

      // Trigger sidebar refresh
      triggerSidebarRefresh();

      // Update the selected request in store
      if (selectedRequest) {
        setSelectedRequest({
          ...selectedRequest,
          id: result.id,
          name: requestData.name,
          method: requestData.method,
          url: requestData.url,
          headers: requestData.headers,
          body: requestData.body,
          queryParams: requestData.queryParams,
          auth: requestData.auth,
          collectionId: requestData.collectionId,
          folderId: requestData.folderId,
          isFavorite: requestData.isFavorite ? 1 : 0,
        });
      }
    } catch (e: any) {
      logger.error('Failed to save request', { error: e });
      showError('Save failed', 'Failed to save request');
    }
  }, [
    requestData,
    showSuccess,
    showError,
    triggerSidebarRefresh,
    setSelectedRequest,
    selectedRequest,
  ]);

  const copyResponse = useCallback(() => {
    if (state.response) {
      const responseText = safeStringifyBody(state.response.data);
      if (responseText) {
        navigator.clipboard.writeText(responseText);
        showSuccess('Copied', {
          description: 'Response data copied to clipboard',
        });
      } else {
        showError('Copy Failed', 'No response data to copy');
      }
    }
  }, [state.response, showSuccess, showError]);

  const downloadResponse = useCallback(() => {
    if (state.response) {
      const responseText = safeStringifyBody(state.response.data);
      if (responseText) {
        const blob = new Blob([responseText], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `response-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSuccess('Downloaded', {
          description: 'Response data downloaded successfully',
        });
      } else {
        showError('Download Failed', 'No response data to download');
      }
    }
  }, [state.response, showSuccess, showError]);

  const createPreset = useCallback(async () => {
    // Presets can only be created for saved requests (requests with an ID)
    if (!requestData.id || typeof requestData.id !== 'number') {
      showError(
        'Request Not Saved',
        'Please save the request to a collection first before creating scenarios'
      );
      return;
    }

    // Generate a default name if none provided
    const presetName =
      state.newPresetName.trim() || `Preset ${state.presets.length + 1}`;

    // Capture current body data based on body type
    let capturedBody = '';
    if (requestData.body) {
      capturedBody = requestData.body;
    }

    const preset: RequestPreset = {
      id: Date.now().toString(),
      name: presetName,
      description: state.newPresetDescription.trim() || undefined,
      requestId: requestData.id, // Associate preset with current request
      requestData: {
        method: requestData.method,
        url: requestData.url,
        headers: { ...requestData.headers },
        body: capturedBody,
        queryParams: [...requestData.queryParams],
        auth: { ...requestData.auth },
      },
    };

    try {
      const result = await window.electronAPI.preset.save(preset);
      preset.id = result.id;

      setState(prev => ({
        ...prev,
        presets: [...prev.presets, preset],
        newPresetName: '',
        newPresetDescription: '',
        showCreatePresetDialog: false,
      }));

      // Toast removed: UI updates automatically
    } catch (error: any) {
      logger.error('Failed to save preset', { error });
      showError('Save Failed', 'Failed to save preset to database');
    }
  }, [
    state.newPresetName,
    state.newPresetDescription,
    state.presets.length,
    requestData,
    showSuccess,
    showError,
  ]);

  const applyPreset = useCallback(
    (
      preset: RequestPreset,
      onApply?: (data: RequestPreset['requestData']) => void
    ) => {
      setState(prev => ({ ...prev, activePresetId: preset.id }));
      if (onApply) {
        onApply(preset.requestData);
      }
      // Toast removed: UI updates automatically
    },
    []
  );

  const deletePreset = useCallback(
    async (presetId: string) => {
      const preset = state.presets.find(p => p.id === presetId);
      const isConfirmed = await confirm({
        title: 'Delete Preset',
        message: (
          <span>
            Are you sure you want to delete the preset <strong className="font-bold text-foreground underline decoration-destructive/30 underline-offset-4">"{preset?.name}"</strong>?
          </span>
        ),
        variant: 'destructive',
      });
      if (!isConfirmed) return;

      try {
        await window.electronAPI.preset.delete(presetId);
        setState(prev => ({
          ...prev,
          presets: prev.presets.filter(p => p.id !== presetId),
        }));
        // Toast removed: UI updates automatically
      } catch (error: any) {
        logger.error('Failed to delete preset', { error });
        showError('Delete Failed', 'Failed to delete preset from database');
      }
    },
    [confirm, state.presets, showSuccess, showError]
  );

  const actions: RequestActionsActions = useMemo(() => ({
    sendRequest,
    cancelRequest,
    saveRequest,
    copyResponse,
    downloadResponse,
    createPreset,
    applyPreset,
    deletePreset,
    setShowCreatePresetDialog: show =>
      setState(prev => ({ ...prev, showCreatePresetDialog: show })),
    setShowSaveRequestDialog: show =>
      setState(prev => ({ ...prev, showSaveRequestDialog: show })),
    setNewPresetName: name =>
      setState(prev => ({ ...prev, newPresetName: name })),
    setNewPresetDescription: description =>
      setState(prev => ({ ...prev, newPresetDescription: description })),
    setIsPresetsExpanded: expanded => {
      setPresetsExpanded(expanded);
      setState(prev => ({ ...prev, isPresetsExpanded: expanded }));
    },
    setActivePresetId: id =>
      setState(prev => ({ ...prev, activePresetId: id })),
  }), [
    sendRequest,
    cancelRequest,
    saveRequest,
    copyResponse,
    downloadResponse,
    createPreset,
    applyPreset,
    deletePreset,
    setPresetsExpanded,
  ]);

  const reqTrackingId = String(requestData.id || activeUnsavedRequestId || 'new_request');
  const globalIsLoadingFromStore = useStore(state => !!state.loadingRequests[reqTrackingId]);
  const globalStartTimeFromStore = useStore(state => state.requestStartTimes[reqTrackingId] || null);
  
  const globalIsLoading = globalIsLoadingFromStore || state.isLoading;
  const globalStartTime = globalStartTimeFromStore || state.startTime;

  return {
    ...state,
    ...actions,
    isLoading: globalIsLoading,
    startTime: globalStartTime,
  };
}
