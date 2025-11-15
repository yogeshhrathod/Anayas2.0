import { Page } from '@playwright/test';
import { getDatabaseContents } from './test-db';
import path from 'path';
import fs from 'fs';

export interface DebugContext {
  consoleLogs: string[];
  networkActivity: any[];
  reactState?: any;
  zustandState?: any;
  databaseState?: any;
  executionTrace: Array<{ step: string; data?: any; timestamp: number }>;
  screenshots: string[];
}

/**
 * Capture all console logs from the page
 */
export async function captureConsoleLogs(page: Page): Promise<string[]> {
  const logs: string[] = [];
  
  page.on('console', (msg) => {
    const text = `${msg.type()}: ${msg.text()}`;
    logs.push(text);
  });
  
  // Also capture existing console logs
  const existingLogs = await page.evaluate(() => {
    return (window as any).__consoleLogs || [];
  });
  
  return [...existingLogs, ...logs];
}

/**
 * Capture network activity
 */
export async function captureNetworkActivity(page: Page): Promise<any[]> {
  const networkLogs: any[] = [];
  
  page.on('request', (request) => {
    networkLogs.push({
      type: 'request',
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: Date.now(),
    });
  });
  
  page.on('response', (response) => {
    networkLogs.push({
      type: 'response',
      url: response.url(),
      status: response.status(),
      headers: response.headers(),
      timestamp: Date.now(),
    });
  });
  
  return networkLogs;
}

/**
 * Capture React component state
 */
