/**
 * HeadersTab - HTTP headers with table/JSON toggle
 * 
 * Handles HTTP headers configuration with:
 * - Table view for key-value editing
 * - JSON view for bulk editing
 * - Add/remove header functionality
 * - View mode toggle
 * 
 * @example
 * ```tsx
 * <HeadersTab
 *   requestData={requestData}
 *   setRequestData={setRequestData}
 *   headersViewMode={headersViewMode}
 *   setHeadersViewMode={setHeadersViewMode}
 *   bulkEditJson={bulkEditJson}
 *   setBulkEditJson={setBulkEditJson}
 *   onToggleView={toggleHeadersView}
 * />
 * ```
 */

import React from 'react';
import { Button } from '../ui/button';
import { Key, Plus } from 'lucide-react';
import { HeadersKeyValueEditor } from '../ui/headers-key-value-editor';
import { MonacoEditor } from '../ui/monaco-editor';
import { ViewToggleButton } from '../ui/view-toggle-button';
import { RequestFormData } from '../../types/forms';
import { useToastNotifications } from '../../hooks/useToastNotifications';

export interface HeadersTabProps {
  requestData: RequestFormData;
  setRequestData: (data: RequestFormData | ((prev: RequestFormData) => RequestFormData)) => void;
  headersViewMode: 'table' | 'json';
  setHeadersViewMode: (mode: 'table' | 'json') => void;
  bulkEditJson: string;
  setBulkEditJson: (json: string) => void;
}

export const HeadersTab: React.FC<HeadersTabProps> = ({
  requestData,
  setRequestData,
  headersViewMode,
  setHeadersViewMode,
  bulkEditJson,
  setBulkEditJson
}) => {
  const { showError } = useToastNotifications();

  const toggleHeadersView = () => {
    if (headersViewMode === 'table') {
      setBulkEditJson(JSON.stringify(requestData.headers, null, 2));
    } else {
      try {
        const parsed = JSON.parse(bulkEditJson);
        setRequestData({ ...requestData, headers: parsed });
      } catch (e: any) {
        showError('Invalid JSON', 'Please fix JSON syntax errors before switching to table view');
        return;
      }
    }
    setHeadersViewMode(headersViewMode === 'table' ? 'json' : 'table');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            HTTP Headers
          </h3>
          <p className="text-xs text-muted-foreground">
            Add HTTP headers to your request
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newHeaders = { ...requestData.headers, '': '' };
              setRequestData({ ...requestData, headers: newHeaders });
            }}
            className="h-7 w-7 p-0"
            title="Add Header"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <ViewToggleButton
            currentView={headersViewMode}
            onToggle={toggleHeadersView}
          />
        </div>
      </div>
      
      <div className="border rounded-md bg-card">
        {headersViewMode === 'table' ? (
          <div className="p-3">
            <HeadersKeyValueEditor
              headers={requestData.headers}
              onChange={(headers) => setRequestData({ ...requestData, headers })}
              placeholder={{ key: 'Header Name', value: 'Header Value' }}
            />
          </div>
        ) : (
          <MonacoEditor
            value={bulkEditJson}
            onChange={(value) => setBulkEditJson(value)}
            language="json"
            placeholder='{"Content-Type": "application/json"}'
            title=""
            description=""
            height={200}
            showActions={true}
            validateJson={true}
            readOnly={false}
            minimap={false}
            fontSize={13}
            className="border-0"
          />
        )}
      </div>
    </div>
  );
};
