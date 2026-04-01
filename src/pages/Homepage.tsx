import { ApiRequestBuilder } from '../components/ApiRequestBuilder';

export function Homepage() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Main Content - Fills available space */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ApiRequestBuilder />
      </div>
    </div>
  );
}
