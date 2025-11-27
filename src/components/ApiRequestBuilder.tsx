/**
 * ApiRequestBuilder - Main request builder component (refactored)
 * 
 * Orchestrates the request building interface using smaller, focused components:
 * - RequestHeader for name, method, URL, and send button
 * - RequestTabs for navigation between configuration sections
 * - Individual tab components for params, headers, body, and auth
 * - ResponsePanel for displaying responses
 * - RequestPresets for preset management
 * 
 * This refactored version is much smaller and more maintainable than the original.
 */

import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SaveRequestDialog } from './ui/save-request-dialog';
import { KEYMAP, createKeymapHandler } from '../lib/keymap';
import { useRequestState } from '../hooks/useRequestState';
import { useRequestActions } from '../hooks/useRequestActions';
import { RequestHeader } from './request/RequestHeader';
import { RequestPreset } from '../types/entities';
import { RequestTabs } from './request/RequestTabs';
import { ParamsTab } from './request/ParamsTab';
import { HeadersTab } from './request/HeadersTab';
import { BodyTab } from './request/BodyTab';
import { AuthTab } from './request/AuthTab';
import { ResponseTab } from './request/ResponseTab';
import { RequestPresets } from './request/RequestPresets';

export function ApiRequestBuilder() {
  const { selectedRequest, triggerSidebarRefresh, setSelectedRequest, setFocusedContext } = useStore();
  
  // Use custom hooks for state and actions
  const requestState = useRequestState(selectedRequest);
  const requestActions = useRequestActions(requestState.requestData);

  // Reload presets when request ID changes (when switching between requests)
  useEffect(() => {
    // This is handled inside useRequestActions, but we trigger a refresh here if needed
    // The effect in useRequestActions will handle loading presets for the new request
  }, [requestState.requestData.id]);

  // Auto-switch to Response tab when response is received
  useEffect(() => {
    if (requestActions.response && requestState.activeTab !== 'response') {
      requestState.setActiveTab('response');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestActions.response, requestState.activeTab, requestState.setActiveTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleSaveRequest = createKeymapHandler(KEYMAP.SAVE_REQUEST, () => {
      handleSaveRequestClick();
    });

    const handleSendRequest = createKeymapHandler(KEYMAP.SEND_REQUEST, () => {
      requestActions.sendRequest();
    });

    const handleFocusUrl = createKeymapHandler(KEYMAP.FOCUS_URL, () => {
      const urlInput = document.querySelector('input[placeholder*="URL"]') as HTMLInputElement;
      if (urlInput) {
        urlInput.focus();
        urlInput.select();
      }
    });

    const handleCreatePreset = createKeymapHandler(KEYMAP.CREATE_PRESET, () => {
      requestActions.setShowCreatePresetDialog(true);
    });

    // Handlers for selecting presets 1-9
    const applyPresetToForm = (preset: RequestPreset) => {
      requestActions.applyPreset(preset, (data) => {
        requestState.setRequestData({
          ...requestState.requestData,
          method: data.method,
          url: data.url,
          headers: { ...data.headers },
          body: data.body,
          queryParams: [...data.queryParams],
          auth: { ...data.auth },
        });
      });
    };

    const handleSelectPreset1 = createKeymapHandler(KEYMAP.SELECT_PRESET_1, () => {
      if (requestActions.presets[0]) {
        applyPresetToForm(requestActions.presets[0]);
      }
    });
    const handleSelectPreset2 = createKeymapHandler(KEYMAP.SELECT_PRESET_2, () => {
      if (requestActions.presets[1]) {
        applyPresetToForm(requestActions.presets[1]);
      }
    });
    const handleSelectPreset3 = createKeymapHandler(KEYMAP.SELECT_PRESET_3, () => {
      if (requestActions.presets[2]) {
        applyPresetToForm(requestActions.presets[2]);
      }
    });
    const handleSelectPreset4 = createKeymapHandler(KEYMAP.SELECT_PRESET_4, () => {
      if (requestActions.presets[3]) {
        applyPresetToForm(requestActions.presets[3]);
      }
    });
    const handleSelectPreset5 = createKeymapHandler(KEYMAP.SELECT_PRESET_5, () => {
      if (requestActions.presets[4]) {
        applyPresetToForm(requestActions.presets[4]);
      }
    });
    const handleSelectPreset6 = createKeymapHandler(KEYMAP.SELECT_PRESET_6, () => {
      if (requestActions.presets[5]) {
        applyPresetToForm(requestActions.presets[5]);
      }
    });
    const handleSelectPreset7 = createKeymapHandler(KEYMAP.SELECT_PRESET_7, () => {
      if (requestActions.presets[6]) {
        applyPresetToForm(requestActions.presets[6]);
      }
    });
    const handleSelectPreset8 = createKeymapHandler(KEYMAP.SELECT_PRESET_8, () => {
      if (requestActions.presets[7]) {
        applyPresetToForm(requestActions.presets[7]);
      }
    });
    const handleSelectPreset9 = createKeymapHandler(KEYMAP.SELECT_PRESET_9, () => {
      if (requestActions.presets[8]) {
        applyPresetToForm(requestActions.presets[8]);
      }
    });

    document.addEventListener('keydown', handleSaveRequest);
    document.addEventListener('keydown', handleSendRequest);
    document.addEventListener('keydown', handleFocusUrl);
    document.addEventListener('keydown', handleCreatePreset);
    document.addEventListener('keydown', handleSelectPreset1);
    document.addEventListener('keydown', handleSelectPreset2);
    document.addEventListener('keydown', handleSelectPreset3);
    document.addEventListener('keydown', handleSelectPreset4);
    document.addEventListener('keydown', handleSelectPreset5);
    document.addEventListener('keydown', handleSelectPreset6);
    document.addEventListener('keydown', handleSelectPreset7);
    document.addEventListener('keydown', handleSelectPreset8);
    document.addEventListener('keydown', handleSelectPreset9);

    return () => {
      document.removeEventListener('keydown', handleSaveRequest);
      document.removeEventListener('keydown', handleSendRequest);
      document.removeEventListener('keydown', handleFocusUrl);
      document.removeEventListener('keydown', handleCreatePreset);
      document.removeEventListener('keydown', handleSelectPreset1);
      document.removeEventListener('keydown', handleSelectPreset2);
      document.removeEventListener('keydown', handleSelectPreset3);
      document.removeEventListener('keydown', handleSelectPreset4);
      document.removeEventListener('keydown', handleSelectPreset5);
      document.removeEventListener('keydown', handleSelectPreset6);
      document.removeEventListener('keydown', handleSelectPreset7);
      document.removeEventListener('keydown', handleSelectPreset8);
      document.removeEventListener('keydown', handleSelectPreset9);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestState.requestData, requestActions]);

  const handleSaveRequestClick = () => {
    if (requestState.requestData.id) {
      // Update existing request
      requestActions.saveRequest();
    } else {
      // Show save dialog for new request
      requestActions.setShowSaveRequestDialog(true);
    }
  };

  const handleSaveDialogSave = async (data: { name: string; collectionId: number; folderId?: number }) => {
    try {
      const result = await window.electronAPI.request.save({
        name: data.name,
        method: requestState.requestData.method,
        url: requestState.requestData.url,
        headers: requestState.requestData.headers,
        body: requestState.requestData.body,
        queryParams: requestState.requestData.queryParams,
        auth: requestState.requestData.auth,
        collectionId: data.collectionId,
        folderId: data.folderId,
        isFavorite: requestState.requestData.isFavorite,
      });
      
      // Update the request data with the new ID and collection info
      requestState.setRequestData({
        ...requestState.requestData,
        id: result.id,
        name: data.name,
        collectionId: data.collectionId,
        folderId: data.folderId,
      });
      
      requestState.setIsSaved(true);
      requestState.setLastSavedAt(new Date());
      
      // Trigger sidebar refresh
      triggerSidebarRefresh();
      
      // Update the selected request in store
      if (selectedRequest) {
        setSelectedRequest({
          ...selectedRequest,
          id: result.id,
          name: data.name,
          method: requestState.requestData.method,
          url: requestState.requestData.url,
          headers: requestState.requestData.headers,
          body: requestState.requestData.body,
          queryParams: requestState.requestData.queryParams,
          auth: requestState.requestData.auth,
          collectionId: data.collectionId,
          folderId: data.folderId,
          isFavorite: requestState.requestData.isFavorite ? 1 : 0,
        });
      }
    } catch (e: unknown) {
      console.error('Failed to save request:', e);
    }
  };

  const renderTabContent = () => {
    switch (requestState.activeTab) {
      case 'params':
        return (
          <ParamsTab
            requestData={requestState.requestData}
            setRequestData={requestState.setRequestData}
            paramsViewMode={requestState.paramsViewMode}
            setParamsViewMode={requestState.setParamsViewMode}
            bulkEditJson={requestState.bulkEditJson}
            setBulkEditJson={requestState.setBulkEditJson}
          />
        );
      case 'headers':
        return (
          <HeadersTab
            requestData={requestState.requestData}
            setRequestData={requestState.setRequestData}
            headersViewMode={requestState.headersViewMode}
            setHeadersViewMode={requestState.setHeadersViewMode}
            bulkEditJson={requestState.bulkEditJson}
            setBulkEditJson={requestState.setBulkEditJson}
          />
        );
      case 'body':
        return (
          <BodyTab
            requestData={requestState.requestData}
            setRequestData={requestState.setRequestData}
            bodyType={requestState.bodyType}
            setBodyType={requestState.setBodyType}
            bodyContentType={requestState.bodyContentType}
            setBodyContentType={requestState.setBodyContentType}
            bodyViewMode={requestState.bodyViewMode}
            setBodyViewMode={requestState.setBodyViewMode}
            bodyFormData={requestState.bodyFormData}
            setBodyFormData={requestState.setBodyFormData}
          />
        );
      case 'auth':
        return (
          <AuthTab
            requestData={requestState.requestData}
            setRequestData={requestState.setRequestData}
          />
        );
      case 'response':
        return (
          <ResponseTab
            response={requestActions.response}
            onCopy={requestActions.copyResponse}
            onDownload={requestActions.downloadResponse}
            responseSubTab={requestState.responseSubTab}
            setResponseSubTab={requestState.setResponseSubTab}
            splitRatio={requestState.splitViewRatio}
            setSplitRatio={requestState.setSplitViewRatio}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-background"
      onFocus={() => setFocusedContext('editor')}
      onBlur={() => setFocusedContext(null)}
    >
      {/* Request Builder Header */}
      <RequestHeader
        requestData={requestState.requestData}
        setRequestData={requestState.setRequestData}
        isSaved={requestState.isSaved}
        lastSavedAt={requestState.lastSavedAt}
        isEditingName={requestState.isEditingName}
        tempName={requestState.tempName}
        onNameEdit={{
          start: requestState.startNameEdit,
          save: requestState.saveNameEdit,
          cancel: requestState.cancelNameEdit,
          setTempName: requestState.setTempName,
        }}
        onSend={requestActions.sendRequest}
        isLoading={requestActions.isLoading}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Request Configuration */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <RequestTabs
            activeTab={requestState.activeTab}
            setActiveTab={requestState.setActiveTab}
            requestData={requestState.requestData}
            bodyContentType={requestState.bodyContentType}
            response={requestActions.response}
          />

          {/* Tab Content */}
          <div className="flex-1 p-3 bg-background/50 overflow-hidden">
            {renderTabContent()}
          </div>
        </div>

        {/* Right Panel - Request Presets */}
        <RequestPresets
          presets={requestActions.presets}
          isExpanded={requestActions.isPresetsExpanded}
          activePresetId={requestActions.activePresetId}
          showCreateDialog={requestActions.showCreatePresetDialog}
          newPresetName={requestActions.newPresetName}
          newPresetDescription={requestActions.newPresetDescription}
          onToggleExpanded={requestActions.setIsPresetsExpanded}
          onCreatePreset={requestActions.createPreset}
          onApplyPreset={(preset) => {
            requestActions.applyPreset(preset, (data) => {
              requestState.setRequestData({
                ...requestState.requestData,
                method: data.method,
                url: data.url,
                headers: { ...data.headers },
                body: data.body,
                queryParams: [...data.queryParams],
                auth: { ...data.auth },
              });
            });
          }}
          onDeletePreset={requestActions.deletePreset}
          onShowCreateDialog={requestActions.setShowCreatePresetDialog}
          onSetNewPresetName={requestActions.setNewPresetName}
          onSetNewPresetDescription={requestActions.setNewPresetDescription}
        />
      </div>
      
      {/* Save Request Dialog */}
      <SaveRequestDialog
        open={requestActions.showSaveRequestDialog}
        onOpenChange={requestActions.setShowSaveRequestDialog}
        onSave={handleSaveDialogSave}
        currentRequestName={requestState.requestData.name}
        currentCollectionId={requestState.requestData.collectionId}
        currentFolderId={requestState.requestData.folderId}
      />
    </div>
  );
}