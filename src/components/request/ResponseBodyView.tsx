/**
 * ResponseBodyView - Display response body in full-width Monaco editor
 *
 * Shows:
 * - Response body in Monaco editor (read-only)
 * - Formatted JSON with syntax highlighting
 * - Status badge and response time
 * - Optional Copy/Download action buttons
 *
 * Features:
 * - Dynamic height: Monaco editor fills available container space
 * - Responsive: Resizes with window/container changes
 * - Postman-like behavior: Editor takes all available vertical space
 *
 * @example
 * ```tsx
 * <ResponseBodyView
 *   response={response}
 *   onCopy={handleCopy}
 *   onDownload={handleDownload}
 *   showActions={true}
 * />
 * ```
 */

import React from 'react';
import { Clock, Copy, Download } from 'lucide-react';
import {
  formatResponseTime,
  getStatusDisplay,
  getStatusVariant,
  safeStringifyBody,
} from '../../lib/response-utils';
import { ResponseData } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MonacoEditor } from '../ui/monaco-editor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export interface ResponseBodyViewProps {
  response: ResponseData | null;
  onCopy?: () => void;
  onDownload?: () => void;
  showActions?: boolean; // Show Copy/Download buttons (default true)
}

export const ResponseBodyView: React.FC<ResponseBodyViewProps> = ({
  response,
  onCopy,
  onDownload,
  showActions = true,
}) => {
  if (!response) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0 text-muted-foreground">
        <p>No response data available. Send a request to see response body.</p>
      </div>
    );
  }

  // Format response body for display (safe for undefined/null)
  const formattedBody = safeStringifyBody(response.data);

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header with Status and Actions - Fixed height */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold">Response Body</h3>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onCopy} className="px-2">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy response body</TooltipContent>
                </Tooltip>
              )}
              {onDownload && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onDownload} className="px-2">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download response</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* Monaco Editor - Dynamic height, fills remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <MonacoEditor
            value={formattedBody}
            onChange={() => {}} // Read-only, no changes
            language="json"
            placeholder="No response body"
            title=""
            description=""
            height="100%"
            showActions={false} // No editor actions (we have top-level actions)
            validateJson={false}
            readOnly={true}
            minimap={false}
            fontSize={13}
            className="border-0"
            automaticLayout={true}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};
