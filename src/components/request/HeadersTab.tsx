/**
 * HeadersTab - HTTP headers with table/JSON toggle
 */

import { Key, Plus, Table2, Braces } from 'lucide-react';
import React from 'react';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import { RequestFormData } from '../../types/forms';
import { Button } from '../ui/button';
import { HeadersKeyValueEditor } from '../ui/headers-key-value-editor';
import { MonacoEditor } from '../ui/monaco-editor';
import { cn } from '../../lib/utils';

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
    <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Refined Header Area */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Key className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-[13px] font-extrabold tracking-tight uppercase text-foreground/80">
            HTTP Headers
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex p-1 bg-muted/40 rounded-xl border border-border/20 shadow-inner">
            <button
              onClick={() => headersViewMode !== 'table' && toggleHeadersView()}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-300',
                headersViewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Table2 className="h-3.5 w-3.5" />
              TABLE
            </button>
            <button
              onClick={() => headersViewMode !== 'json' && toggleHeadersView()}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-300',
                headersViewMode === 'json'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Braces className="h-3.5 w-3.5" />
              BULK
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newHeaders = { ...requestData.headers, '': '' };
              setRequestData({ ...requestData, headers: newHeaders });
            }}
            className="h-9 w-9 p-0 rounded-xl border-border/40 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
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
              showActions={true}
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
  );
};
