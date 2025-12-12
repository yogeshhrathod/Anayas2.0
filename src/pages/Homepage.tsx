import { ApiRequestBuilder } from '../components/ApiRequestBuilder';

export function Homepage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Main Content - Fills available space */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ApiRequestBuilder />
      </div>

      {/* Status Bar - Fixed at bottom */}
      <div className="flex-shrink-0 flex items-center px-4 py-2 border-t bg-card/30 backdrop-blur-sm text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success status-pulse"></div>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}
