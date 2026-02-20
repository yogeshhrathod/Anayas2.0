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

import { Plus } from 'lucide-react';
import React from 'react';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import { RequestFormData } from '../../types/forms';
import { Button } from '../ui/button';
import { KeyValueEditor } from '../ui/key-value-editor';
import { MonacoEditor } from '../ui/monaco-editor';

export interface ParamsTabProps {
  requestData: RequestFormData;
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
  paramsViewMode: 'table' | 'json';
  setParamsViewMode: (mode: 'table' | 'json') => void;
  bulkEditJson: string;
  setBulkEditJson: (json: string) => void;
}

import { Braces, Sparkles, Table2, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

export interface ParamsTabProps {
  requestData: RequestFormData;
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
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
  setBulkEditJson,
}) => {
  const { showError } = useToastNotifications();

  const toggleParamsView = () => {
    if (paramsViewMode === 'table') {
      const jsonData = requestData.queryParams.reduce(
        (acc, param) => {
          if (param.key && param.value) {
            acc[param.key] = param.value;
          }
          return acc;
        },
        {} as Record<string, string>
      );
      setBulkEditJson(JSON.stringify(jsonData, null, 2));
    } else {
      try {
        const parsed = JSON.parse(bulkEditJson);
        const newParams = Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value),
          enabled: true,
        }));
        setRequestData({ ...requestData, queryParams: newParams });
      } catch (e: any) {
        showError(
          'Invalid JSON',
          'Please fix JSON syntax errors before switching to table view'
        );
        return;
      }
    }
    setParamsViewMode(paramsViewMode === 'table' ? 'json' : 'table');
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Premium Header Area */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm shadow-amber-500/5">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                Query Parameters
                <Sparkles className="h-3 w-3 text-amber-400" />
              </h3>
              <p className="text-[11px] text-muted-foreground/80 font-medium">
                Add dynamic parameters to your request URL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented View Toggle */}
            <div className="flex p-1 bg-muted/40 rounded-xl border border-border/20 shadow-inner">
              <button
                onClick={() => paramsViewMode !== 'table' && toggleParamsView()}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-300',
                  paramsViewMode === 'table'
                    ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Table2 className="h-3.5 w-3.5" />
                Table
              </button>
              <button
                onClick={() => paramsViewMode !== 'json' && toggleParamsView()}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-300',
                  paramsViewMode === 'json'
                    ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Braces className="h-3.5 w-3.5" />
                Bulk
              </button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newParams = [
                      ...requestData.queryParams,
                      { key: '', value: '', enabled: true },
                    ];
                    setRequestData({ ...requestData, queryParams: newParams });
                  }}
                  className="h-9 w-9 p-0 rounded-xl border border-border/40 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-300 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="font-bold text-[10px]">Add query parameter</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content Area - Card with Glassmorphism */}
        <div className="flex-1 min-h-0 bg-background/40 backdrop-blur-sm rounded-2xl border border-border/40 shadow-xl shadow-black/5 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:border-border/60">
          {paramsViewMode === 'table' ? (
            <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent p-4 custom-transition-group">
              <KeyValueEditor
                items={requestData.queryParams}
                onChange={items =>
                  setRequestData({ ...requestData, queryParams: items })
                }
                placeholder={{ key: 'Parameter name', value: 'Parameter value' }}
                showEnabled={true}
              />
              
              {requestData.queryParams.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 py-10 opacity-60">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center">
                    <Zap className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">No parameters</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <MonacoEditor
                value={bulkEditJson}
                onChange={value => setBulkEditJson(value)}
                language="json"
                placeholder='{"key": "value"}'
                title=""
                description=""
                height="100%"
                showActions={false}
                validateJson={true}
                readOnly={false}
                minimap={false}
                fontSize={13}
                className="border-0"
                automaticLayout={true}
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
