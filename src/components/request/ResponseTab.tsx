/**
 * ResponseTab - Main Response tab container with sub-tab navigation
 *
 * Manages:
 * - Sub-tab navigation (Headers, Body, Both)
 * - Rendering appropriate sub-view based on active sub-tab
 * - Empty state handling
 * - Performance tracking (memory + load time)
 */

import {
    Activity,
    Clock,
    Columns,
    Copy,
    Download,
    FileCode,
    History,
    List,
} from 'lucide-react';
import { useEffect } from 'react';
import logger from '../../lib/logger';
import {
    formatResponseSize,
    formatResponseTime,
    getStatusDisplay,
    getStatusVariant,
} from '../../lib/response-utils';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { ResponseData } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { ResponseBodyView } from './ResponseBodyView';
import { ResponseBothView } from './ResponseBothView';
import { ResponseHeadersView } from './ResponseHeadersView';

export interface ResponseTabProps {
  response: ResponseData | null;
  onCopy?: () => void;
  onDownload?: () => void;
  responseSubTab: 'headers' | 'body' | 'both';
  setResponseSubTab: (tab: 'headers' | 'body' | 'both') => void;
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;
  requestMethod?: string;
  requestUrl?: string;
  requestId?: number | string;
}

export function ResponseTab({
  response,
  onCopy,
  onDownload,
  responseSubTab,
  setResponseSubTab,
  splitRatio,
  setSplitRatio,
  requestMethod,
  requestUrl,
  requestId,
}: ResponseTabProps) {
  const { setCurrentPage, setHistoryFilter } = useStore();

  const handleShowHistory = () => {
    if (requestId) {
      setHistoryFilter({ requestId });
    } else if (requestMethod && requestUrl) {
      setHistoryFilter({ method: requestMethod, url: requestUrl });
    }
    setCurrentPage('history');
  };

  // Performance tracking: Memory usage
  useEffect(() => {
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

    return () => {
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;

      if (memoryDelta > 20) {
        logger.warn('[Performance] Response tab exceeded memory budget', { memoryDelta });
      }
    };
  }, []);

  // Performance tracking: Load time
  useEffect(() => {
    const startTime = performance.now();

    requestAnimationFrame(() => {
      const loadTime = performance.now() - startTime;

      if (loadTime > 100) {
        logger.warn('[Performance] Response tab load time exceeded budget', { loadTime });
      }
    });
  }, []);

  // Render sub-tab content
  const renderSubTabContent = () => {
    if (!response) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 opacity-20" />
          </div>
          <h3 className="text-lg font-medium mb-1">No Response Yet</h3>
          <p className="max-w-[280px] text-sm opacity-60">
            Execute a request to see the response data, headers, and performance
            metrics here.
          </p>
        </div>
      );
    }

    switch (responseSubTab) {
      case 'headers':
        return (
          <ResponseHeadersView
            response={response}
            onCopy={onCopy}
            onDownload={onDownload}
            showActions={false}
          />
        );
      case 'body':
        return (
          <ResponseBodyView
            response={response}
            onCopy={onCopy}
            onDownload={onDownload}
            showActions={false}
          />
        );
      case 'both':
        return (
          <ResponseBothView
            response={response}
            onCopy={onCopy}
            onDownload={onDownload}
            splitRatio={splitRatio}
            onSplitRatioChange={setSplitRatio}
            showActions={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background/30 backdrop-blur-sm rounded-xl border border-border/40 shadow-2xl">
      {/* Unified Premium Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 border-b border-border/40 bg-muted/10">
        <div className="flex flex-wrap items-center gap-4">
          {/* Response Status Indicators */}
          {response && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-background/50 border border-border/40 shadow-sm animate-in slide-in-from-left-4 duration-500">
              <Badge
                variant={getStatusVariant(response.status)}
                className="px-2 py-0.5 font-bold tracking-tight"
              >
                {getStatusDisplay(response.status)}{' '}
                {response.statusText || 'OK'}
              </Badge>
              <div className="h-4 w-[1px] bg-border/60" />
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-blue-500/80" />
                <span>{formatResponseTime(response.time)}</span>
              </div>
              <div className="h-4 w-[1px] bg-border/60" />
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-green-500/80" />
                <span>{formatResponseSize(response.data)}</span>
              </div>
            </div>
          )}

          {/* Premium Segmented Tab Switcher */}
          <div className="flex p-1 bg-muted/40 rounded-xl border border-border/20 shadow-inner">
            <button
              onClick={() => setResponseSubTab('headers')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300',
                responseSubTab === 'headers'
                  ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <List className="h-3.5 w-3.5" />
              Headers
            </button>
            <button
              onClick={() => setResponseSubTab('body')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300',
                responseSubTab === 'body'
                  ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <FileCode className="h-3.5 w-3.5" />
              Body
            </button>
            <button
              onClick={() => setResponseSubTab('both')}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300',
                responseSubTab === 'both'
                  ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Columns className="h-3.5 w-3.5" />
              Both
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          {/* Action Buttons */}
          {response && (
            <div className="flex items-center bg-muted/30 p-0.5 rounded-lg border border-border/20">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCopy}
                      className="h-8 w-8 p-0 rounded-md hover:bg-primary/10 hover:text-primary transition-all grayscale hover:grayscale-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy Response Body</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDownload}
                      className="h-8 w-8 p-0 rounded-md hover:bg-primary/10 hover:text-primary transition-all grayscale hover:grayscale-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download Response</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* History Button - More Prominent */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    requestId || (requestMethod && requestUrl)
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={handleShowHistory}
                  disabled={!requestId && (!requestMethod || !requestUrl)}
                  className={cn(
                    'h-9 gap-2 px-4 font-bold transition-all duration-500 rounded-xl border border-primary/20',
                    requestId || (requestMethod && requestUrl)
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 ring-offset-2 hover:ring-2 ring-primary/30'
                      : 'opacity-50 grayscale cursor-not-allowed'
                  )}
                >
                  <History className="h-4 w-4" />
                  <span className="hidden lg:inline">History</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="font-medium">
                {!requestId && (!requestMethod || !requestUrl)
                  ? 'Send a request to see its history'
                  : 'View full history for this request'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Sub-tab Content - Fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-background/20 relative">
        {renderSubTabContent()}
      </div>
    </div>
  );
}
