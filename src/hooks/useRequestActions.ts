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

import { useState, useCallback, useEffect } from 'react';
import { RequestFormData } from '../types/forms';
import { RequestPreset, ResponseData } from '../types/entities';
import { useToastNotifications } from './useToastNotifications';
import { useStore } from '../store/useStore';

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
}

export interface RequestActionsActions {
  sendRequest: () => Promise<void>;
  saveRequest: () => Promise<void>;
  copyResponse: () => void;
  downloadResponse: () => void;
  createPreset: () => void;
  applyPreset: (preset: RequestPreset, onApply?: (data: RequestPreset['requestData']) => void) => void;
  deletePreset: (presetId: string) => void;
  setShowCreatePresetDialog: (show: boolean) => void;
  setShowSaveRequestDialog: (show: boolean) => void;
  setNewPresetName: (name: string) => void;
  setNewPresetDescription: (description: string) => void;
  setIsPresetsExpanded: (expanded: boolean) => void;
  setActivePresetId: (id: string | null) => void;
}

export function useRequestActions(requestData: RequestFormData) {
  const { triggerSidebarRefresh, setSelectedRequest, selectedRequest, currentEnvironment } = useStore();
  const { showSuccess, showError } = useToastNotifications();

  const { presetsExpanded, setPresetsExpanded } = useStore();

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
  });

  // Load saved response when request changes
  useEffect(() => {
    // Load the response from the selected request
    setState(prev => ({ ...prev, response: selectedRequest?.lastResponse || null }));
  }, [selectedRequest?.id, selectedRequest?.lastResponse]);

  // Load presets from database when request changes
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const requestId = requestData.id;
        const loadedPresets = await window.electronAPI.preset.list(requestId);
        setState(prev => {
          // Reset active preset if it doesn't belong to the current request
          const activePresetStillValid = prev.activePresetId && 
            loadedPresets.some(p => p.id === prev.activePresetId);
          
          return {
            ...prev,
            presets: loadedPresets,
            activePresetId: activePresetStillValid ? prev.activePresetId : null,
          };
        });
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    };
    loadPresets();
  }, [requestData.id]);

  const sendRequest = useCallback(async () => {
    if (!requestData.url.trim()) {
      showError('Invalid URL', 'Please enter a valid URL');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, response: null }));

    try {
      const response = await window.electronAPI.request.send({
        method: requestData.method,
        url: requestData.url,
        headers: requestData.headers,
        body: requestData.body,
        auth: requestData.auth,
        collectionId: selectedRequest?.collectionId,
        environmentId: currentEnvironment?.id
      });

      setState(prev => ({ ...prev, response }));
      showSuccess('Request completed', { description: `Status: ${response.status}` });
      
      // Save response with the request if it's a saved request
      if (requestData.id && requestData.collectionId) {
        try {
          await window.electronAPI.request.save({
            ...requestData,
            lastResponse: response,
          });
        } catch (error) {
          console.error('Failed to save response with request:', error);
        }
      }
    } catch (err: any) {
      showError('Request Failed', err.message || 'An error occurred while sending the request');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [requestData, showSuccess, showError, selectedRequest]);

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
        isFavorite: requestData.isFavorite,
      });
      
      showSuccess('Request saved', { description: `${requestData.name} has been saved` });
      
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
      console.error('Failed to save request:', e);
      showError('Save failed', 'Failed to save request');
    }
  }, [requestData, showSuccess, showError, triggerSidebarRefresh, setSelectedRequest, selectedRequest]);

  const copyResponse = useCallback(() => {
    if (state.response) {
      navigator.clipboard.writeText(JSON.stringify(state.response.data, null, 2));
      showSuccess('Copied', { description: 'Response data copied to clipboard' });
    }
  }, [state.response, showSuccess]);

  const downloadResponse = useCallback(() => {
    if (state.response) {
      const blob = new Blob([JSON.stringify(state.response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Downloaded', { description: 'Response data downloaded successfully' });
    }
  }, [state.response, showSuccess]);

  const createPreset = useCallback(async () => {
    // Presets can only be created for saved requests (requests with an ID)
    if (!requestData.id) {
      showError('Request Not Saved', 'Please save the request first before creating presets');
      return;
    }

    // Generate a default name if none provided
    const presetName = state.newPresetName.trim() || `Preset ${state.presets.length + 1}`;
    
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
        auth: { ...requestData.auth }
      }
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
      
      showSuccess('Preset Created', { description: `"${preset.name}" has been saved successfully` });
    } catch (error: any) {
      console.error('Failed to save preset:', error);
      showError('Save Failed', 'Failed to save preset to database');
    }
  }, [state.newPresetName, state.newPresetDescription, state.presets.length, requestData, showSuccess, showError]);

  const applyPreset = useCallback((preset: RequestPreset, onApply?: (data: RequestPreset['requestData']) => void) => {
    setState(prev => ({ ...prev, activePresetId: preset.id }));
    if (onApply) {
      onApply(preset.requestData);
    }
    showSuccess('Preset Applied', { description: `"${preset.name}" configuration has been applied` });
  }, [showSuccess]);

  const deletePreset = useCallback(async (presetId: string) => {
    try {
      await window.electronAPI.preset.delete(presetId);
      setState(prev => ({
        ...prev,
        presets: prev.presets.filter(p => p.id !== presetId),
      }));
      showSuccess('Preset Deleted', { description: 'Preset has been removed successfully' });
    } catch (error: any) {
      console.error('Failed to delete preset:', error);
      showError('Delete Failed', 'Failed to delete preset from database');
    }
  }, [showSuccess, showError]);

  const actions: RequestActionsActions = {
    sendRequest,
    saveRequest,
    copyResponse,
    downloadResponse,
    createPreset,
    applyPreset,
    deletePreset,
    setShowCreatePresetDialog: (show) => setState(prev => ({ ...prev, showCreatePresetDialog: show })),
    setShowSaveRequestDialog: (show) => setState(prev => ({ ...prev, showSaveRequestDialog: show })),
    setNewPresetName: (name) => setState(prev => ({ ...prev, newPresetName: name })),
    setNewPresetDescription: (description) => setState(prev => ({ ...prev, newPresetDescription: description })),
    setIsPresetsExpanded: (expanded) => {
      setPresetsExpanded(expanded);
      setState(prev => ({ ...prev, isPresetsExpanded: expanded }));
    },
    setActivePresetId: (id) => setState(prev => ({ ...prev, activePresetId: id })),
  };

  return {
    ...state,
    ...actions,
  };
}
