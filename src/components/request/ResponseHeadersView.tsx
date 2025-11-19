/**
 * ResponseHeadersView - Display response headers, status, and time
 * 
 * Shows:
 * - Status code and status text (with color-coded badge)
 * - Response time
 * - Response headers as key-value list
 * - Optional Copy/Download action buttons
 * 
 * @example
 * ```tsx
 * <ResponseHeadersView
 *   response={response}
 *   onCopy={handleCopy}
 *   onDownload={handleDownload}
 *   showActions={true}
 * />
 * ```
 */

import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Copy, Download } from 'lucide-react';
import { ResponseData } from '../../types/entities';

export interface ResponseHeadersViewProps {
  response: ResponseData | null;
  onCopy?: () => void;
  onDownload?: () => void;
  showActions?: boolean; // Show Copy/Download buttons (default true)
}

export const ResponseHeadersView: React.FC<ResponseHeadersViewProps> = ({
  response,
  onCopy,
  onDownload,
  showActions = true,
}) => {
  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No response data available. Send a request to see response headers.</p>
      </div>
    );
  }

  return (
    <div className="p-3 h-full overflow-auto">
      {/* Header with Status and Actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Response Headers</h3>
          <div className="flex items-center gap-2">
            <Badge 
              variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}
            >
              {response.status} {response.statusText}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {response.time}ms
            </div>
          </div>
        </div>
        
        {showActions && (onCopy || onDownload) && (
          <div className="flex gap-2">
            {onCopy && (
              <Button variant="outline" size="sm" onClick={onCopy}>
                <Copy className="h-4 w-4 mr-1.5" />
                Copy
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Headers List */}
      <div className="bg-muted/50 rounded-md p-2 font-mono text-xs overflow-x-auto">
        {Object.entries(response.headers).length > 0 ? (
          Object.entries(response.headers).map(([key, value]) => (
            <div key={key} className="flex py-1 border-b border-border/50 last:border-0">
              <span className="text-muted-foreground w-48 flex-shrink-0 font-semibold">{key}:</span>
              <span className="ml-1.5 break-all">{value}</span>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground italic">No headers received</div>
        )}
      </div>
    </div>
  );
};


