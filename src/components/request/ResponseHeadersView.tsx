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

import { Check, Clock, Copy, Download } from 'lucide-react';
import React, { useState } from 'react';
import logger from '../../lib/logger';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

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
  const [copiedHeaderKey, setCopiedHeaderKey] = useState<string | null>(null);

  const handleCopyHeader = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(`${key}: ${value}`);
      setCopiedHeaderKey(key);
      setTimeout(() => setCopiedHeaderKey(null), 2000);
    } catch (err) {
      logger.error('Failed to copy response header', { error: err });
    }
  };

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
    <TooltipProvider>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header with Status and Actions - Fixed height */}
        {showActions && (
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
          </div>
        )}

        {showActions && (onCopy || onDownload) && (
          <div className="flex gap-2 px-4 py-2 border-b border-border/50">
            {onCopy && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCopy}
                    className="px-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy all headers</TooltipContent>
              </Tooltip>
            )}
            {onDownload && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownload}
                    className="px-2"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download response</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Headers List - Fills remaining space and scrolls */}
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <div className="bg-muted/50 rounded-md p-3 font-mono text-xs">
            {hasHeaders(response.headers) ? (
              getHeaderEntries(response.headers).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0 group"
                >
                  <span className="text-muted-foreground w-44 flex-shrink-0 font-semibold truncate">
                    {key}:
                  </span>
                  <span className="ml-2 break-all flex-1">{value ?? ''}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleCopyHeader(key, value ?? '')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                        aria-label={`Copy ${key} header`}
                      >
                        {copiedHeaderKey === key ? (
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Copy header</TooltipContent>
                  </Tooltip>
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
    </TooltipProvider>
  );
};
