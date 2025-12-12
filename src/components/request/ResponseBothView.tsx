/**
 * ResponseBothView - Side-by-side split view with headers (left) and body (right)
 *
 * Shows:
 * - Left panel: Response headers
 * - Right panel: Response body in Monaco editor
 * - Resizable divider (50/50 default, adjustable)
 * - Status badge and response time at top
 * - Single Copy/Download action buttons at top
 *
 * Features:
 * - Dynamic height: Monaco editor fills available container space
 * - Responsive: Resizes with window/container changes
 * - Postman-like behavior: Both panels take full available height
 *
 * @example
 * ```tsx
 * <ResponseBothView
 *   response={response}
 *   onCopy={handleCopy}
 *   onDownload={handleDownload}
 *   splitRatio={50}
 *   onSplitRatioChange={setSplitRatio}
 * />
 * ```
 */

import React, { useState } from 'react';
import { Clock, Copy, Download, Check } from 'lucide-react';
import {
  formatResponseTime,
  getHeaderEntries,
  getStatusDisplay,
  getStatusVariant,
  hasHeaders,
  safeStringifyBody,
} from '../../lib/response-utils';
import { ResponseData } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MonacoEditor } from '../ui/monaco-editor';
import { ResizableSplitView } from '../ui/resizable-split-view';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export interface ResponseBothViewProps {
  response: ResponseData | null;
  onCopy?: () => void;
  onDownload?: () => void;
  splitRatio: number; // Current split ratio (0-100)
  onSplitRatioChange: (ratio: number) => void; // Ratio change handler
}

export const ResponseBothView: React.FC<ResponseBothViewProps> = ({
  response,
  onCopy,
  onDownload,
  splitRatio,
  onSplitRatioChange,
}) => {
  const [copiedHeaderKey, setCopiedHeaderKey] = useState<string | null>(null);

  const handleCopyHeader = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(`${key}: ${value}`);
      setCopiedHeaderKey(key);
      setTimeout(() => setCopiedHeaderKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy header:', err);
    }
  };

  if (!response) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0 text-muted-foreground">
        <p>
          No response data available. Send a request to see response details.
        </p>
      </div>
    );
  }

  // Format response body for display (safe for undefined/null)
  const formattedBody = safeStringifyBody(response.data);

  // Get header entries safely
  const headerEntries = getHeaderEntries(response.headers);

  // Left Panel: Headers - Full height scrollable
  const headersPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/50">
        <h4 className="text-sm font-semibold">Headers</h4>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="bg-muted/50 rounded-md p-3 font-mono text-xs">
          {hasHeaders(response.headers) ? (
            headerEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0 group"
              >
                <span className="text-muted-foreground w-36 flex-shrink-0 font-semibold truncate">
                  {key}:
                </span>
                <span className="ml-2 break-all text-xs flex-1">
                  {value ?? ''}
                </span>
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
            <div className="text-muted-foreground italic">No headers</div>
          )}
        </div>
      </div>
    </div>
  );

  // Right Panel: Body - Full height Monaco editor
  const bodyPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/50">
        <h4 className="text-sm font-semibold">Body</h4>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <MonacoEditor
          value={formattedBody}
          onChange={() => {}} // Read-only
          language="json"
          placeholder="No response body"
          title=""
          description=""
          height="100%"
          showActions={false}
          validateJson={false}
          readOnly={true}
          minimap={false}
          fontSize={12}
          className="border-0"
          automaticLayout={true}
        />
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header with Status and Actions - Fixed height */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold">Response</h3>
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
                    <Button variant="outline" size="sm" onClick={onCopy} className="px-2">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy response</TooltipContent>
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

        {/* Split View: Headers (left) | Body (right) - Fills remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ResizableSplitView
            left={headersPanel}
            right={bodyPanel}
            initialRatio={splitRatio}
            onRatioChange={onSplitRatioChange}
            minRatio={20}
            maxRatio={80}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};
