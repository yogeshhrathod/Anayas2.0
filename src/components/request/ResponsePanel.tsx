/**
 * ResponsePanel - Response display with headers and body
 * 
 * Displays API response data with:
 * - Status code and response time
 * - Response headers
 * - Response body with syntax highlighting
 * - Copy and download actions
 * 
 * @example
 * ```tsx
 * <ResponsePanel
 *   response={response}
 *   onCopy={handleCopyResponse}
 *   onDownload={handleDownloadResponse}
 * />
 * ```
 */

import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Copy, Download } from 'lucide-react';
import { MonacoEditor } from '../ui/monaco-editor';
import { ResponseData } from '../../types/entities';

export interface ResponsePanelProps {
  response: ResponseData | null;
  onCopy: () => void;
  onDownload: () => void;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  response,
  onCopy,
  onDownload
}) => {
  if (!response) return null;

  return (
    <div className="border-t border-border/50 bg-card/30">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Response</h3>
            <div className="flex items-center gap-2">
              <Badge variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}>
                {response.status} {response.statusText}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {response.time}ms
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Headers</h4>
            <div className="bg-muted/50 rounded-md p-3 font-mono text-xs overflow-x-auto">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="text-muted-foreground w-48 flex-shrink-0">{key}:</span>
                  <span className="ml-2">{value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Body</h4>
            <MonacoEditor
              value={JSON.stringify(response.data, null, 2)}
              onChange={() => {}}
              language="json"
              placeholder="No response body"
              title=""
              description=""
              height={300}
              showActions={false}
              validateJson={false}
              readOnly={true}
              minimap={false}
              fontSize={13}
              className="border rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