export async function captureReactState(page: Page, componentName?: string): Promise<any> {
  try {
    const state = await page.evaluate((name) => {
      // Try to access React DevTools if available
      const reactFiber = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (reactFiber) {
        return reactFiber.renderers.get(1)?.current?.memoizedState;
      }
      
      // Fallback: try to get state from component props
      if (name) {
        const element = document.querySelector(`[data-testid="${name}"]`);
        if (element) {
          return (element as any).__reactInternalInstance?.memoizedState;
        }
      }
      
      return null;
    }, componentName);
    
    return state;
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Capture Zustand store state
 */
export async function captureZustandState(page: Page): Promise<any> {
  try {
    const state = await page.evaluate(() => {
      // Access Zustand store if available
      const store = (window as any).__ZUSTAND_STORE__;
      if (store) {
        return store.getState();
      }
      
      // Try to get from window.electronAPI context
      const electronAPI = (window as any).electronAPI;
      if (electronAPI) {
        return { electronAPI: 'available' };
      }
      
      return null;
    });
    
    return state;
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Capture database state
 */
export function captureDatabaseState(testDbPath: string): any {
  return getDatabaseContents(testDbPath);
}

/**
 * Generate comprehensive error report
 */
export function generateErrorReport(
  error: Error,
  context: DebugContext,
  testName: string,
  testArtifactsDir: string
): string {
  const report = {
    testName,
    status: 'FAILED',
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
    },
    state: {
      react: context.reactState,
      zustand: context.zustandState,
      database: context.databaseState,
    },
    consoleLogs: context.consoleLogs,
    networkActivity: context.networkActivity,
    executionTrace: context.executionTrace,
    screenshots: context.screenshots,
    rootCauseAnalysis: analyzeRootCause(error, context),
    suggestedFixes: suggestFixes(error, context),
  };
  
  const reportPath = path.join(testArtifactsDir, 'error-report.json');
  fs.mkdirSync(testArtifactsDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Also generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(testArtifactsDir, 'error-report.md');
  fs.writeFileSync(markdownPath, markdownReport);
  
  return markdownPath;
}

/**
 * Generate markdown error report
 */
function generateMarkdownReport(report: any): string {
  return `# Error Report: ${report.testName}

## Test Information
- Test: ${report.testName}
- Status: ${report.status}
- Timestamp: ${report.timestamp}

## Error Details
\`\`\`
${report.error.message}
\`\`\`

\`\`\`
${report.error.stack}
\`\`\`

## State at Failure

### React State
\`\`\`json
${JSON.stringify(report.state.react, null, 2)}
\`\`\`

### Zustand Store
\`\`\`json
${JSON.stringify(report.state.zustand, null, 2)}
\`\`\`

### Database State
\`\`\`json
${JSON.stringify(report.state.database, null, 2)}
\`\`\`

## Execution Trace
${report.executionTrace.map((trace: any) => `- **${trace.step}** (${new Date(trace.timestamp).toISOString()})`).join('\n')}

## Console Logs
\`\`\`
${report.consoleLogs.join('\n')}
\`\`\`

## Network Activity
\`\`\`json
${JSON.stringify(report.networkActivity, null, 2)}
\`\`\`

## Screenshots
${report.screenshots.map((screenshot: string) => `- ${screenshot}`).join('\n')}

## Root Cause Analysis
${report.rootCauseAnalysis}

## Suggested Fixes
${report.suggestedFixes}
`;
}

/**
 * Analyze root cause of error
 */
function analyzeRootCause(error: Error, context: DebugContext): string {
  const errorMsg = error.message.toLowerCase();
  const suggestions: string[] = [];
  
  if (errorMsg.includes('not found') || errorMsg.includes('undefined')) {
    suggestions.push('Possible missing data or uninitialized state');
  }
  
  if (errorMsg.includes('timeout') || errorMsg.includes('wait')) {
    suggestions.push('Possible timing issue - check if async operations completed');
  }
  
  if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
    suggestions.push('Possible network issue - check if API is available');
  }
  
  if (context.databaseState && Object.keys(context.databaseState).length === 0) {
    suggestions.push('Database appears empty - check if data was persisted');
  }
  
  if (context.consoleLogs.some(log => log.includes('error'))) {
    suggestions.push('Console errors detected - check browser console for details');
  }
  
  return suggestions.length > 0 
    ? suggestions.join('\n- ')
    : 'Unable to determine root cause automatically';
}

/**
 * Suggest fixes based on error
 */
function suggestFixes(error: Error, context: DebugContext): string {
  const errorMsg = error.message.toLowerCase();
  const fixes: string[] = [];
  
  if (errorMsg.includes('not found')) {
    fixes.push('1. Verify data exists in database before accessing');
    fixes.push('2. Check if IDs are correct');
    fixes.push('3. Ensure data was created before querying');
  }
  
  if (errorMsg.includes('timeout')) {
    fixes.push('1. Increase timeout in test');
    fixes.push('2. Add explicit waits for async operations');
    fixes.push('3. Check if operations are completing');
  }
  
  if (errorMsg.includes('network')) {
    fixes.push('1. Verify network connectivity');
    fixes.push('2. Check if API endpoints are correct');
    fixes.push('3. Verify request format');
  }
  
  return fixes.length > 0 
    ? fixes.join('\n')
    : 'Review error message and stack trace for specific guidance';
}

/**
 * Trace execution steps
 */
export function traceExecution(step: string, data?: any): { step: string; data?: any; timestamp: number } {
  return {
    step,
    data,
    timestamp: Date.now(),
  };
}

/**
 * Compare states before and after operation
 */
export function compareStates(before: any, after: any): { changed: boolean; changes: any } {
  const changes: any = {};
  let changed = false;
  
  // Simple deep comparison
  function compare(obj1: any, obj2: any, path = ''): void {
    if (obj1 === obj2) return;
    
    if (typeof obj1 !== typeof obj2) {
      changes[path] = { before: obj1, after: obj2 };
      changed = true;
      return;
    }
    
    if (typeof obj1 === 'object' && obj1 !== null && obj2 !== null) {
      const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      keys.forEach(key => {
        compare(obj1[key], obj2[key], path ? `${path}.${key}` : key);
      });
    } else if (obj1 !== obj2) {
      changes[path] = { before: obj1, after: obj2 };
      changed = true;
    }
  }
  
  compare(before, after);
  
  return { changed, changes };
}

/**
 * Capture all debug information
 */
export async function captureDebugInfo(
  page: Page,
  testDbPath: string,
  stepName: string,
  testArtifactsDir: string
): Promise<DebugContext> {
  const [consoleLogs, networkActivity, reactState, zustandState] = await Promise.all([
    captureConsoleLogs(page),
    captureNetworkActivity(page),
    captureReactState(page),
    captureZustandState(page),
  ]);
  
  const databaseState = captureDatabaseState(testDbPath);
  
  return {
    consoleLogs,
    networkActivity,
    reactState,
    zustandState,
    databaseState,
    executionTrace: [traceExecution(stepName)],
    screenshots: [],
  };
}

