import { Button } from '../components/ui/button';
import { ApiRequestBuilder } from '../components/ApiRequestBuilder';
import { EnvironmentSwitcher } from '../components/EnvironmentSwitcher';
import { 
  Plus,
  Upload,
  Clock
} from 'lucide-react';

export function Homepage() {
  return (
    <div className="h-full flex flex-col">
      {/* Compact Toolbar */}
      <div className="flex items-center justify-end px-4 py-2 border-b bg-card/30 backdrop-blur-sm glass">
        {/* Essential Tools */}
        <div className="flex items-center gap-2">
          <EnvironmentSwitcher />
          <div className="w-px h-6 bg-border"></div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 btn-glow-info focus-ring"
            title="Import Collection"
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 px-3 btn-glow focus-ring gradient-primary"
            title="New Request"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Request
          </Button>
        </div>
      </div>

      {/* Main Content - Maximized Space */}
      <div className="flex-1 overflow-hidden">
        <ApiRequestBuilder />
      </div>

      {/* Minimal Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t bg-card/30 backdrop-blur-sm text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-info" />
          <span>Ready</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-success status-pulse"></div>
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}