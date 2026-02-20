import fs from 'fs';
import path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  testName?: string;
  metadata?: any;
}

class TestLogger {
  private logFile: string | null = null;
  private logs: LogEntry[] = [];
  private startTime: number = Date.now();
  private memoryStart: number = 0;

  /**
   * Initialize logger for a test
   */
  init(testName: string, testArtifactsDir: string): void {
    this.logFile = path.join(testArtifactsDir, 'test.log');
    this.startTime = Date.now();
    this.memoryStart = this.getMemoryUsage();
    this.logs = [];

    // Ensure directory exists
    fs.mkdirSync(testArtifactsDir, { recursive: true });

    this.info(`Test started: ${testName}`);
  }

  /**
   * Log a message
   */
  log(level: LogLevel, message: string, metadata?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.logs.push(entry);

    // Write to console
    const consoleMethod =
      level === LogLevel.ERROR
        ? 'error'
        : level === LogLevel.WARN
          ? 'warn'
          : 'log';
    console[consoleMethod](`[${level}] ${message}`, metadata || '');

    // Write to file if initialized
    if (this.logFile) {
      this.writeToFile(entry);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: any): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: any): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: any): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...metadata,
    });
  }

  /**
   * Log memory usage
   */
  logMemory(operation: string): void {
    const currentMemory = this.getMemoryUsage();
    const delta = currentMemory - this.memoryStart;

    this.info(`Memory: ${operation}`, {
      current: currentMemory,
      delta,
      unit: 'MB',
    });
  }

  /**
   * Get memory usage in MB
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    }
    return 0;
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: LogEntry): void {
    if (!this.logFile) return;

    const logLine = `[${entry.timestamp}] [${entry.level}] ${entry.message}${
      entry.metadata ? ' ' + JSON.stringify(entry.metadata) : ''
    }\n`;

    try {
      fs.appendFileSync(this.logFile, logLine, 'utf-8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs as string
   */
  getLogsAsString(): string {
    return this.logs
      .map(entry => {
        return `[${entry.timestamp}] [${entry.level}] ${entry.message}${
          entry.metadata ? ' ' + JSON.stringify(entry.metadata) : ''
        }`;
      })
      .join('\n');
  }

  /**
   * Get test duration
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Finalize logger and write summary
   */
  finalize(testName: string, success: boolean): void {
    const duration = this.getDuration();
    const memoryEnd = this.getMemoryUsage();
    const memoryDelta = memoryEnd - this.memoryStart;

    this.info(`Test ${success ? 'completed' : 'failed'}: ${testName}`, {
      duration: `${duration}ms`,
      memoryDelta: `${memoryDelta}MB`,
    });

    // Write summary
    if (this.logFile) {
      const summary = `
=== Test Summary ===
Test: ${testName}
Status: ${success ? 'PASSED' : 'FAILED'}
Duration: ${duration}ms
Memory Delta: ${memoryDelta}MB
Total Logs: ${this.logs.length}
===================
`;
      fs.appendFileSync(this.logFile, summary, 'utf-8');
    }
  }
}

// Export singleton instance
export const logger = new TestLogger();
