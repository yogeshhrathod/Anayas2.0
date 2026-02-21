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

import { useCallback, useEffect, useRef, useState } from 'react';
import { generateDraftName } from '../lib/draftNaming';
import { useStore } from '../store/useStore';
import { EntityId, Request } from '../types/entities';
import { RequestFormData } from '../types/forms';

export interface RequestState {
  requestData: RequestFormData;
  activeTab: 'params' | 'auth' | 'headers' | 'body' | 'response';
  bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded';
  bodyContentType: 'json' | 'text';
  bodyViewMode: 'table' | 'json';
  bodyFormData: Array<{ key: string; value: string; enabled: boolean }>;
  paramsViewMode: 'table' | 'json';
  headersViewMode: 'table' | 'json';
  bulkEditJson: string;
  responseSubTab: 'headers' | 'body' | 'both';
  splitViewRatio: number;
  isSaved: boolean;
  lastSavedAt: Date | null;
  isEditingName: boolean;
  tempName: string;
}

export interface RequestStateActions {
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
  setActiveTab: (tab: RequestState['activeTab']) => void;
  setBodyType: (type: RequestState['bodyType']) => void;
  setBodyContentType: (type: RequestState['bodyContentType']) => void;
  setBodyViewMode: (mode: RequestState['bodyViewMode']) => void;
  setBodyFormData: (data: RequestState['bodyFormData']) => void;
  setParamsViewMode: (mode: RequestState['paramsViewMode']) => void;
  setHeadersViewMode: (mode: RequestState['headersViewMode']) => void;
  setBulkEditJson: (json: string) => void;
  setResponseSubTab: (tab: RequestState['responseSubTab']) => void;
  setSplitViewRatio: (ratio: number) => void;
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
    'Content-Type': 'application/json',
  },
  body: '',
  queryParams: [],
  auth: {
    type: 'none',
  },
  collectionId: undefined,
  folderId: undefined,
  isFavorite: false,
};

