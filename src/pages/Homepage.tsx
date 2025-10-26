import { ApiRequestBuilder } from '../components/ApiRequestBuilder';
import { Button } from '../components/ui/button';
import { useStore } from '../store/useStore';
import { Request } from '../types/entities';
import { Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { getShortcutDisplay, KEYMAP } from '../lib/keymap';

export function Homepage() {
  const { setSelectedRequest } = useStore();

  const { setActiveUnsavedRequestId } = useStore();
  
  const handleNewRequest = () => {
    // Clear active unsaved request ID to create a new one
    setActiveUnsavedRequestId(null);
    
    // Create a new empty request and set it as selected
    const newRequest: Request = {
      name: '',
      method: 'GET',
      url: '',
      headers: { 'Content-Type': 'application/json' },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: undefined,
      folderId: undefined,
      isFavorite: 0,
    };
    
    setSelectedRequest(newRequest);
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Main Content - Maximized Space */}
      <div className="flex-1 overflow-hidden">
        <ApiRequestBuilder />
      </div>

      {/* Status Bar with New Request Button */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-card/30 backdrop-blur-sm text-xs text-muted-foreground relative z-0">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success status-pulse"></div>
          <span>Ready</span>
        </div>

        {/* New Request Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleNewRequest}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Request</span>
                <span className="hidden lg:inline text-muted-foreground">
                  ({getShortcutDisplay(KEYMAP.NEW_REQUEST)})
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New Request ({getShortcutDisplay(KEYMAP.NEW_REQUEST)})</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}