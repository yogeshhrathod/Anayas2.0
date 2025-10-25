import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';
import { ApiRequestBuilder } from '../components/ApiRequestBuilder';
import { 
  Zap, 
  Plus
} from 'lucide-react';

export function Homepage() {
  const { 
    currentEnvironment, 
    environments, 
    requestHistory
  } = useStore();

  const successfulRequests = requestHistory.filter((r: any) => r.status === 200).length;
  const successRate = requestHistory.length > 0 
    ? Math.round((successfulRequests / requestHistory.length) * 100) 
    : 0;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Postman-style Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">API Tester</h1>
              <p className="text-xs text-muted-foreground">Postman-like API testing tool</p>
            </div>
          </div>
          
          {currentEnvironment && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">{currentEnvironment.displayName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Request
          </Button>
        </div>
      </div>

      {/* Main Content - Postman Layout */}
      <div className="flex-1 overflow-hidden">
        <ApiRequestBuilder />
      </div>

      {/* Bottom Stats Bar */}
      <div className="flex items-center justify-between p-3 border-t bg-card text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Requests: {requestHistory.length}</span>
          <span>Success Rate: {successRate}%</span>
          <span>Environments: {environments.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}