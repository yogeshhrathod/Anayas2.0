/**
 * BodyTab - Request body with multiple formats
 * 
 * Handles request body configuration with:
 * - Multiple body types (none, raw, form-data, url-encoded)
 * - Table/JSON view toggle for raw content
 * - Form data editing
 * - Content type selection
 * 
 * @example
 * ```tsx
 * <BodyTab
 *   requestData={requestData}
 *   setRequestData={setRequestData}
 *   bodyType={bodyType}
 *   setBodyType={setBodyType}
 *   bodyContentType={bodyContentType}
 *   setBodyContentType={setBodyContentType}
 *   bodyViewMode={bodyViewMode}
 *   setBodyViewMode={setBodyViewMode}
 *   bodyFormData={bodyFormData}
 *   setBodyFormData={setBodyFormData}
 * />
 * ```
 */

import React from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FileText, Plus } from 'lucide-react';
import { KeyValueEditor } from '../ui/key-value-editor';
import { MonacoEditor } from '../ui/monaco-editor';
import { ViewToggleButton } from '../ui/view-toggle-button';
import { RequestFormData } from '../../types/forms';

export interface BodyTabProps {
  requestData: RequestFormData;
  setRequestData: (data: RequestFormData | ((prev: RequestFormData) => RequestFormData)) => void;
  bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded';
  setBodyType: (type: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded') => void;
  bodyContentType: 'json' | 'text';
  setBodyContentType: (type: 'json' | 'text') => void;
  bodyViewMode: 'table' | 'json';
  setBodyViewMode: (mode: 'table' | 'json') => void;
  bodyFormData: Array<{ key: string; value: string; enabled: boolean }>;
  setBodyFormData: (data: Array<{ key: string; value: string; enabled: boolean }>) => void;
}

export const BodyTab: React.FC<BodyTabProps> = ({
  requestData,
  setRequestData,
  bodyType,
  setBodyType,
  bodyContentType,
  setBodyContentType,
  bodyViewMode,
  setBodyViewMode,
  bodyFormData,
  setBodyFormData
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Request Body
          </h3>
          <p className="text-xs text-muted-foreground">
            Define the request payload
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Body Type Dropdown */}
          <Select value={bodyType} onValueChange={(value: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded') => setBodyType(value)}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-muted-foreground">None</SelectItem>
              <SelectItem value="raw" className="text-blue-600">Raw</SelectItem>
              <SelectItem value="form-data" className="text-green-600">Form Data</SelectItem>
              <SelectItem value="x-www-form-urlencoded" className="text-purple-600">URL Encoded</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Format Dropdown - Only visible when bodyType === 'raw' */}
          {bodyType === 'raw' && (
            <Select value={bodyContentType} onValueChange={(value: 'json' | 'text') => setBodyContentType(value)}>
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {/* Action Buttons - Conditional based on body type */}
          {bodyType !== 'none' && (
            <div className="flex gap-1">
              {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded' || (bodyType === 'raw' && bodyViewMode === 'table')) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBodyFormData([...bodyFormData, { key: '', value: '', enabled: true }])}
                  className="h-7 w-7 p-0"
                  title="Add Field"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              {bodyType === 'raw' && (
                <ViewToggleButton
                  currentView={bodyViewMode}
                  onToggle={() => setBodyViewMode(bodyViewMode === 'table' ? 'json' : 'table')}
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Conditional Content Rendering based on bodyType */}
      {bodyType === 'none' ? (
        <div className="border rounded-md bg-card">
          <div className="text-center py-8 text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No body data</p>
            <p className="text-xs mt-1">Select a body type to add content</p>
          </div>
        </div>
      ) : (
        <div className="border rounded-md bg-card">
          {bodyType === 'raw' ? (
            // Raw mode: Show table/JSON toggle
            bodyViewMode === 'table' ? (
              <div className="p-3">
                <KeyValueEditor
                  items={bodyFormData}
                  onChange={setBodyFormData}
                  placeholder={{ key: 'Field Name', value: 'Field Value' }}
                  showEnabled={true}
                />
              </div>
            ) : (
              <MonacoEditor
                value={requestData.body}
                onChange={(value) => setRequestData({ ...requestData, body: value })}
                language={bodyContentType}
                placeholder={bodyContentType === 'json' ? '{"key": "value"}' : 'Enter text content'}
                title=""
                description=""
                height={200}
                showActions={true}
                validateJson={bodyContentType === 'json'}
                readOnly={false}
                minimap={false}
                fontSize={13}
                className="border-0"
              />
            )
          ) : (
            // Form Data and URL Encoded: Show table view only
            <div className="p-3">
              <KeyValueEditor
                items={bodyFormData}
                onChange={setBodyFormData}
                placeholder={{ 
                  key: bodyType === 'form-data' ? 'Field Name' : 'Parameter Name', 
                  value: bodyType === 'form-data' ? 'Field Value' : 'Parameter Value' 
                }}
                showEnabled={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
