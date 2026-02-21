/**
 * BodyTab - Request body with multiple formats
 *
 * Handles request body configuration with:
 * - Multiple body types (none, raw, form-data, url-encoded)
 * - Table/JSON view toggle for raw content
 * - Form data editing
 * - Content type selection
 *
 * Features:
 * - Dynamic height: Monaco editor fills available container space
 * - Responsive: Resizes with window/container changes
 * - Postman-like behavior: Editor takes all available vertical space
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

import { Plus } from 'lucide-react';
import React from 'react';
import { RequestFormData } from '../../types/forms';
import { Button } from '../ui/button';
import { KeyValueEditor } from '../ui/key-value-editor';
import { MonacoEditor } from '../ui/monaco-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

export interface BodyTabProps {
  requestData: RequestFormData;
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
  bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded';
  setBodyType: (
    type: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded'
  ) => void;
  bodyContentType: 'json' | 'text';
  setBodyContentType: (type: 'json' | 'text') => void;
  bodyViewMode: 'table' | 'json';
  setBodyViewMode: (mode: 'table' | 'json') => void;
  bodyFormData: Array<{ key: string; value: string; enabled: boolean }>;
  setBodyFormData: (
    data: Array<{ key: string; value: string; enabled: boolean }>
  ) => void;
}

import { Ban, Braces, Code, Layers, Sparkles, Table2 } from 'lucide-react';
import logger from '../../lib/logger';
import { cn } from '../../lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

export interface BodyTabProps {
  requestData: RequestFormData;
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
  bodyType: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded';
  setBodyType: (
    type: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded'
  ) => void;
  bodyContentType: 'json' | 'text';
  setBodyContentType: (type: 'json' | 'text') => void;
  bodyViewMode: 'table' | 'json';
  setBodyViewMode: (mode: 'table' | 'json') => void;
  bodyFormData: Array<{ key: string; value: string; enabled: boolean }>;
  setBodyFormData: (
    data: Array<{ key: string; value: string; enabled: boolean }>
  ) => void;
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
  setBodyFormData,
}) => {
  // Sync data when toggling between table and JSON views
  const handleViewToggle = () => {
    if (bodyViewMode === 'table') {
      const jsonObj: Record<string, string> = {};
      bodyFormData.forEach(item => {
        if (item.enabled && item.key.trim()) {
          jsonObj[item.key] = item.value;
        }
      });
      const jsonString = JSON.stringify(jsonObj, null, 2);
      setRequestData({ ...requestData, body: jsonString });
      setBodyViewMode('json');
    } else {
      try {
        const parsed = JSON.parse(requestData.body || '{}');
        const newFormData = Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value),
          enabled: true,
        }));
        if (newFormData.length === 0) {
          newFormData.push({ key: '', value: '', enabled: true });
        }
        setBodyFormData(newFormData);
        setBodyViewMode('table');
      } catch (e) {
        logger.warn('Failed to parse JSON body for table view', { error: e });
        setBodyViewMode('table');
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 min-h-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Premium Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm shadow-blue-500/5">
              <Code className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                Request Body
                <Sparkles className="h-3 w-3 text-blue-400" />
              </h3>
              <p className="text-[11px] text-muted-foreground/80 font-medium">
                Define the payload for your request
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Body Type Select - Polished */}
            <Select
              value={bodyType}
              onValueChange={(value: any) => setBodyType(value)}
            >
              <SelectTrigger className="w-36 h-9 rounded-xl border-border/40 bg-muted/20 text-xs font-bold transition-all hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-blue-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                <SelectItem value="none" className="text-xs font-medium">None</SelectItem>
                <SelectItem value="raw" className="text-xs font-medium text-blue-500 focus:text-blue-600">Raw</SelectItem>
                <SelectItem value="form-data" className="text-xs font-medium text-green-500 focus:text-green-600">Form Data</SelectItem>
                <SelectItem value="x-www-form-urlencoded" className="text-xs font-medium text-purple-500 focus:text-purple-600">URL Encoded</SelectItem>
              </SelectContent>
            </Select>

            {/* Content Type Select - Raw only */}
            {bodyType === 'raw' && (
              <Select
                value={bodyContentType}
                onValueChange={(value: any) => setBodyContentType(value)}
              >
                <SelectTrigger className="w-24 h-9 rounded-xl border-border/40 bg-muted/20 text-xs font-bold transition-all hover:bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                  <SelectItem value="json" className="text-xs font-medium uppercase tracking-tighter">JSON</SelectItem>
                  <SelectItem value="text" className="text-xs font-medium uppercase tracking-tighter">Text</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Sub-actions */}
            {bodyType !== 'none' && (
              <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/20 shadow-inner">
                {bodyType === 'raw' && (
                  <div className="flex gap-1 p-0.5">
                    <button
                      onClick={() => bodyViewMode !== 'table' && handleViewToggle()}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-lg transition-all duration-300',
                        bodyViewMode === 'table'
                          ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Table2 className="h-3.5 w-3.5" />
                      Table
                    </button>
                    <button
                      onClick={() => bodyViewMode !== 'json' && handleViewToggle()}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-lg transition-all duration-300',
                        bodyViewMode === 'json'
                          ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Braces className="h-3.5 w-3.5" />
                      Bulk
                    </button>
                  </div>
                )}
                
                {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded' || (bodyType === 'raw' && bodyViewMode === 'table')) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setBodyFormData([
                            ...bodyFormData,
                            { key: '', value: '', enabled: true },
                          ])
                        }
                        className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="font-bold text-[10px]">Add field</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Area - Card with Glassmorphism */}
        <div className="flex-1 min-h-0 bg-background/40 backdrop-blur-sm rounded-2xl border border-border/40 shadow-xl shadow-black/5 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:border-border/60">
          {bodyType === 'none' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 gap-4 py-20 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-border/40 flex items-center justify-center bg-muted/5">
                <Ban className="h-10 w-10 opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.2em]">No Body Data</p>
                <p className="text-[11px] font-medium opacity-60 mt-1">Select a body type from the dropdown above</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              {bodyType === 'raw' && bodyViewMode === 'json' ? (
                <MonacoEditor
                  value={requestData.body}
                  onChange={value => setRequestData({ ...requestData, body: value })}
                  language={bodyContentType}
                  placeholder={bodyContentType === 'json' ? '{"key": "value"}' : 'Enter text content'}
                  title=""
                  description=""
                  height="100%"
                  showActions={false}
                  validateJson={bodyContentType === 'json'}
                  readOnly={false}
                  minimap={false}
                  fontSize={13}
                  className="border-0"
                  automaticLayout={true}
                />
              ) : (
                <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent p-4">
                  <KeyValueEditor
                    items={bodyFormData}
                    onChange={setBodyFormData}
                    placeholder={{
                      key: bodyType === 'form-data' ? 'Field Name' : 'Parameter Name',
                      value: bodyType === 'form-data' ? 'Field Value' : 'Parameter Value',
                    }}
                    showEnabled={true}
                  />
                  {bodyFormData.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-3 py-10 opacity-60">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center">
                        <Plus className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest">Add first field</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
