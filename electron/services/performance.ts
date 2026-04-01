import autocannon from 'autocannon';
import { variableResolver, VariableContext } from './variable-resolver';
import { createLogger } from './logger';

const logger = createLogger('performance-service');

export interface PerformanceOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  connections?: number;
  pipelining?: number;
  duration?: number | string;
  workers?: number;
  amount?: number;
  timeout?: number;
  sslVerification?: boolean;
}

export class PerformanceService {
  private activeInstance: any = null;

  /**
   * Runs a performance test using autocannon
   */
  async run(
    options: PerformanceOptions,
    context: VariableContext,
    onProgress?: (data: {
      timestamp: number;
      counter: number;
      requests: number;
      latency: number;
      throughput: number;
      errors: number;
      timeouts: number;
      statusCodes?: Record<number, number>;
    }) => void
  ): Promise<autocannon.Result> {
    if (this.activeInstance) {
      throw new Error('A performance test is already running');
    }

    // Resolve variables
    const resolvedUrl = variableResolver.resolve(options.url, context);
    const resolvedHeaders = variableResolver.resolveObject(
      options.headers || {},
      context
    );
    const resolvedBody = options.body
      ? variableResolver.resolve(options.body, context)
      : undefined;

    // Parse URL to get path for the request object
    let urlObj: URL;
    try {
      urlObj = new URL(resolvedUrl);
    } catch (e) {
      throw new Error(`Invalid URL: ${resolvedUrl}`);
    }

    const autocannonOptions: autocannon.Options = {
      url: resolvedUrl,
      method: (options.method || 'GET') as any,
      headers: resolvedHeaders,
      body: resolvedBody,
      connections: options.connections || 10,
      pipelining: options.pipelining || 1,
      duration: options.duration || 10,
      workers: options.workers,
      amount: options.amount,
      timeout: options.timeout || 10,
      title: 'Luna Performance Test',
    };

    // Handle SSL Verification
    // Note: Autocannon uses 'rejectUnauthorized' inside its request options
    if (options.sslVerification === false) {
      (autocannonOptions as any).requests = [
        {
          method: options.method || 'GET',
          path: urlObj.pathname + urlObj.search,
          headers: resolvedHeaders,
          body: resolvedBody,
          setupRequest: (req: any) => {
            req.rejectUnauthorized = false;
            return req;
          },
        },
      ];
    }

    return new Promise((resolve, reject) => {
      try {
        // Track per-tick and global metrics
        let tickLatencySum = 0;
        let tickResponseCount = 0;
        let errors = 0;
        let timeouts = 0;
        let cumulativeBytes = 0;
        let accumStatusCodes: Record<number, number> = {};
        let currentTickStatusCodes: Record<number, number> = {};

        this.activeInstance = autocannon(autocannonOptions, (err, result) => {
          this.activeInstance = null;
          if (err) {
            logger.error('Autocannon test failed', { error: err.message });
            return reject(err);
          }
          // Merge our tracked status codes if missing or to ensure accuracy
          const resultAny = result as any;
          if (resultAny && !resultAny.statusCodes) {
             resultAny.statusCodes = { ...accumStatusCodes };
          } else if (resultAny && resultAny.statusCodes) {
             // If autocannon provided them, prefer ours if they are more complete, or just merge
             Object.assign(resultAny.statusCodes, accumStatusCodes);
          }
          resolve(result);
        });

        this.activeInstance.on('response', (_client: any, statusCode: number, resBytes: number, responseTime: number) => {
          tickLatencySum += responseTime;
          tickResponseCount += 1;
          cumulativeBytes += resBytes;
          
          // Track for the whole test
          accumStatusCodes[statusCode] = (accumStatusCodes[statusCode] || 0) + 1;
          // Track for the current tick (live update)
          currentTickStatusCodes[statusCode] = (currentTickStatusCodes[statusCode] || 0) + 1;

          if (statusCode < 200 || statusCode >= 400) errors++;
        });

        this.activeInstance.on('reqError', () => {
          errors++;
        });

        this.activeInstance.on('timeout', () => {
          timeouts++;
        });

        this.activeInstance.on('tick', (tick: { counter: number; bytes: number }) => {
          const avgLatency = tickResponseCount > 0 ? tickLatencySum / tickResponseCount : 0;
          const throughput = tick.bytes; // bytes in the last second

          if (onProgress) {
            onProgress({
              timestamp: Date.now(),
              counter: tick.counter,          // Requests in the last second (actual RPS)
              requests: tick.counter,          // Mirror for the chart
              latency: avgLatency,             // Average latency ms over the last tick
              throughput,                      // Bytes/s for the last second
              errors,
              timeouts,
              statusCodes: { ...currentTickStatusCodes },
            });
          }

          // Reset per-tick accumulators
          tickLatencySum = 0;
          tickResponseCount = 0;
          currentTickStatusCodes = {};
        });

        this.activeInstance.on('error', (err: Error) => {
          logger.error('Autocannon error event', { error: err.message });
          this.activeInstance = null;
          reject(err);
        });
      } catch (err: any) {
        this.activeInstance = null;
        logger.error('Failed to start autocannon', { error: err.message });
        reject(err);
      }
    });
  }

  /**
   * Stops the currently running performance test
   */
  stop(): void {
    if (this.activeInstance) {
      logger.info('Stopping active performance test');
      this.activeInstance.stop();
      this.activeInstance = null;
    }
  }

  /**
   * Checks if a test is currently running
   */
  isRunning(): boolean {
    return this.activeInstance !== null;
  }
}

export const performanceService = new PerformanceService();