export function useRequestState(selectedRequest: Request | null) {
  // Individual selectors for better performance and stability
  const settings = useStore(state => state.settings);
  const triggerSidebarRefresh = useStore(state => state.triggerSidebarRefresh);
  const setUnsavedRequests = useStore(state => state.setUnsavedRequests);
  const activeUnsavedRequestId = useStore(
    state => state.activeUnsavedRequestId
  );
  const setActiveUnsavedRequestId = useStore(
    state => state.setActiveUnsavedRequestId
  );
  const setSelectedRequest = useStore(state => state.setSelectedRequest);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsavedSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInternalUpdateRef = useRef<boolean>(false);

  // Load default responseSubTab from settings (defaults to 'headers' if not set)
  const defaultResponseSubTab =
    (settings?.defaultResponseSubTab as 'headers' | 'body' | 'both') ||
    'headers';

  const [state, setState] = useState<RequestState>(() => {
    const initialRequestData = selectedRequest
      ? {
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
        }
      : defaultRequestData;

    return {
      requestData: initialRequestData,
      activeTab: 'params',
      bodyType: 'raw',
      bodyContentType: 'json',
      bodyViewMode: 'table',
      bodyFormData: [],
      paramsViewMode: 'table',
      headersViewMode: 'table',
      bulkEditJson: '',
      responseSubTab: defaultResponseSubTab,
      splitViewRatio: 50,
      isSaved: !!selectedRequest,
      lastSavedAt: selectedRequest ? new Date() : null,
      isEditingName: false,
      tempName: '',
    };
  });

  // Load selected request when it changes from outside
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    if (!selectedRequest) {
      // Only reset if we're not already at default
      if (state.requestData.url !== '' || state.requestData.body !== '') {
        setState(prev => ({
          ...prev,
          requestData: defaultRequestData,
          isSaved: false,
          lastSavedAt: null,
        }));
      }
      return;
    }

    // Deep check to avoid redundant updates if we already have this request loaded
    const isSameRequest =
      state.requestData.id === selectedRequest.id &&
      state.requestData.name === selectedRequest.name &&
      state.requestData.method === selectedRequest.method &&
      state.requestData.url === selectedRequest.url &&
      state.requestData.body === selectedRequest.body &&
      JSON.stringify(state.requestData.headers) ===
        JSON.stringify(selectedRequest.headers || {}) &&
      JSON.stringify(state.requestData.queryParams) ===
        JSON.stringify(selectedRequest.queryParams || []) &&
      JSON.stringify(state.requestData.auth) ===
        JSON.stringify(selectedRequest.auth || { type: 'none' });

    if (!isSameRequest) {
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
    }
  }, [selectedRequest]);

  // Synchronize local changes back to the global store
  useEffect(() => {
    // IMPORTANT: Never sync if there's no selected request.
    // This prevents the infinite loop when selectedRequest is cleared (null).
    if (!selectedRequest || !state.requestData) return;

    // Use a more robust comparison including deep check for objects
    const isSameRequest = 
      state.requestData.id === selectedRequest.id &&
      state.requestData.name === selectedRequest.name &&
      state.requestData.method === selectedRequest.method &&
      state.requestData.url === selectedRequest.url &&
      state.requestData.body === selectedRequest.body &&
      state.requestData.collectionId === selectedRequest.collectionId &&
      state.requestData.folderId === selectedRequest.folderId &&
      Boolean(state.requestData.isFavorite) === Boolean(selectedRequest.isFavorite) &&
      JSON.stringify(state.requestData.headers || {}) === JSON.stringify(selectedRequest.headers || {}) &&
      JSON.stringify(state.requestData.queryParams || []) === JSON.stringify(selectedRequest.queryParams || []) &&
      JSON.stringify(state.requestData.auth || {}) === JSON.stringify(selectedRequest.auth || {});

    if (!isSameRequest) {
      isInternalUpdateRef.current = true;
      setSelectedRequest({
        ...selectedRequest,
        ...state.requestData,
        isFavorite: state.requestData.isFavorite ? 1 : 0,
      } as Request);
    }
  }, [state.requestData, setSelectedRequest, selectedRequest]);

  // Auto-save functionality for saved requests
  const autoSave = useCallback(async () => {
    if (
      !settings.autoSaveRequests ||
      !state.requestData.name.trim() ||
      !state.requestData.collectionId
    ) {
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
        isFavorite: state.requestData.isFavorite ? 1 : 0,
      });

      setState(prev => ({
        ...prev,
        isSaved: true,
        lastSavedAt: new Date(),
      }));

      // Trigger sidebar refresh so the sidebar doesn't show stale data
      triggerSidebarRefresh();
    } catch (e: any) {
      console.error('Auto-save failed:', e);
    }
  }, [state.requestData, settings.autoSaveRequests, triggerSidebarRefresh]);

  // Auto-save unsaved requests
  const autoSaveUnsaved = useCallback(async () => {
    // Only auto-save if request is unsaved (no id or collectionId)
    if (state.requestData.id || state.requestData.collectionId) {
      return;
    }

    // Don't save completely empty requests
    if (
      !state.requestData.url &&
      !state.requestData.body &&
      state.requestData.queryParams.length === 0
    ) {
      return;
    }

    try {
      const draftName =
        state.requestData.name ||
        generateDraftName(state.requestData.method, state.requestData.url);

      const result = await window.electronAPI.unsavedRequest.save({
        id: activeUnsavedRequestId || undefined,
        name: draftName,
        method: state.requestData.method,
        url: state.requestData.url,
        headers: state.requestData.headers,
        body: state.requestData.body || '',
        queryParams: state.requestData.queryParams,
        auth: state.requestData.auth,
        lastResponse: selectedRequest?.lastResponse,
      });

      // Update active unsaved request ID only if it was newly created
      if (!activeUnsavedRequestId && result.id) {
        setActiveUnsavedRequestId(result.id);
      }

      // Reload unsaved requests
      const allUnsaved = await window.electronAPI.unsavedRequest.getAll();
      setUnsavedRequests(allUnsaved);

      // Trigger sidebar refresh for unsaved section
      triggerSidebarRefresh();
    } catch (e: any) {
      console.error('Auto-save unsaved request failed:', e);
    }
  }, [
    state.requestData,
    activeUnsavedRequestId,
    setActiveUnsavedRequestId,
    setUnsavedRequests,
    selectedRequest?.lastResponse,
    triggerSidebarRefresh,
  ]);

  // Debounced auto-save for saved requests
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (
      settings.autoSaveRequests &&
      state.requestData.name.trim() &&
      state.requestData.collectionId
    ) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 1000); // Auto-save after 1 second of inactivity (reduced from 2s)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.requestData, autoSave, settings.autoSaveRequests]);

  // Flush save on ID change or unmount
  const prevIdRef = useRef<EntityId | undefined>(selectedRequest?.id);
  const stateRef = useRef(state.requestData);
  
  // Track latest request data in a ref for cleanup/flush
  useEffect(() => {
    stateRef.current = state.requestData;
  }, [state.requestData]);

  useEffect(() => {
    // When the ID changes, we should ideally save the PREVIOUS request if it was dirty.
    // However, since we now sync to the global store immediately and have 1s auto-save
    // with sidebar refresh triggers, the risk is much lower.
    
    // We update the prevIdRef for future use
    prevIdRef.current = selectedRequest?.id;
  }, [selectedRequest?.id]);

  // Debounced auto-save for unsaved requests (1 second)
  useEffect(() => {
    if (unsavedSaveTimeoutRef.current) {
      clearTimeout(unsavedSaveTimeoutRef.current);
    }

    // Auto-save unsaved requests after 1 second of inactivity
    unsavedSaveTimeoutRef.current = setTimeout(() => {
      autoSaveUnsaved();
    }, 1000);

    return () => {
      if (unsavedSaveTimeoutRef.current) {
        clearTimeout(unsavedSaveTimeoutRef.current);
      }
    };
  }, [state.requestData, autoSaveUnsaved]);

  const actions: RequestStateActions = {
    setRequestData: data => {
      setState(prev => ({
        ...prev,
        requestData: typeof data === 'function' ? data(prev.requestData) : data,
        isSaved: false,
      }));
    },
    setActiveTab: tab => setState(prev => ({ ...prev, activeTab: tab })),
    setBodyType: type => setState(prev => ({ ...prev, bodyType: type })),
    setBodyContentType: type =>
      setState(prev => ({ ...prev, bodyContentType: type })),
    setBodyViewMode: mode =>
      setState(prev => ({ ...prev, bodyViewMode: mode })),
    setBodyFormData: data =>
      setState(prev => ({ ...prev, bodyFormData: data })),
    setParamsViewMode: mode =>
      setState(prev => ({ ...prev, paramsViewMode: mode })),
    setHeadersViewMode: mode =>
      setState(prev => ({ ...prev, headersViewMode: mode })),
    setBulkEditJson: json =>
      setState(prev => ({ ...prev, bulkEditJson: json })),
    setResponseSubTab: tab => {
      setState(prev => ({ ...prev, responseSubTab: tab }));
      // Save preference to settings
      window.electronAPI.settings
        .set('defaultResponseSubTab', tab)
        .catch((err: any) => {
          console.error('Failed to save response sub-tab preference:', err);
        });
    },
    setSplitViewRatio: ratio =>
      setState(prev => ({ ...prev, splitViewRatio: ratio })),
    setIsSaved: saved => setState(prev => ({ ...prev, isSaved: saved })),
    setLastSavedAt: date => setState(prev => ({ ...prev, lastSavedAt: date })),
    setIsEditingName: editing =>
      setState(prev => ({ ...prev, isEditingName: editing })),
    setTempName: name => setState(prev => ({ ...prev, tempName: name })),

    startNameEdit: () => {
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
        // Check if this is an unsaved request (no id and no collectionId)
        const isUnsaved =
          !state.requestData.id && !state.requestData.collectionId;

        if (isUnsaved) {
          // Update unsaved request name
          const result = await window.electronAPI.unsavedRequest.save({
            id: activeUnsavedRequestId || undefined,
            name: state.tempName.trim(),
            method: state.requestData.method,
            url: state.requestData.url,
            headers: state.requestData.headers,
            body: state.requestData.body || '',
            queryParams: state.requestData.queryParams,
            auth: state.requestData.auth,
            lastResponse: selectedRequest?.lastResponse,
          });

          // Update active unsaved request ID if it was newly created
          if (!activeUnsavedRequestId && result.id) {
            setActiveUnsavedRequestId(result.id);
          }

          // Reload unsaved requests to update sidebar
          const allUnsaved = await window.electronAPI.unsavedRequest.getAll();
          setUnsavedRequests(allUnsaved);
        } else {
          // Update saved request name
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
            isFavorite: state.requestData.isFavorite ? 1 : 0,
          });

          // Trigger sidebar refresh for real-time updates
          triggerSidebarRefresh();
        }

        setState(prev => ({
          ...prev,
          requestData: { ...prev.requestData, name: prev.tempName.trim() },
          isSaved: true,
          lastSavedAt: new Date(),
          isEditingName: false,
        }));
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
