/**
 * ResponseBodyView - Display response body in full-width Monaco editor
 * 
 * Shows:
 * - Response body in Monaco editor (read-only)
 * - Formatted JSON with syntax highlighting
 * - Status badge and response time
 * - Optional Copy/Download action buttons
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
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Copy, Download } from 'lucide-react';
import { MonacoEditor } from '../ui/monaco-editor';
import { ResponseData } from '../../types/entities';

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
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No response data available. Send a request to see response body.</p>
      </div>
    );
  }

  // Format response body for display
  const formattedBody = response.data 
    ? JSON.stringify(response.data, null, 2)
    : '';

  return (
    <div className="flex flex-col h-full">
      {/* Header with Status and Actions */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Response Body</h3>
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
      
      {/* Monaco Editor - Full Width */}
      <div className="flex-1 px-3 pb-3">
        <MonacoEditor
          value={formattedBody}
          onChange={() => {}} // Read-only, no changes
          language="json"
          placeholder="No response body"
          title=""
          description=""
          height={500}
          showActions={false} // No editor actions (we have top-level actions)
          validateJson={false}
          readOnly={true}
          minimap={false}
          fontSize={13}
          className="border-0"
        />
      </div>
    </div>
  );
};

