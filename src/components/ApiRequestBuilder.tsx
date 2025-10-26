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
import { RequestTabs } from './request/RequestTabs';
import { ParamsTab } from './request/ParamsTab';
import { HeadersTab } from './request/HeadersTab';
import { BodyTab } from './request/BodyTab';
import { AuthTab } from './request/AuthTab';
import { ResponsePanel } from './request/ResponsePanel';
import { RequestPresets } from './request/RequestPresets';

export function ApiRequestBuilder() {
  const { selectedRequest, triggerSidebarRefresh, setSelectedRequest } = useStore();
  
  // Use custom hooks for state and actions
  const requestState = useRequestState(selectedRequest);
  const requestActions = useRequestActions(requestState.requestData);

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

    document.addEventListener('keydown', handleSaveRequest);
    document.addEventListener('keydown', handleSendRequest);
    document.addEventListener('keydown', handleFocusUrl);

    return () => {
      document.removeEventListener('keydown', handleSaveRequest);
      document.removeEventListener('keydown', handleSendRequest);
      document.removeEventListener('keydown', handleFocusUrl);
    };
  }, [requestState.requestData]);

  const handleSaveRequestClick = () => {
    if (requestState.requestData.id) {
      // Update existing request
      requestActions.saveRequest();
    } else {
      // Show save dialog for new request
      requestActions.setShowCreatePresetDialog(true);
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
          collection_id: data.collectionId,
          folder_id: data.folderId,
        });
      }
    } catch (e: any) {
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
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
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
          />

          {/* Tab Content */}
          <div className="flex-1 p-3 bg-background/50">
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
          onApplyPreset={requestActions.applyPreset}
          onDeletePreset={requestActions.deletePreset}
          onShowCreateDialog={requestActions.setShowCreatePresetDialog}
          onSetNewPresetName={requestActions.setNewPresetName}
          onSetNewPresetDescription={requestActions.setNewPresetDescription}
        />
      </div>

      {/* Response Section */}
      <ResponsePanel
        response={requestActions.response}
        onCopy={requestActions.copyResponse}
        onDownload={requestActions.downloadResponse}
      />
      
      {/* Save Request Dialog */}
      <SaveRequestDialog
        open={requestActions.showCreatePresetDialog}
        onOpenChange={requestActions.setShowCreatePresetDialog}
        onSave={handleSaveDialogSave}
        currentRequestName={requestState.requestData.name}
        currentCollectionId={requestState.requestData.collectionId}
        currentFolderId={requestState.requestData.folderId}
      />
    </div>
  );
}