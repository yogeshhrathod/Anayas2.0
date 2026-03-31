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
    Terminal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { memo, useEffect, useState } from 'react';
import logger from '../../lib/logger';
import {
    formatResponseSize,
    formatResponseTime,
    getStatusText,
    getStatusVariant,
} from '../../lib/response-utils';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { ResponseData } from '../../types/entities';
import { BikeLogoAnimation } from '../BikeLogoAnimation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ResponseBodyView } from './ResponseBodyView';
import { ResponseBothView } from './ResponseBothView';
import { ResponseHeadersView } from './ResponseHeadersView';

export interface ResponseTabProps {
  response: ResponseData | null;
  isLoading?: boolean;
  onCopy?: () => void;
  onDownload?: () => void;
  responseSubTab: 'headers' | 'body' | 'both' | 'console';
  setResponseSubTab: (tab: 'headers' | 'body' | 'both' | 'console') => void;
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;
  requestMethod?: string;
  requestUrl?: string;
  requestId?: number | string;
  startTime?: number | null;
}

export const ResponseTab = memo(function ResponseTab({
  response,
  isLoading,
  onCopy,
  onDownload,
  responseSubTab,
  setResponseSubTab,
  splitRatio,
  setSplitRatio,
  requestMethod,
  requestUrl,
  requestId,
  startTime,
}: ResponseTabProps) {
  const setCurrentPage = useStore(state => state.setCurrentPage);
  const setHistoryFilter = useStore(state => state.setHistoryFilter);

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
    if (isLoading) {
      return <LoadingState startTime={startTime} />;
    }

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
      case 'console':
        return (
          <div className="flex-1 flex flex-col min-h-0 overflow-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Terminal className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Request Console</h3>
                  <p className="text-xs text-muted-foreground">Actual data sent over the wire after resolving all variables</p>
                </div>
              </div>

              {!response.requestDetails ? (
                <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">No request details captured for this execution.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* URL Section */}
                  <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/20 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endpoint</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{response.requestDetails.method}</Badge>
                    </div>
                    <div className="p-4 font-mono text-sm break-all bg-background/50 selection:bg-primary/20">
                      {response.requestDetails.url}
                    </div>
                  </div>

                  {/* Headers Section */}
                  <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/20 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resolved Request Headers</span>
                      <span className="text-[10px] text-muted-foreground">{Object.keys(response.requestDetails.headers || {}).length} pairs</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {Object.keys(response.requestDetails.headers || {}).length > 0 ? (
                        Object.entries(response.requestDetails.headers).map(([key, value]) => (
                          <div key={key} className="flex gap-4 text-xs font-mono group">
                            <span className="w-40 shrink-0 text-muted-foreground font-semibold selection:bg-primary/20">{key}:</span>
                            <span className="break-all selection:bg-primary/20">{value}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs italic text-muted-foreground">No custom headers sent</div>
                      )}
                    </div>
                  </div>

                  {/* Body Section */}
                  {response.requestDetails.body && (
                    <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-4 py-2 bg-muted/30 border-b border-border/20 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resolved Payload</span>
                      </div>
                      <div className="p-0">
                        <pre className="p-4 text-xs font-mono bg-background/50 selection:bg-primary/20 whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto leading-relaxed">
                          {typeof response.requestDetails.body === 'string'
                            ? response.requestDetails.body
                            : JSON.stringify(response.requestDetails.body, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "flex flex-col flex-1 min-h-0 overflow-hidden bg-background/30 backdrop-blur-sm rounded-xl border border-border/40 shadow-2xl transition-all duration-700",
      isLoading && "ring-2 ring-primary/20 shadow-[0_0_50px_rgba(var(--primary),0.15)] border-primary/30"
    )}>
      {/* Refined Unified Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 bg-muted/5">
        <div className="flex items-center gap-4">
          {/* Response Status Indicators */}
          {response && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-background/50 border border-border/20 shadow-sm transition-all duration-300">
              <Badge
                variant={getStatusVariant(response.status)}
                className="px-2 py-0.5 font-bold tracking-tight"
              >
                {response.status} {getStatusText(response.status, response.statusText)}
              </Badge>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-blue-500/80" />
                <span>{formatResponseTime(response.time)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-green-500/80" />
                <span>{formatResponseSize(response.data)}</span>
              </div>
            </div>
          )}

          {/* Premium Segmented Tab Switcher */}
          <div className="flex p-1 bg-muted/40 rounded-xl border border-border/20 shadow-inner">
            {[
              { id: 'headers', icon: List, label: 'Headers' },
              { id: 'body', icon: FileCode, label: 'Body' },
              { id: 'both', icon: Columns, label: 'Both' },
              { id: 'console', icon: Terminal, label: 'Console' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setResponseSubTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer group',
                  responseSubTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className={cn(
                  "h-3.5 w-3.5",
                  responseSubTab === tab.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {response && (
            <div className="flex items-center p-0.5 rounded-lg border border-border/20 bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="h-8 w-8 p-0 rounded-md hover:bg-primary/10 hover:text-primary transition-all grayscale hover:grayscale-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="h-8 w-8 p-0 rounded-md hover:bg-primary/10 hover:text-primary transition-all grayscale hover:grayscale-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleShowHistory}
            disabled={!requestId && (!requestMethod || !requestUrl)}
            className="h-9 gap-2 px-3 font-bold transition-all duration-200 rounded-lg border-border/40 hover:bg-primary/5 hover:text-primary"
          >
            <History className="h-4 w-4" />
            <span className="hidden lg:inline text-xs">History</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Content Area with Staggered Reveal */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={responseSubTab + (response ? 'has-data' : 'no-data')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.15, 
              ease: 'easeOut'
            }}
            className="absolute inset-0 flex flex-col"
          >
            {renderSubTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

const LoadingState = memo(function LoadingState({ startTime }: { startTime?: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // If we have a stable start time from the global store, use it.
    // Otherwise fallback to local Date.now()
    const timerStart = startTime || Date.now();
    
    // Set initial elapsed immediately to prevent jump
    setElapsed(Date.now() - timerStart);

    const interval = setInterval(() => {
      setElapsed(Date.now() - timerStart);
    }, 50);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-primary p-8 text-center animate-in fade-in zoom-in-95 duration-700 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
      {/* Background Orbs to indicate data flow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
      </div>

      <div className="relative mb-4">
        {/* The creative logo animation */}
        <div className="transform scale-125 mb-4">
          <BikeLogoAnimation size={100} />
        </div>
        
        {/* Glow effect under the bike */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-4 bg-primary/10 blur-xl rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <h3 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          Requesting Data...
        </h3>
        
        <div className="mt-4 flex items-center gap-3 px-4 py-2 bg-background/50 border border-border/40 backdrop-blur-md rounded-2xl shadow-xl">
          <div className="flex gap-1.5 items-center mr-2">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-0" />
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150" />
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-300" />
          </div>
          <div className="font-mono text-xl font-bold tabular-nums text-foreground/80">
            {(elapsed / 1000).toFixed(2)}s
          </div>
        </div>
        
        <p className="mt-4 text-xs text-muted-foreground/60 max-w-[200px]">
          Traveling across the web to fetch your response
        </p>
      </div>
    </div>
  );
});
