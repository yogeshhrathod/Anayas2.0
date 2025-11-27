/**
 * ParamsTab - Query parameters with table/JSON toggle
 * 
 * Handles query parameters configuration with:
 * - Table view for key-value editing
 * - JSON view for bulk editing
 * - Add/remove parameter functionality
 * - View mode toggle
 * 
 * @example
 * ```tsx
 * <ParamsTab
 *   requestData={requestData}
 *   setRequestData={setRequestData}
 *   paramsViewMode={paramsViewMode}
 *   setParamsViewMode={setParamsViewMode}
 *   bulkEditJson={bulkEditJson}
 *   setBulkEditJson={setBulkEditJson}
 *   onToggleView={toggleParamsView}
 * />
 * ```
 */

import React from 'react';
import { Button } from '../ui/button';
import { Settings, Plus } from 'lucide-react';
import { KeyValueEditor } from '../ui/key-value-editor';
import { MonacoEditor } from '../ui/monaco-editor';
import { ViewToggleButton } from '../ui/view-toggle-button';
import { RequestFormData } from '../../types/forms';
import { useToastNotifications } from '../../hooks/useToastNotifications';

export interface ParamsTabProps {
  requestData: RequestFormData;
  setRequestData: (data: RequestFormData | ((prev: RequestFormData) => RequestFormData)) => void;
  paramsViewMode: 'table' | 'json';
  setParamsViewMode: (mode: 'table' | 'json') => void;
  bulkEditJson: string;
  setBulkEditJson: (json: string) => void;
}

export const ParamsTab: React.FC<ParamsTabProps> = ({
  requestData,
  setRequestData,
  paramsViewMode,
  setParamsViewMode,
  bulkEditJson,
  setBulkEditJson
}) => {
  const { showError } = useToastNotifications();

  const toggleParamsView = () => {
    if (paramsViewMode === 'table') {
      const jsonData = requestData.queryParams.reduce((acc, param) => {
        if (param.key && param.value) {
          acc[param.key] = param.value;
        }
        return acc;
      }, {} as Record<string, string>);
      setBulkEditJson(JSON.stringify(jsonData, null, 2));
    } else {
      try {
        const parsed = JSON.parse(bulkEditJson);
        const newParams = Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value),
          enabled: true
        }));
        setRequestData({ ...requestData, queryParams: newParams });
      } catch (_e: unknown) {
        showError('Invalid JSON', 'Please fix JSON syntax errors before switching to table view');
        return;
      }
    }
    setParamsViewMode(paramsViewMode === 'table' ? 'json' : 'table');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Query Parameters
          </h3>
          <p className="text-xs text-muted-foreground">
            Add query parameters to your request URL
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newParams = [...requestData.queryParams, { key: '', value: '', enabled: true }];
              setRequestData({ ...requestData, queryParams: newParams });
            }}
            className="h-7 w-7 p-0"
            title="Add Parameter"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <ViewToggleButton
            currentView={paramsViewMode}
            onToggle={toggleParamsView}
          />
        </div>
      </div>
      
      <div className="border rounded-md bg-card">
        {paramsViewMode === 'table' ? (
          <div className="p-3">
            <KeyValueEditor
              items={requestData.queryParams}
              onChange={(items) => setRequestData({ ...requestData, queryParams: items })}
              placeholder={{ key: 'Parameter name', value: 'Parameter value' }}
              showEnabled={true}
            />
          </div>
        ) : (
          <MonacoEditor
            value={bulkEditJson}
            onChange={(value) => setBulkEditJson(value)}
            language="json"
            placeholder='{"key": "value"}'
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
