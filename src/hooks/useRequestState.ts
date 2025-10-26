/**
 * useRequestState - Custom hook for request state management
 * 
 * Manages the complex state of API requests including:
 * - Request data (method, URL, headers, body, etc.)
 * - UI state (active tabs, view modes, etc.)
 * - Save status and auto-save functionality
 * 
 * @example
 * ```tsx
 * const {
 *   requestData,
 *   setRequestData,
 *   activeTab,
 *   setActiveTab,
 *   isSaved,
 *   lastSavedAt
 * } = useRequestState(selectedRequest);
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { RequestFormData } from '../types/forms';
import { Request } from '../types/entities';
import { useStore } from '../store/useStore';

export interface RequestState {
  requestData: RequestFormData;
  activeTab: 'params' | 'auth' | 'headers' | 'body';
  bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded';
  bodyContentType: 'json' | 'text';
  bodyViewMode: 'table' | 'json';
  bodyFormData: Array<{ key: string; value: string; enabled: boolean }>;
  paramsViewMode: 'table' | 'json';
  headersViewMode: 'table' | 'json';
  bulkEditJson: string;
  isSaved: boolean;
  lastSavedAt: Date | null;
  isEditingName: boolean;
  tempName: string;
}

export interface RequestStateActions {
  setRequestData: (data: RequestFormData | ((prev: RequestFormData) => RequestFormData)) => void;
  setActiveTab: (tab: RequestState['activeTab']) => void;
  setBodyType: (type: RequestState['bodyType']) => void;
  setBodyContentType: (type: RequestState['bodyContentType']) => void;
  setBodyViewMode: (mode: RequestState['bodyViewMode']) => void;
  setBodyFormData: (data: RequestState['bodyFormData']) => void;
  setParamsViewMode: (mode: RequestState['paramsViewMode']) => void;
  setHeadersViewMode: (mode: RequestState['headersViewMode']) => void;
  setBulkEditJson: (json: string) => void;
  setIsSaved: (saved: boolean) => void;
  setLastSavedAt: (date: Date | null) => void;
  setIsEditingName: (editing: boolean) => void;
  setTempName: (name: string) => void;
  startNameEdit: () => void;
  cancelNameEdit: () => void;
  saveNameEdit: () => Promise<void>;
}

const defaultRequestData: RequestFormData = {
  name: '',
  method: 'GET',
  url: '',
  headers: {
    'Content-Type': 'application/json'
  },
  body: '',
  queryParams: [],
  auth: {
    type: 'none'
  },
  collectionId: undefined,
  folderId: undefined,
  isFavorite: false,
};

export function useRequestState(selectedRequest: Request | null) {
  const { settings, triggerSidebarRefresh } = useStore();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<RequestState>({
    requestData: defaultRequestData,
    activeTab: 'params',
    bodyType: 'raw',
    bodyContentType: 'json',
    bodyViewMode: 'table',
    bodyFormData: [],
    paramsViewMode: 'table',
    headersViewMode: 'table',
    bulkEditJson: '',
    isSaved: false,
    lastSavedAt: null,
    isEditingName: false,
    tempName: '',
  });

  // Load selected request when it changes
  useEffect(() => {
    if (selectedRequest) {
      setState(prev => ({
        ...prev,
        requestData: {
          id: selectedRequest.id,
          name: selectedRequest.name,
          method: selectedRequest.method as RequestFormData['method'],
          url: selectedRequest.url,
          headers: selectedRequest.headers || {},
          body: selectedRequest.body || '',
          queryParams: selectedRequest.queryParams || [],
          auth: selectedRequest.auth || { type: 'none' },
          collectionId: selectedRequest.collectionId,
          folderId: selectedRequest.folderId,
          isFavorite: Boolean(selectedRequest.isFavorite),
        },
        isSaved: true,
        lastSavedAt: new Date(),
      }));
    } else {
      setState(prev => ({
        ...prev,
        requestData: defaultRequestData,
        isSaved: false,
        lastSavedAt: null,
      }));
    }
  }, [selectedRequest]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!settings.autoSaveRequests || !state.requestData.name.trim() || !state.requestData.collectionId) {
      return;
    }

    try {
      await window.electronAPI.request.save({
        id: state.requestData.id,
        name: state.requestData.name,
        method: state.requestData.method,
        url: state.requestData.url,
        headers: state.requestData.headers,
        body: state.requestData.body,
        queryParams: state.requestData.queryParams,
        auth: state.requestData.auth,
        collectionId: state.requestData.collectionId,
        folderId: state.requestData.folderId,
        isFavorite: state.requestData.isFavorite,
      });
      
      setState(prev => ({
        ...prev,
        isSaved: true,
        lastSavedAt: new Date(),
      }));
    } catch (e: any) {
      console.error('Auto-save failed:', e);
    }
  }, [state.requestData, settings.autoSaveRequests]);

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (settings.autoSaveRequests && state.requestData.name.trim() && state.requestData.collectionId) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.requestData, autoSave]);

  const actions: RequestStateActions = {
    setRequestData: (data) => {
      setState(prev => ({
        ...prev,
        requestData: typeof data === 'function' ? data(prev.requestData) : data,
        isSaved: false,
      }));
    },
    setActiveTab: (tab) => setState(prev => ({ ...prev, activeTab: tab })),
    setBodyType: (type) => setState(prev => ({ ...prev, bodyType: type })),
    setBodyContentType: (type) => setState(prev => ({ ...prev, bodyContentType: type })),
    setBodyViewMode: (mode) => setState(prev => ({ ...prev, bodyViewMode: mode })),
    setBodyFormData: (data) => setState(prev => ({ ...prev, bodyFormData: data })),
    setParamsViewMode: (mode) => setState(prev => ({ ...prev, paramsViewMode: mode })),
    setHeadersViewMode: (mode) => setState(prev => ({ ...prev, headersViewMode: mode })),
    setBulkEditJson: (json) => setState(prev => ({ ...prev, bulkEditJson: json })),
    setIsSaved: (saved) => setState(prev => ({ ...prev, isSaved: saved })),
    setLastSavedAt: (date) => setState(prev => ({ ...prev, lastSavedAt: date })),
    setIsEditingName: (editing) => setState(prev => ({ ...prev, isEditingName: editing })),
    setTempName: (name) => setState(prev => ({ ...prev, tempName: name })),
    
    startNameEdit: () => {
      if (!state.requestData.id) return;
      setState(prev => ({
        ...prev,
        isEditingName: true,
        tempName: prev.requestData.name,
      }));
    },
    
    cancelNameEdit: () => {
      setState(prev => ({
        ...prev,
        isEditingName: false,
        tempName: prev.requestData.name,
      }));
    },
    
    saveNameEdit: async () => {
      if (!state.tempName.trim()) {
        actions.cancelNameEdit();
        return;
      }

      if (state.tempName.trim() === state.requestData.name) {
        actions.cancelNameEdit();
        return;
      }

      try {
        await window.electronAPI.request.save({
          id: state.requestData.id,
          name: state.tempName.trim(),
          method: state.requestData.method,
          url: state.requestData.url,
          headers: state.requestData.headers,
          body: state.requestData.body,
          queryParams: state.requestData.queryParams,
          auth: state.requestData.auth,
          collectionId: state.requestData.collectionId,
          folderId: state.requestData.folderId,
          isFavorite: state.requestData.isFavorite,
        });
        
        setState(prev => ({
          ...prev,
          requestData: { ...prev.requestData, name: prev.tempName.trim() },
          isSaved: true,
          lastSavedAt: new Date(),
          isEditingName: false,
        }));
        
        // Trigger sidebar refresh for real-time updates
        triggerSidebarRefresh();
      } catch (e: any) {
        console.error('Failed to update request name:', e);
        actions.cancelNameEdit();
        throw e;
      }
    },
  };

  return {
    ...state,
    ...actions,
  };
}
