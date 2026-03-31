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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateDraftName } from '../lib/draftNaming';
import logger from '../lib/logger';
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
  responseSubTab: 'headers' | 'body' | 'both' | 'console';
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
  setResponseSubTab: (tab: 'headers' | 'body' | 'both' | 'console') => void;
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

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsavedSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track previous selectedRequest id to detect external changes
  const prevSelectedIdRef = useRef<EntityId | undefined>(selectedRequest?.id);
  const prevSelectedRevRef = useRef<string>('');

  // Load default responseSubTab from settings (defaults to 'headers' if not set)
  const defaultResponseSubTab =
    (settings?.defaultResponseSubTab as 'headers' | 'body' | 'both' | 'console') ||
    'headers';

  const [state, setState] = useState<RequestState>(() => {
    const initialRequestData: RequestFormData = selectedRequest
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
          bodyType: selectedRequest.bodyType as RequestFormData['bodyType'],
          bodyContentType: selectedRequest.bodyContentType as RequestFormData['bodyContentType'],
          bodyViewMode: selectedRequest.bodyViewMode as RequestFormData['bodyViewMode'],
        }
      : defaultRequestData;

    const bodyType = initialRequestData.bodyType || (initialRequestData.body ? 'raw' : 'none');
    const bodyViewMode = initialRequestData.bodyViewMode || 'json';
    
    // Parse body for table view if needed
    let bodyFormData: Array<{ key: string; value: string; enabled: boolean }> = [];
    if (bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded' || bodyViewMode === 'table') {
      try {
        const parsed = JSON.parse(initialRequestData.body || '{}');
        bodyFormData = Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value),
          enabled: true,
        }));
      } catch (e) {
        bodyFormData = [{ key: '', value: '', enabled: true }];
      }
    }
    if (bodyFormData.length === 0) {
      bodyFormData = [{ key: '', value: '', enabled: true }];
    }

    return {
      requestData: initialRequestData,
      activeTab: (selectedRequest as any)?.activeTab || 'params',
      bodyType,
      bodyContentType: initialRequestData.bodyContentType || 'json',
      bodyViewMode,
      bodyFormData,
      paramsViewMode: 'table',
      headersViewMode: 'table',
      bulkEditJson: '',
      responseSubTab: defaultResponseSubTab,
      splitViewRatio: (selectedRequest as any)?.splitViewRatio || 50,
      isSaved: !!selectedRequest,
      lastSavedAt: selectedRequest ? new Date() : null,
      isEditingName: false,
      tempName: '',
    };
  });

  // Load selected request when it changes from OUTSIDE (e.g., sidebar click, session recovery).
  // We only reload when the selectedRequest ID changes OR when the request object changes
  // due to an external action (save, send response). We do NOT sync local edits back to the
  // global store here — that would cause an infinite update loop.
  useEffect(() => {
    if (!selectedRequest) {
      // Only reset if we're not already at default
      if (state.requestData.url !== '' || state.requestData.body !== '') {
        setState(prev => ({
          ...prev,
          requestData: defaultRequestData,
          activeTab: 'params',
          isSaved: false,
          lastSavedAt: null,
        }));
      }
      prevSelectedIdRef.current = undefined;
      prevSelectedRevRef.current = '';
      return;
    }

    const newId = selectedRequest.id;
    const prevId = prevSelectedIdRef.current;

    // Build a lightweight revision token from fields that indicate an *external* update.
    // We use name+collectionId+folderId because those are set by the DB after save.
    // We intentionally exclude url/headers/body/queryParams because those change locally.
    const revToken = `${newId}|${selectedRequest.name}|${selectedRequest.collectionId}|${selectedRequest.folderId}|${selectedRequest.isFavorite}`;
    const prevRevToken = prevSelectedRevRef.current;

    // Only reload if the request ID changed (different request selected) OR
    // the revision token changed (save/DB updated the request externally)
    if (newId !== prevId || revToken !== prevRevToken) {
      prevSelectedIdRef.current = newId;
      prevSelectedRevRef.current = revToken;

      setState(prev => {
        const bodyType = (selectedRequest as any).bodyType || (selectedRequest.body ? 'raw' : 'none');
        const bodyViewMode = (selectedRequest as any).bodyViewMode || (bodyType === 'raw' ? 'json' : 'table');
        const bodyContentType = (selectedRequest as any).bodyContentType || 'json';
        const activeTab = (selectedRequest as any).activeTab || 'params';
        const splitViewRatio = (selectedRequest as any).splitViewRatio || 50;

        // Parse body for table view if it exists
        let bodyFormData: Array<{ key: string; value: string; enabled: boolean }> = [];
        if (bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded' || bodyViewMode === 'table') {
          try {
            const parsed = JSON.parse(selectedRequest.body || '{}');
            bodyFormData = Object.entries(parsed).map(([key, value]) => ({
              key,
              value: String(value),
              enabled: true,
            }));
          } catch (e) {
            bodyFormData = [{ key: '', value: '', enabled: true }];
          }
        }
        if (bodyFormData.length === 0) {
          bodyFormData = [{ key: '', value: '', enabled: true }];
        }

        return {
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
            bodyType: bodyType,
            bodyContentType: bodyContentType,
            bodyViewMode: bodyViewMode,
          },
          activeTab,
          bodyType,
          bodyContentType,
          bodyViewMode,
          bodyFormData,
          splitViewRatio,
          isSaved: true,
          lastSavedAt: new Date(),
        };
      });
    }
  // Disable exhaustive-deps: we intentionally only react to selectedRequest reference changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest]);

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
      logger.error('Auto-save failed', { error: e });
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
      logger.error('Auto-save unsaved request failed', { error: e });
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

  // Track latest request data in a ref (used by auto-save for unsaved requests so we
  // always read the most recent value even inside closures).
  const stateRef = useRef(state.requestData);
  useEffect(() => {
    stateRef.current = state.requestData;
  }, [state.requestData]);

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

  const setSelectedRequest = useStore(state => state.setSelectedRequest);
  const selectedRequestRef = useRef(selectedRequest);
  useEffect(() => {
    selectedRequestRef.current = selectedRequest;
  }, [selectedRequest]);

  // Sync edits back to the global store immediately so they survive navigation
  useEffect(() => {
    if (selectedRequestRef.current) {
      const currentInStore = selectedRequestRef.current;
      // Only update if there are meaningful changes to avoid loops
      const hasDataChanges = 
        currentInStore.url !== state.requestData.url ||
        currentInStore.method !== state.requestData.method ||
        currentInStore.body !== state.requestData.body ||
        JSON.stringify(currentInStore.headers) !== JSON.stringify(state.requestData.headers);
        
      const hasUIChanges =
        (currentInStore as any).activeTab !== state.activeTab ||
        (currentInStore as any).splitViewRatio !== state.splitViewRatio ||
        (currentInStore as any).bodyType !== state.bodyType ||
        (currentInStore as any).bodyViewMode !== state.bodyViewMode;

      if (hasDataChanges || hasUIChanges) {
        setSelectedRequest({
          ...currentInStore,
          ...state.requestData,
          isFavorite: state.requestData.isFavorite ? 1 : 0,
          // Persist UI state within the request object
          activeTab: state.activeTab,
          splitViewRatio: state.splitViewRatio,
          bodyType: state.bodyType,
          bodyViewMode: state.bodyViewMode,
        } as any);
      }
    }
  }, [state.requestData, state.activeTab, state.splitViewRatio, state.bodyType, state.bodyViewMode, setSelectedRequest]);

  const actions: RequestStateActions = useMemo(() => ({
    setRequestData: data => {
      setState(prev => ({
        ...prev,
        requestData: typeof data === 'function' ? data(prev.requestData) : data,
        isSaved: false,
      }));
    },
    setActiveTab: tab => setState(prev => ({ ...prev, activeTab: tab })),
    setBodyType: type => setState(prev => ({ 
      ...prev, 
      bodyType: type,
      requestData: { ...prev.requestData, bodyType: type } 
    })),
    setBodyContentType: type =>
      setState(prev => ({ 
        ...prev, 
        bodyContentType: type,
        requestData: { ...prev.requestData, bodyContentType: type }
      })),
    setBodyViewMode: mode =>
      setState(prev => ({ 
        ...prev, 
        bodyViewMode: mode,
        requestData: { ...prev.requestData, bodyViewMode: mode }
      })),
    setBodyFormData: data =>
      setState(prev => {
        let newBody = prev.requestData.body;
        // Keep request data body in sync with form data
        if (prev.bodyType === 'form-data' || prev.bodyType === 'x-www-form-urlencoded' || prev.bodyViewMode === 'table') {
          const jsonObj: Record<string, string> = {};
          data.forEach(item => {
            if (item.enabled && item.key.trim()) {
              jsonObj[item.key] = item.value;
            }
          });
          newBody = JSON.stringify(jsonObj, null, 2);
        }
        return { 
          ...prev, 
          bodyFormData: data,
          requestData: { 
            ...prev.requestData, 
            body: newBody,
            bodyType: prev.bodyType,
            bodyContentType: prev.bodyContentType,
            bodyViewMode: prev.bodyViewMode
          },
          isSaved: false 
        };
      }),
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
          logger.error('Failed to save response sub-tab preference', { error: err });
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
        logger.error('Failed to update request name', { error: e });
        actions.cancelNameEdit();
        throw e;
      }
    },
  }), [
    state.tempName,
    state.requestData,
    activeUnsavedRequestId,
    setActiveUnsavedRequestId,
    setUnsavedRequests,
    selectedRequest?.lastResponse,
    triggerSidebarRefresh,
  ]);

  return {
    ...state,
    ...actions,
  };
}
