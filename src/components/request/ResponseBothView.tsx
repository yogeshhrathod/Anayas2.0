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

import { Clock, Copy, Download } from 'lucide-react';
import React from 'react';
import { ResponseData } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MonacoEditor } from '../ui/monaco-editor';
import { ResizableSplitView } from '../ui/resizable-split-view';

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
  if (!response) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0 text-muted-foreground">
        <p>
          No response data available. Send a request to see response details.
        </p>
      </div>
    );
  }

  // Format response body for display
  const formattedBody = response.data
    ? JSON.stringify(response.data, null, 2)
    : '';

  // Left Panel: Headers - Full height scrollable
  const headersPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/50">
        <h4 className="text-sm font-semibold">Headers</h4>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="bg-muted/50 rounded-md p-3 font-mono text-xs">
          {Object.entries(response.headers).length > 0 ? (
            Object.entries(response.headers).map(([key, value]) => (
              <div
                key={key}
                className="flex py-1.5 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground w-36 flex-shrink-0 font-semibold truncate">
                  {key}:
                </span>
                <span className="ml-2 break-all text-xs flex-1">{value}</span>
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
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header with Status and Actions - Fixed height */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold">Response</h3>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                response.status >= 200 && response.status < 300
                  ? 'default'
                  : 'destructive'
              }
              className="text-xs"
            >
              {response.status} {response.statusText}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {response.time}ms
            </div>
          </div>
        </div>

        {(onCopy || onDownload) && (
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
  );
};
