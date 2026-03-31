/**
 * CollectionRunner - Component for running all requests in a collection sequentially
 *
 * Features:
 * - Execute all requests in a collection
 * - Show progress for each request
 * - Display results and summary
 *
 * @example
 * ```tsx
 * <CollectionRunner
 *   collectionId={collection.id}
 *   collectionName={collection.name}
 *   onClose={handleClose}
 * />
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Progress } from '../ui/progress';
import { CheckCircle2, XCircle, Loader2, Play, ChevronDown, ChevronRight, FileJson } from 'lucide-react';
import { useToastNotifications } from '../../hooks/useToastNotifications';

export interface CollectionRunnerProps {
  collectionId: number;
  collectionName: string;
  onClose: () => void;
  open: boolean;
}

export interface RunResult {
  requestId: number;
  requestName: string;
  success: boolean;
  status?: number;
  responseTime?: number;
  error?: string;
  method?: string;
  url?: string;
  responseBody?: string;
}

export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
}

export function CollectionRunner({
  collectionId,
  collectionName,
  onClose,
  open,
}: CollectionRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const { showSuccess, showError } = useToastNotifications();

  const runCollection = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      const response = await window.electronAPI.collection.run(collectionId);

      if (response.success) {
        setResults(response.results || []);
        setSummary(response.summary || null);

        const passed = response.summary?.passed || 0;
        const total = response.summary?.total || 0;

        if (passed === total) {
          showSuccess('Collection Run Complete', {
            description: `All ${total} requests passed successfully`,
          });
        } else {
          showError(
            'Collection Run Completed with Errors',
            `${response.summary?.failed || 0} out of ${total} requests failed`
          );
        }
      } else {
        showError(
          'Collection Run Failed',
          response.error || 'Unknown error occurred'
        );
      }
    } catch (error: any) {
      showError(
        'Collection Run Failed',
        error.message || 'Failed to run collection'
      );
    } finally {
      setIsRunning(false);
    }
  }, [collectionId, showSuccess, showError]);

  const handleClose = () => {
    if (!isRunning) {
      onClose();
    }
  };

  useEffect(() => {
    if (open && !isRunning && results.length === 0) {
      // Auto-run when dialog opens (optional - can be changed to manual trigger)
      // runCollection();
    }
  }, [open]);

  const progress = summary ? (results.length / summary.total) * 100 : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={open => !open && handleClose()}
      title={`Run Collection: ${collectionName}`}
      description="Execute all requests in this collection sequentially"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isRunning && results.length === 0 && (
            <Button onClick={runCollection} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Run
            </Button>
          )}
          {isRunning && (
            <Button
              variant="outline"
              disabled
              className="flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </Button>
          )}
          {!isRunning && results.length > 0 && (
            <Button
              onClick={runCollection}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run Again
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={isRunning}>
            Close
          </Button>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Running requests...</span>
              <span>
                {results.length} / {summary?.total || '?'} completed
              </span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Summary */}
        {summary && !isRunning && (
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">
                  {summary.passed}
                </div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {summary.failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Results</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map(result => (
                <ResultItem key={result.requestId} result={result} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isRunning && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Click "Start Run" to execute all requests in this collection</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function ResultItem({ result }: { result: RunResult }) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = result.success && result.status && result.status < 400;

  return (
    <div
      className={`border rounded-lg p-3 transition-colors ${
        isSuccess
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-destructive/5 border-destructive/20'
      }`}
    >
      <div 
        className="flex items-start justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-2 flex-1">
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          )}
          <div className="flex-1 overflow-hidden">
            <div className="font-medium flex items-center gap-2">
              <span className="truncate">{result.requestName}</span>
              {result.method && (
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">
                  {result.method}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              {result.success ? (
                <>
                  <span className={result.status && result.status >= 400 ? 'text-warning font-medium' : ''}>
                    Status: {result.status}
                  </span>
                  {result.responseTime && <span>• {result.responseTime}ms</span>}
                  {result.url && <span className="truncate max-w-[200px] sm:max-w-xs" title={result.url}>• {result.url}</span>}
                </>
              ) : (
                <span className="text-destructive font-medium">Error: {result.error}</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (result.responseBody || result.url) && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {result.url && (
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Request URL</div>
              <div className="text-sm font-mono break-all bg-muted/50 p-2 rounded border border-border/50">
                {result.url}
              </div>
            </div>
          )}
          
          {result.responseBody && (
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                <FileJson className="h-3.5 w-3.5" />
                Response Body Preview
              </div>
              <pre className="text-xs font-mono bg-muted/50 p-3 rounded overflow-x-auto border border-border/50 max-h-60 overflow-y-auto whitespace-pre-wrap word-break-all">
                {result.responseBody}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
