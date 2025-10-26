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

import { useState, useCallback } from 'react';
import { RequestFormData } from '../types/forms';
import { RequestPreset, ResponseData } from '../types/entities';
import { useToastNotifications } from './useToastNotifications';
import { useStore } from '../store/useStore';

export interface RequestActionsState {
  response: ResponseData | null;
  isLoading: boolean;
  presets: RequestPreset[];
  showCreatePresetDialog: boolean;
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
  applyPreset: (preset: RequestPreset) => void;
  deletePreset: (presetId: string) => void;
  setShowCreatePresetDialog: (show: boolean) => void;
  setNewPresetName: (name: string) => void;
  setNewPresetDescription: (description: string) => void;
  setIsPresetsExpanded: (expanded: boolean) => void;
  setActivePresetId: (id: string | null) => void;
}

export function useRequestActions(requestData: RequestFormData) {
  const { triggerSidebarRefresh, setSelectedRequest, selectedRequest } = useStore();
  const { showSuccess, showError } = useToastNotifications();

  const [state, setState] = useState<RequestActionsState>({
    response: null,
    isLoading: false,
    presets: [],
    showCreatePresetDialog: false,
    newPresetName: '',
    newPresetDescription: '',
    isPresetsExpanded: true,
    activePresetId: null,
  });

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
        auth: requestData.auth
      });

      setState(prev => ({ ...prev, response }));
      showSuccess('Request completed', { description: `Status: ${response.status}` });
    } catch (err: any) {
      showError('Request Failed', err.message || 'An error occurred while sending the request');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [requestData, showSuccess, showError]);

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

  const createPreset = useCallback(() => {
    if (!state.newPresetName.trim()) return;
    
    // Capture current body data based on body type
    let capturedBody = '';
    if (requestData.body) {
      capturedBody = requestData.body;
    }
    
    const preset: RequestPreset = {
      id: Date.now().toString(),
      name: state.newPresetName.trim(),
      description: state.newPresetDescription.trim() || undefined,
      requestData: {
        method: requestData.method,
        url: requestData.url,
        headers: { ...requestData.headers },
        body: capturedBody,
        queryParams: [...requestData.queryParams],
        auth: { ...requestData.auth }
      }
    };
    
    setState(prev => ({
      ...prev,
      presets: [...prev.presets, preset],
      newPresetName: '',
      newPresetDescription: '',
      showCreatePresetDialog: false,
    }));
    
    showSuccess('Preset Created', { description: `"${preset.name}" has been saved successfully` });
  }, [state.newPresetName, state.newPresetDescription, requestData, showSuccess]);

  const applyPreset = useCallback((preset: RequestPreset) => {
    setState(prev => ({ ...prev, activePresetId: preset.id }));
    showSuccess('Preset Applied', { description: `"${preset.name}" configuration has been applied` });
  }, [showSuccess]);

  const deletePreset = useCallback((presetId: string) => {
    setState(prev => ({
      ...prev,
      presets: prev.presets.filter(p => p.id !== presetId),
    }));
    showSuccess('Preset Deleted', { description: 'Preset has been removed successfully' });
  }, [showSuccess]);

  const actions: RequestActionsActions = {
    sendRequest,
    saveRequest,
    copyResponse,
    downloadResponse,
    createPreset,
    applyPreset,
    deletePreset,
    setShowCreatePresetDialog: (show) => setState(prev => ({ ...prev, showCreatePresetDialog: show })),
    setNewPresetName: (name) => setState(prev => ({ ...prev, newPresetName: name })),
    setNewPresetDescription: (description) => setState(prev => ({ ...prev, newPresetDescription: description })),
    setIsPresetsExpanded: (expanded) => setState(prev => ({ ...prev, isPresetsExpanded: expanded })),
    setActivePresetId: (id) => setState(prev => ({ ...prev, activePresetId: id })),
  };

  return {
    ...state,
    ...actions,
  };
}
