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

import { Clock, Copy, Download } from 'lucide-react';
import React from 'react';
import {
  formatResponseTime,
  getHeaderEntries,
  getStatusDisplay,
  getStatusVariant,
  hasHeaders,
} from '../../lib/response-utils';
import { ResponseData } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

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
      <div className="flex items-center justify-center flex-1 min-h-0 text-muted-foreground">
        <p>
          No response data available. Send a request to see response headers.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header with Status and Actions - Fixed height */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold">Response Headers</h3>
          <div className="flex items-center gap-2">
            <Badge
              variant={getStatusVariant(response.status)}
              className="text-xs"
            >
              {getStatusDisplay(response.status)}{' '}
              {response.statusText ?? 'Unknown'}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatResponseTime(response.time)}
            </div>
          </div>
        </div>

        {showActions && (onCopy || onDownload) && (
          <div className="flex gap-2">
            {onCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="h-7 text-xs"
              >
                <Copy className="h-3 w-3 mr-1.5" />
                Copy
              </Button>
            )}
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-7 text-xs"
              >
                <Download className="h-3 w-3 mr-1.5" />
                Download
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Headers List - Fills remaining space and scrolls */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="bg-muted/50 rounded-md p-3 font-mono text-xs">
          {hasHeaders(response.headers) ? (
            getHeaderEntries(response.headers).map(([key, value]: [string, string]) => (
              <div
                key={key}
                className="flex py-1.5 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground w-44 flex-shrink-0 font-semibold truncate">
                  {key}:
                </span>
                <span className="ml-2 break-all flex-1">{value ?? ''}</span>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground italic">
              No headers received
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
