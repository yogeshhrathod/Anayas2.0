import { ApiRequestBuilder } from '../components/ApiRequestBuilder';

export function Homepage() {
  return (
    <div className="h-full flex flex-col">
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