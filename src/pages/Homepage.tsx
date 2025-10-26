import { ApiRequestBuilder } from '../components/ApiRequestBuilder';
import { Button } from '../components/ui/button';
import { useStore } from '../store/useStore';
import { Request } from '../types/entities';

export function Homepage() {
  const { setSelectedRequest } = useStore();

  const handleNewRequest = () => {
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
    <div className="h-full flex flex-col">
      {/* Header with New Request Button */}
      <div className="flex items-center justify-between p-4 border-b bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">API Request Builder</h1>
        </div>
        <Button onClick={handleNewRequest} className="flex items-center gap-2">
          <span>+</span>
          New Request
        </Button>
      </div>

      {/* Main Content - Maximized Space */}
      <div className="flex-1 overflow-hidden">
        <ApiRequestBuilder />
      </div>

      {/* Minimal Status Bar */}
      <div className="flex items-center justify-center px-4 py-1 border-t bg-card/30 backdrop-blur-sm text-xs text-muted-foreground relative z-0">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success status-pulse"></div>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}