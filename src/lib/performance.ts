/**
 * Performance Tracking Utility
 *
 * Tracks memory usage, load times, and bundle sizes for features.
 * Helps ensure we meet performance budgets and identify regressions.
 *
 * Usage:
 * ```typescript
 * const tracker = trackFeatureLoad('FeatureName');
 * await loadFeature();
 * tracker.end();
 * ```
 */

interface PerformanceMetrics {
  feature: string;
  loadTime: number;
  memoryDelta: number;
  memoryBefore: number;
  memoryAfter: number;
  timestamp: number;
}

interface PerformanceTracker {
  end: () => PerformanceMetrics;
  cancel: () => void;
}

/**
 * Track feature load performance
 *
 * @param featureName - Name of the feature being loaded
 * @returns Tracker object with end() and cancel() methods
 *
 * @example
 * ```typescript
 * const tracker = trackFeatureLoad('MonacoEditor');
 * await loadMonacoEditor();
 * const metrics = tracker.end();
 * // metrics contains loadTime, memoryDelta, etc.
 * ```
 */
export function trackFeatureLoad(featureName: string): PerformanceTracker {
  const startTime = performance.now();
  const memoryBefore = getMemoryUsage();
  let ended = false;

  return {
    end: (): PerformanceMetrics => {
      if (ended) {
        throw new Error('Tracker already ended');
      }
      ended = true;

      const endTime = performance.now();
      const memoryAfter = getMemoryUsage();
      const loadTime = endTime - startTime;
      const memoryDelta = memoryAfter - memoryBefore;

      const metrics: PerformanceMetrics = {
        feature: featureName,
        loadTime: Math.round(loadTime * 100) / 100, // Round to 2 decimals
        memoryDelta: Math.round((memoryDelta / 1024 / 1024) * 100) / 100, // MB, 2 decimals
        memoryBefore: Math.round((memoryBefore / 1024 / 1024) * 100) / 100, // MB
        memoryAfter: Math.round((memoryAfter / 1024 / 1024) * 100) / 100, // MB
        timestamp: Date.now(),
      };

      // Log metrics
      logPerformanceMetrics(metrics);

      // Alert on budget violations
      checkPerformanceBudgets(metrics);

      return metrics;
    },
    cancel: () => {
      ended = true;
    },
  };
}

/**
 * Get current memory usage
 *
 * @returns Memory usage in bytes (0 if not available)
 */
function getMemoryUsage(): number {
  // @ts-ignore - performance.memory is not in TypeScript types but available in Chrome
  return (performance as any).memory?.usedJSHeapSize || 0;
}

/**
 * Log performance metrics
 *
 * @param metrics - Performance metrics to log
 */
function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  const logMessage =
    `[Performance] Feature loaded: ${metrics.feature} | ` +
    `Load time: ${metrics.loadTime}ms | ` +
    `Memory delta: ${metrics.memoryDelta}MB | ` +
    `Memory: ${metrics.memoryBefore}MB → ${metrics.memoryAfter}MB`;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(logMessage);
  }

  // TODO: Send to IPC handler to log to Winston logger in main process
  // This would require adding an IPC handler for performance metrics
  // window.electronAPI?.performance?.logMetrics(metrics);
}

/**
 * Check performance budgets and alert on violations
 *
 * @param metrics - Performance metrics to check
 */
function checkPerformanceBudgets(metrics: PerformanceMetrics): void {
  const BUDGETS = {
    LOAD_TIME: 200, // ms
    MEMORY_DELTA: 50, // MB
  };

  const violations: string[] = [];

  if (metrics.loadTime > BUDGETS.LOAD_TIME) {
    violations.push(
      `Load time ${metrics.loadTime}ms exceeds budget of ${BUDGETS.LOAD_TIME}ms`
    );
  }

  if (metrics.memoryDelta > BUDGETS.MEMORY_DELTA) {
    violations.push(
      `Memory delta ${metrics.memoryDelta}MB exceeds budget of ${BUDGETS.MEMORY_DELTA}MB`
    );
  }

  if (violations.length > 0) {
    const warningMessage = `[Performance Warning] ${metrics.feature}:\n${violations.join('\n')}`;
    console.warn(warningMessage);

    // TODO: Send to IPC handler to log warning to Winston logger
    // window.electronAPI?.performance?.logWarning(metrics, violations);
  }
}

/**
 * Track bundle size (to be called during build)
 *
 * @param bundleName - Name of the bundle
 * @param sizeBytes - Size of the bundle in bytes
 */
export function trackBundleSize(bundleName: string, sizeBytes: number): void {
  const sizeKB = Math.round((sizeBytes / 1024) * 100) / 100;
  const sizeMB = Math.round((sizeBytes / 1024 / 1024) * 100) / 100;

  const BUDGET = 500; // KB

  const logMessage = `[Performance] Bundle: ${bundleName} | Size: ${sizeKB}KB (${sizeMB}MB)`;

  if (process.env.NODE_ENV === 'development') {
    console.log(logMessage);
  }

  if (sizeKB > BUDGET) {
    const warning = `[Performance Warning] Bundle ${bundleName} size ${sizeKB}KB exceeds budget of ${BUDGET}KB`;
    console.warn(warning);
  }

  // TODO: Send to IPC handler to log to Winston logger
  // window.electronAPI?.performance?.logBundleSize(bundleName, sizeKB);
}

/**
 * Get current performance snapshot
 *
 * @returns Current memory usage and performance metrics
 */
export function getPerformanceSnapshot(): {
  memory: number; // MB
  timestamp: number;
} {
  const memory = getMemoryUsage();
  return {
    memory: Math.round((memory / 1024 / 1024) * 100) / 100, // MB
    timestamp: Date.now(),
  };
}

/**
 * Measure function execution time
 *
 * @param fn - Function to measure
 * @param label - Label for the measurement
 * @returns Execution time in milliseconds
 *
 * @example
 * ```typescript
 * const time = measureExecution(() => expensiveOperation(), 'ExpensiveOp');
 * console.log(`Took ${time}ms`);
 * ```
 */
export function measureExecution<T>(fn: () => T, label?: string): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const executionTime = endTime - startTime;

  if (label) {
    console.log(`[Performance] ${label} took ${executionTime.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Measure async function execution time
 *
 * @param fn - Async function to measure
 * @param label - Label for the measurement
 * @returns Execution time in milliseconds
 *
 * @example
 * ```typescript
 * const time = await measureAsyncExecution(async () => await fetchData(), 'FetchData');
 * console.log(`Took ${time}ms`);
 * ```
 */
export async function measureAsyncExecution<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<T> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const executionTime = endTime - startTime;

  if (label) {
    console.log(`[Performance] ${label} took ${executionTime.toFixed(2)}ms`);
  }

  return result;
}
