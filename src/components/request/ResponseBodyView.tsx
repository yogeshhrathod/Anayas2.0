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

import { Clock, Copy, Download } from 'lucide-react';
import React from 'react';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

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
        {showActions && (
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

            {(onCopy || onDownload) && (
              <div className="flex gap-2">
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
                    <TooltipContent>Copy response body</TooltipContent>
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
          </div>
        )}

        {/* Monaco Editor or Error View - Dynamic height, fills remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {response.status === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-16 w-16 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Badge variant="destructive" className="h-8 w-8 px-0 rounded-full flex items-center justify-center">!</Badge>
              </div>
              <h2 className="text-xl font-bold text-destructive mb-2">Request Failed</h2>
              <div className="max-w-md bg-muted/30 p-4 rounded-lg border border-border/40 text-sm font-medium text-muted-foreground whitespace-pre-wrap break-words mb-6">
                {response.statusText || 'Unable to reach the server. Please check the URL and your network connection.'}
              </div>
              <p className="text-xs text-muted-foreground max-w-sm">
                If the server uses a self-signed certificate, ensure <strong>SSL Verification</strong> is disabled in settings.
              </p>
            </div>
          ) : (
            <MonacoEditor
              value={formattedBody}
              onChange={() => {}} // Read-only, no changes
              language={Object.entries(response.headers).find(([k]) => k.toLowerCase() === 'content-type')?.[1].includes('html') ? 'html' : 'json'}
              placeholder="No response body"
              title=""
              description=""
              height="100%"
              showActions={true} // No editor actions (we have top-level actions)
              validateJson={false}
              readOnly={true}
              minimap={false}
              fontSize={13}
              className="border-0"
              automaticLayout={true}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
