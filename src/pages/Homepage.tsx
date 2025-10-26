import { ApiRequestBuilder } from '../components/ApiRequestBuilder';

export function Homepage() {

  return (
    <div className="h-full flex flex-col relative">
      {/* Main Content - Maximized Space */}
      <div className="flex-1 overflow-hidden">
        <ApiRequestBuilder />
      </div>

      {/* Status Bar */}
      <div className="flex items-center px-4 py-2 border-t bg-card/30 backdrop-blur-sm text-xs text-muted-foreground relative z-0">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success status-pulse"></div>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}