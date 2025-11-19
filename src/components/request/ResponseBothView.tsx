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

import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Copy, Download } from 'lucide-react';
import { ResizableSplitView } from '../ui/resizable-split-view';
import { MonacoEditor } from '../ui/monaco-editor';
import { ResponseData } from '../../types/entities';

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
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No response data available. Send a request to see response details.</p>
      </div>
    );
  }

  // Format response body for display
  const formattedBody = response.data 
    ? JSON.stringify(response.data, null, 2)
    : '';

  // Left Panel: Headers
  const headersPanel = (
    <div className="p-3 h-full overflow-auto">
      <h4 className="text-sm font-semibold mb-2">Headers</h4>
      <div className="bg-muted/50 rounded-md p-2 font-mono text-xs overflow-x-auto">
        {Object.entries(response.headers).length > 0 ? (
          Object.entries(response.headers).map(([key, value]) => (
            <div key={key} className="flex py-1 border-b border-border/50 last:border-0">
              <span className="text-muted-foreground w-40 flex-shrink-0 font-semibold">{key}:</span>
              <span className="ml-1.5 break-all text-xs">{value}</span>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground italic">No headers</div>
        )}
      </div>
    </div>
  );

  // Right Panel: Body
  const bodyPanel = (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-3 pt-3 pb-1.5">
        <h4 className="text-sm font-semibold">Body</h4>
      </div>
      <div className="px-3 pb-3">
        <MonacoEditor
          value={formattedBody}
          onChange={() => {}} // Read-only
          language="json"
          placeholder="No response body"
          title=""
          description=""
          height={400}
          showActions={false}
          validateJson={false}
          readOnly={true}
          minimap={false}
          fontSize={12}
          className="border-0"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with Status and Actions */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Response</h3>
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
        
        {(onCopy || onDownload) && (
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
      
      {/* Split View: Headers (left) | Body (right) */}
      <div className="flex-1 overflow-hidden">
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

