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

import { Key, Plus } from 'lucide-react';
import React from 'react';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import { RequestFormData } from '../../types/forms';
import { Button } from '../ui/button';
import { HeadersKeyValueEditor } from '../ui/headers-key-value-editor';
import { MonacoEditor } from '../ui/monaco-editor';

export interface HeadersTabProps {
  requestData: RequestFormData;
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
  headersViewMode: 'table' | 'json';
  setHeadersViewMode: (mode: 'table' | 'json') => void;
  bulkEditJson: string;
  setBulkEditJson: (json: string) => void;
}

import { Braces, ShieldCheck, Table2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

export interface HeadersTabProps {
  requestData: RequestFormData;
  setRequestData: (
    data: RequestFormData | ((prev: RequestFormData) => RequestFormData)
  ) => void;
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
  setBulkEditJson,
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
        showError(
          'Invalid JSON',
          'Please fix JSON syntax errors before switching to table view'
        );
        return;
      }
    }
    setHeadersViewMode(headersViewMode === 'table' ? 'json' : 'table');
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Premium Header Area */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
              <Key className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                HTTP Headers
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </h3>
              <p className="text-[11px] text-muted-foreground/80 font-medium">
                Configure request headers and metadata
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented View Toggle */}
            <div className="flex p-1 bg-muted/40 rounded-xl border border-border/20 shadow-inner">
              <button
                onClick={() => headersViewMode !== 'table' && toggleHeadersView()}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-300',
                  headersViewMode === 'table'
                    ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Table2 className="h-3.5 w-3.5" />
                Table
              </button>
              <button
                onClick={() => headersViewMode !== 'json' && toggleHeadersView()}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-300',
                  headersViewMode === 'json'
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
                    const newHeaders = { ...requestData.headers, '': '' };
                    setRequestData({ ...requestData, headers: newHeaders });
                  }}
                  className="h-9 w-9 p-0 rounded-xl border border-border/40 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-300 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="font-bold text-[10px]">Add header</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content Area - Card with Glassmorphism */}
        <div className="flex-1 min-h-0 bg-background/40 backdrop-blur-sm rounded-2xl border border-border/40 shadow-xl shadow-black/5 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:border-border/60">
          {headersViewMode === 'table' ? (
            <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent p-4">
              <HeadersKeyValueEditor
                headers={requestData.headers}
                onChange={headers => setRequestData({ ...requestData, headers })}
                placeholder={{ key: 'Header Name', value: 'Header Value' }}
              />
              
              {Object.keys(requestData.headers).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 py-10 opacity-60">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center">
                    <Key className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">No headers</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <MonacoEditor
                value={bulkEditJson}
                onChange={value => setBulkEditJson(value)}
                language="json"
                placeholder='{"Content-Type": "application/json"}'
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
