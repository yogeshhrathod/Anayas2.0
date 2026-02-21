/**
 * UnsavedRequestsSection - Sidebar section for displaying unsaved requests
 *
 * Shows all unsaved/draft requests with indicators for active/edited state
 */

import { Circle, MoreVertical, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import { UnsavedRequest, useStore } from '../../store/useStore';
import { Request } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { PromoteRequestDialog } from '../ui/promote-request-dialog';

export function UnsavedRequestsSection() {
  const {
    unsavedRequests,
    activeUnsavedRequestId,
    setSelectedRequest,
    setActiveUnsavedRequestId,
    setCurrentPage,
    triggerSidebarRefresh,
  } = useStore();

  const { showSuccess, showError } = useToastNotifications();
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [selectedUnsavedForPromotion, setSelectedUnsavedForPromotion] =
    useState<UnsavedRequest | null>(null);

  const handleSelectUnsaved = (unsaved: UnsavedRequest) => {
    // If this unsaved request is already active, don't re-set it.
    // This prevents losing in-memory edits before they are auto-saved.
    if (activeUnsavedRequestId === unsaved.id) {
      setCurrentPage('home');
      return;
    }

    const request: Request = {
      id: undefined,
      name: unsaved.name,
      method: unsaved.method as any,
      url: unsaved.url,
      headers: unsaved.headers,
      body: unsaved.body,
      queryParams: unsaved.queryParams,
      auth: unsaved.auth,
      collectionId: undefined,
      folderId: undefined,
      isFavorite: 0,
      lastResponse: unsaved.lastResponse,
    };

    setSelectedRequest(request);
    setActiveUnsavedRequestId(unsaved.id);
    setCurrentPage('home');
  };

  const handleDeleteUnsaved = async (id: string) => {
    try {
      const result = await window.electronAPI.unsavedRequest.delete(id);

      if (result && !result.success) {
        throw new Error(result.error || 'Failed to delete unsaved request');
      }

      // Clear active unsaved request if it's the one being deleted
      if (activeUnsavedRequestId === id) {
        setActiveUnsavedRequestId(null);
        setSelectedRequest(null);
      }

      // Reload unsaved requests from the database
      const { setUnsavedRequests } = useStore.getState();
      const updatedUnsaved = await window.electronAPI.unsavedRequest.getAll();
      setUnsavedRequests(updatedUnsaved);

      // Show success message
      showSuccess('Unsaved request deleted');

      // Trigger sidebar refresh
      triggerSidebarRefresh();
    } catch (error: any) {
      console.error('Failed to delete unsaved request:', error);
      showError(
        'Failed to delete',
        error.message || 'Failed to delete unsaved request'
      );
    }
  };

  const handleSaveToCollection = (unsaved: UnsavedRequest) => {
    setSelectedUnsavedForPromotion(unsaved);
    setShowPromoteDialog(true);
  };

  const handleDragStart = (e: React.DragEvent, unsaved: UnsavedRequest) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'unsaved-request',
        id: unsaved.id,
        data: unsaved,
      })
    );
  };

  if (unsavedRequests.length === 0) {
    return null;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Unsaved Requests List */}
      <div className="flex-1 overflow-y-auto space-y-0.5 py-1 min-h-0">
        {unsavedRequests.map(unsaved => {
          const isActive = unsaved.id === activeUnsavedRequestId;

          return (
            <div
              key={unsaved.id}
              className={`group flex items-center gap-2.5 px-3 py-2 mx-2 mb-1 rounded-lg cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => handleSelectUnsaved(unsaved)}
              draggable
              onDragStart={e => handleDragStart(e, unsaved)}
            >
              {/* Method Badge */}
              <Badge
                variant="secondary"
                className={`h-5 px-1.5 text-xs text-white font-mono ${
                  unsaved.method === 'GET'
                    ? 'bg-green-500'
                    : unsaved.method === 'POST'
                      ? 'bg-blue-500'
                      : unsaved.method === 'PUT'
                        ? 'bg-orange-500'
                        : unsaved.method === 'PATCH'
                          ? 'bg-purple-500'
                          : unsaved.method === 'DELETE'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                }`}
              >
                {unsaved.method}
              </Badge>

              {/* Request Name */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-primary drop-shadow-sm' : 'group-hover:text-foreground'}`}
                >
                  {unsaved.name}
                </div>
              </div>

              {/* Unsaved indicator */}
              <Circle className="h-2 w-2 flex-shrink-0 fill-orange-500 text-orange-500" />

              {/* Actions menu */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        handleSaveToCollection(unsaved);
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save to Collection
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteUnsaved(unsaved.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Promote Dialog */}
      <PromoteRequestDialog
        open={showPromoteDialog}
        onOpenChange={setShowPromoteDialog}
        unsavedRequest={selectedUnsavedForPromotion}
      />
    </div>
  );
}
