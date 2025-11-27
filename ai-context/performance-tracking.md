# Performance Tracking Guide

## Overview

Performance tracking is **mandatory** for every feature in Anayas. This ensures we meet our performance budgets and maintain the goal of being a blazing fast, low-memory API client.

## Performance Budgets

### Memory Budgets (PRIMARY GOAL)

- **Core App**: <50MB (base app, no features)
- **Per Feature**: <50MB when active
- **Total Under Load**: <500MB

### Load Time Budgets (PRIMARY GOAL)

- **Cold Start**: <1s (app launch)
- **Warm Start**: <500ms (app restart)
- **Feature Load**: <200ms (on-demand feature)
- **Page Navigation**: <100ms (route change)

### Bundle Size Budgets (INFORMATIONAL - Not Primary)

- **Note**: Bundle size is tracked for awareness but is NOT a primary constraint
- **Main Bundle**: <2MB (core app) - tracked for reference
- **Per Feature Bundle**: <500KB average - tracked for reference
- **Total Installed**: <50MB - tracked for reference
- **Priority**: Memory and speed are PRIMARY goals, bundle size is secondary

## How to Track Performance

**PRIMARY FOCUS: Memory and Load Time**

### 1. Feature Load Tracking

Use `trackFeatureLoad()` to track when a feature loads:

```typescript
import { trackFeatureLoad } from '@/lib/performance';

// When loading a feature
const tracker = trackFeatureLoad('MonacoEditor');
await loadMonacoEditor();
const metrics = tracker.end();

// metrics contains:
// - loadTime: number (ms)
// - memoryDelta: number (MB)
// - memoryBefore: number (MB)
// - memoryAfter: number (MB)
```

**When to use:**

- Lazy-loaded components
- Heavy features (Monaco Editor, Theme Editor, etc.)
- Features that load on-demand

### 2. Bundle Size Tracking (INFORMATIONAL - Optional)

Track bundle sizes during build (in `vite.config.ts` or build script):

```typescript
import { trackBundleSize } from '@/lib/performance';

// In build script or vite plugin
trackBundleSize('feature-bundle', bundleSizeInBytes);
```

**When to use:**

- After build completes (for awareness)
- In CI/CD pipeline (for monitoring)
- When analyzing bundle sizes (informational)

**Note**: Bundle size is tracked for awareness but is NOT a blocker. Memory and speed are PRIMARY goals.

### 3. Function Execution Tracking

Measure specific function execution times:

```typescript
import { measureExecution, measureAsyncExecution } from '@/lib/performance';

// Synchronous
const result = measureExecution(() => {
  return expensiveOperation();
}, 'ExpensiveOperation');

// Asynchronous
const result = await measureAsyncExecution(async () => {
  return await fetchData();
}, 'FetchData');
```

**When to use:**

- Expensive operations
- API calls
- Data processing
- Debugging performance issues

### 4. Performance Snapshots

Get current memory usage:

```typescript
import { getPerformanceSnapshot } from '@/lib/performance';

const snapshot = getPerformanceSnapshot();
// { memory: 123.45, timestamp: 1234567890 }
```

**When to use:**

- Before/after operations
- Memory leak detection
- Performance monitoring

## Integration with Features

### In Component

```typescript
import { lazy, Suspense, useEffect } from 'react';
import { trackFeatureLoad } from '@/lib/performance';

const HeavyFeature = lazy(() => import('./HeavyFeature'));

export function MyComponent() {
  useEffect(() => {
    const tracker = trackFeatureLoad('HeavyFeature');

    // Feature loads when component mounts
    // Tracker automatically measures when lazy import resolves

    return () => {
      tracker.cancel(); // Cancel if component unmounts before load
    };
  }, []);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyFeature />
    </Suspense>
  );
}
```

### In Service

```typescript
import { trackFeatureLoad } from '@/lib/performance';

class MyService {
  private static instance: MyService | null = null;

  static async getInstance(): Promise<MyService> {
    if (!MyService.instance) {
      const tracker = trackFeatureLoad('MyService');
      MyService.instance = new MyService();
      await MyService.instance.initialize();
      tracker.end();
    }
    return MyService.instance;
  }
}
```

### In Hook

```typescript
import { useEffect } from 'react';
import { trackFeatureLoad } from '@/lib/performance';

export function useHeavyFeature() {
  useEffect(() => {
    const tracker = trackFeatureLoad('HeavyFeature');

    // Load feature
    loadFeature().then(() => {
      tracker.end();
    });

    return () => {
      tracker.cancel();
    };
  }, []);
}
```

## Performance Budget Violations

When a feature exceeds its budget, the tracker will:

1. Log a warning to console (development)
2. Include violation details in metrics
3. Alert developers to investigate

**Example warning:**

```
[Performance Warning] MonacoEditor:
Load time 250ms exceeds budget of 200ms
Memory delta 60MB exceeds budget of 50MB
```

## Best Practices

### 1. Track Early

- Add tracking when implementing the feature
- Don't add it as an afterthought

### 2. Track Consistently

- Use the same tracking approach across features
- Follow the patterns in this guide

### 3. Review Metrics

- Check metrics in development
- Investigate violations immediately
- Optimize before merging

### 4. Document Performance

- Include performance metrics in feature spec
- Update plan.md with actual metrics
- Track improvements over time

## Performance Monitoring Dashboard (Future)

In the future, we can add:

- IPC handlers to log metrics to Winston logger
- Performance dashboard in Settings page
- Historical performance data
- Alerts on regressions

## Example: Complete Feature with Tracking

```typescript
// Feature component
import { lazy, Suspense, useEffect } from 'react';
import { trackFeatureLoad } from '@/lib/performance';

const MonacoEditor = lazy(() => import('./MonacoEditor'));

export function RequestBuilder() {
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (showEditor) {
      // Track when editor loads
      const tracker = trackFeatureLoad('MonacoEditor');

      // Editor loads via lazy import
      // Tracker measures when import resolves

      return () => {
        tracker.cancel();
      };
    }
  }, [showEditor]);

  return (
    <div>
      <button onClick={() => setShowEditor(true)}>Edit JSON</button>
      {showEditor && (
        <Suspense fallback={<EditorLoadingSpinner />}>
          <MonacoEditor />
        </Suspense>
      )}
    </div>
  );
}
```

## Troubleshooting

### Memory not tracked

- Check if `performance.memory` is available (Chrome/Electron only)
- Use `getPerformanceSnapshot()` as fallback

### Load time inaccurate

- Ensure tracker starts before async operation
- Call `tracker.end()` after operation completes
- Don't forget to await async operations

### Bundle size not tracked

- Add tracking in build script
- Use vite plugin to hook into build process
- Check bundle analyzer output

## References

- `/ai-context/project-goal.md` - Performance targets and budgets
- `/ai-context/architecture.md` - Performance architecture patterns
- `/src/lib/performance.ts` - Performance tracking utility
