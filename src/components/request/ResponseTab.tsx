/**
 * ResponseTab - Main Response tab container with sub-tab navigation
 *
 * Manages:
 * - Sub-tab navigation (Headers, Body, Both)
 * - Rendering appropriate sub-view based on active sub-tab
 * - Empty state handling
 * - Performance tracking (memory + load time)
 *
 * Performance:
 * - Memory: <20MB for Response rendering
 * - Load Time: <100ms
 * - Lazy rendering: Components only mount when Response tab active
 * - Cleanup: Full cleanup when switching away
 *
 * @example
 * ```tsx
 * <ResponseTab
 *   response={response}
 *   onCopy={handleCopy}
 *   onDownload={handleDownload}
 *   responseSubTab="headers"
 *   setResponseSubTab={setResponseSubTab}
 *   splitRatio={50}
 *   setSplitRatio={setSplitRatio}
 * />
 * ```
 */

import { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ResponseData } from '../../types/entities';
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
}

export function ResponseTab({
  response,
  onCopy,
  onDownload,
  responseSubTab,
  setResponseSubTab,
  splitRatio,
  setSplitRatio,
}: ResponseTabProps) {
  // Performance tracking: Memory usage
  useEffect(() => {
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

    return () => {
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;
      console.log(
        '[Performance] Response tab memory:',
        memoryDelta.toFixed(2),
        'MB'
      );

      if (memoryDelta > 20) {
        console.warn(
          '[Performance] Response tab exceeded memory budget:',
          memoryDelta,
          'MB'
        );
      }
    };
  }, []);

  // Performance tracking: Load time
  useEffect(() => {
    const startTime = performance.now();

    // After first render
    requestAnimationFrame(() => {
      const loadTime = performance.now() - startTime;
      console.log(
        '[Performance] Response tab load time:',
        loadTime.toFixed(2),
        'ms'
      );

      if (loadTime > 100) {
        console.warn(
          '[Performance] Response tab load time exceeded budget:',
          loadTime,
          'ms'
        );
      }
    });
  }, []);

  // Render sub-tab content
  const renderSubTabContent = () => {
    switch (responseSubTab) {
      case 'headers':
        return (
          <ResponseHeadersView
            response={response}
            onCopy={onCopy}
            onDownload={onDownload}
            showActions={true}
          />
        );
      case 'body':
        return (
          <ResponseBodyView
            response={response}
            onCopy={onCopy}
            onDownload={onDownload}
            showActions={true}
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Sub-tab Navigation - Fixed height */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/20">
        <button
          onClick={() => setResponseSubTab('headers')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            responseSubTab === 'headers'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Headers
        </button>
        <button
          onClick={() => setResponseSubTab('body')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            responseSubTab === 'body'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Body
        </button>
        <button
          onClick={() => setResponseSubTab('both')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            responseSubTab === 'both'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Both
        </button>
      </div>

      {/* Sub-tab Content - Fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {renderSubTabContent()}
      </div>
    </div>
  );
}
