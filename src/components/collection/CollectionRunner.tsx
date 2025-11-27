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
import { CheckCircle2, XCircle, Loader2, Play } from 'lucide-react';
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
}

export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
}

export function CollectionRunner({ collectionId, collectionName, onClose, open }: CollectionRunnerProps) {
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
        
        const passed = (response.summary?.passed || 0);
        const total = (response.summary?.total || 0);
        
        if (passed === total) {
          showSuccess('Collection Run Complete', { description: `All ${total} requests passed successfully` });
        } else {
          showError('Collection Run Completed with Errors', `${response.summary?.failed || 0} out of ${total} requests failed`);
        }
      } else {
        showError('Collection Run Failed', response.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      showError('Collection Run Failed', error.message || 'Failed to run collection');
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
      onOpenChange={(open) => !open && handleClose()}
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
              <Button variant="outline" disabled className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </Button>
            )}
            {!isRunning && results.length > 0 && (
              <Button onClick={runCollection} variant="outline" className="flex items-center gap-2">
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
                <span>{results.length} / {summary?.total || '?'} completed</span>
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
                  <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
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
                {results.map((result) => (
                  <div
                    key={result.requestId}
                    className={`border rounded-lg p-3 ${
                      result.success && result.status && result.status < 400
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {result.success && result.status && result.status < 400 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{result.requestName}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {result.success ? (
                              <>
                                Status: {result.status} {result.responseTime && `• ${result.responseTime}ms`}
                              </>
                            ) : (
                              <>Error: {result.error}</>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isRunning && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Click &quot;Start Run&quot; to execute all requests in this collection</p>
            </div>
          )}
      </div>
    </Dialog>
  );
}

