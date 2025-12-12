# Code Quality Examples

## Performance-First Patterns

### ✅ GOOD: Lazy-Loaded Page Component

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

const Homepage = lazy(() => import('./pages/Homepage'));
const Collections = lazy(() => import('./pages/Collections'));

function App() {
  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      {currentPage === 'home' && <Homepage />}
      {currentPage === 'collections' && <Collections />}
    </Suspense>
  );
}
```

**Why Good:**

- Page only loads when route is accessed
- Reduces initial bundle size
- Faster startup time

### ✅ GOOD: Lazy-Loaded Heavy Component

```typescript
// src/components/RequestBuilder.tsx
import { lazy, Suspense, useState } from 'react';

const MonacoEditor = lazy(() => import('./MonacoEditor'));

export function RequestBuilder() {
  const [showEditor, setShowEditor] = useState(false);

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

**Why Good:**

- Monaco Editor only loads when needed
- Saves ~40MB memory when not editing
- Faster initial render

### ✅ GOOD: Memory-Conscious Component

```typescript
// src/components/CollectionList.tsx
import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function CollectionList({ collections }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: collections.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any caches
      virtualizer.scrollToIndex(0);
    };
  }, []);

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map((virtualItem) => (
        <CollectionItem
          key={virtualItem.key}
          collection={collections[virtualItem.index]}
          style={{
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }}
        />
      ))}
    </div>
  );
}
```

**Why Good:**

- Virtual scrolling for large lists
- Only renders visible items
- Reduces DOM nodes and memory
- Proper cleanup

### ✅ GOOD: Service with Lazy Initialization

```typescript
// electron/services/request.ts
class RequestService {
  private static instance: RequestService | null = null;
  private mainWindow: BrowserWindow | null = null;

  static getInstance(): RequestService {
    if (!RequestService.instance) {
      RequestService.instance = new RequestService();
    }
    return RequestService.instance;
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  cleanup() {
    // Cancel pending requests
    // Clear caches
    this.mainWindow = null;
    RequestService.instance = null;
  }
}
```

**Why Good:**

- Singleton pattern
- Lazy initialization
- Proper cleanup method
- Memory efficient

### ✅ GOOD: Debounced Auto-Save

```typescript
// src/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';

export function useAutoSave(data: any, saveFn: (data: any) => Promise<void>) {
  const debouncedSave = useRef(
    debounce(async (data: any) => {
      await saveFn(data);
    }, 500)
  ).current;

  useEffect(() => {
    debouncedSave(data);

    // Cleanup on unmount
    return () => {
      debouncedSave.cancel();
    };
  }, [data, debouncedSave]);
}
```

**Why Good:**

- Debounced to reduce saves
- Cancels on unmount
- Prevents memory leaks

### ✅ GOOD: Performance Tracking

```typescript
// src/lib/performance.ts
export function trackFeatureLoad(featureName: string) {
  const startTime = performance.now();
  const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

  return {
    end: () => {
      const endTime = performance.now();
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const loadTime = endTime - startTime;
      const memoryDelta = memoryAfter - memoryBefore;

      logger.info('Feature loaded', {
        feature: featureName,
        loadTime: `${loadTime.toFixed(2)}ms`,
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
      });

      // Alert if over budget
      if (loadTime > 200) {
        logger.warn('Feature load time over budget', {
          feature: featureName,
          loadTime,
        });
      }
      if (memoryDelta > 50 * 1024 * 1024) {
        logger.warn('Feature memory over budget', {
          feature: featureName,
          memoryDelta,
        });
      }
    },
  };
}

// Usage
const tracker = trackFeatureLoad('MonacoEditor');
await loadMonacoEditor();
tracker.end();
```

**Why Good:**

- Tracks load time and memory
- Alerts on budget violations
- Helps identify performance issues

## IPC Patterns

### ✅ GOOD: Typed IPC Handler

```typescript
// electron/ipc/handlers.ts
import { IpcMainInvokeEvent } from 'electron';
import { logger } from '../services/logger';
import { db } from '../database';

export async function handleCreateCollection(
  event: IpcMainInvokeEvent,
  data: CreateCollectionInput
): Promise<Collection> {
  logger.info('Creating collection', { name: data.name });

  // Validate input
  if (!data.name?.trim()) {
    throw new Error('Collection name is required');
  }

  // Database operation
  const collection = await db.createCollection(data);

  logger.info('Collection created', { id: collection.id });

  return collection;
}
```

**Why Good:**

- Typed input/output
- Input validation
- Logging for debugging
- Error handling

### ✅ GOOD: Preload API

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  collections: {
    create: (data: CreateCollectionInput) =>
      ipcRenderer.invoke('collections:create', data),
    getAll: () => ipcRenderer.invoke('collections:getAll'),
  },
});
```

**Why Good:**

- Typed API
- Clean interface
- No direct IPC access from renderer

## Component Patterns

### ✅ GOOD: Memoized Component

```typescript
// src/components/CollectionItem.tsx
import { memo } from 'react';

export const CollectionItem = memo(({ collection }: Props) => {
  return (
    <div>
      <h3>{collection.name}</h3>
      <p>{collection.description}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return prevProps.collection.id === nextProps.collection.id &&
         prevProps.collection.name === nextProps.collection.name;
});
```

**Why Good:**

- Prevents unnecessary re-renders
- Custom comparison for efficiency
- Better performance

### ✅ GOOD: Hook with Cleanup

```typescript
// src/hooks/useRequest.ts
import { useEffect, useRef } from 'react';

export function useRequest(requestId: string) {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // Cancel pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const sendRequest = async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        return;
      }
      throw error;
    }
  };

  return { sendRequest };
}
```

**Why Good:**

- Cancels requests on unmount
- Prevents memory leaks
- Prevents state updates on unmounted components

## Anti-Patterns (DON'T DO THIS)

### ❌ BAD: Load Everything Upfront

```typescript
// ❌ BAD: All imports at top
import { MonacoEditor } from './MonacoEditor';
import { ThemeEditor } from './ThemeEditor';
import { CollectionRunner } from './CollectionRunner';
// All loaded even if never used!
```

### ❌ BAD: No Cleanup

```typescript
// ❌ BAD: No cleanup
useEffect(() => {
  const subscription = subscribe();
  // Missing cleanup - memory leak!
}, []);
```

### ❌ BAD: Large Bundle Imports

```typescript
// ❌ BAD: Import entire library
import * as _ from 'lodash';
// ✅ GOOD: Import only what you need
import { debounce } from 'lodash';
```

### ❌ BAD: Block Main Thread

```typescript
// ❌ BAD: Heavy operation on main thread
const result = parseLargeJSON(data); // Blocks UI
// ✅ GOOD: Use worker thread
const result = await parseLargeJSONInWorker(data);
```

### ❌ BAD: No Performance Tracking

```typescript
// ❌ BAD: No tracking
await loadFeature();
// ✅ GOOD: Track performance
const tracker = trackFeatureLoad('Feature');
await loadFeature();
tracker.end();
```

## Testing Patterns

### Test-Driven Development (TDD)

**ALWAYS** write tests first using the Red-Green-Refactor cycle:

```typescript
// ✅ GOOD: Write test first (RED)
test('should create new feature', async ({ electronPage, testDbPath }) => {
  const result = await electronPage.evaluate(async () => {
    return await window.electronAPI.newFeature.create({ name: 'Test' });
  });
  expect(result.success).toBe(true);
});

// Then implement feature (GREEN)
// Then refactor (REFACTOR)
```

### BDD (Behavior-Driven Development)

**ALWAYS** use Given-When-Then structure:

```typescript
// ✅ GOOD: BDD structure
test('should create collection when form is submitted', async ({
  electronPage,
  testDbPath,
}) => {
  // GIVEN: User is on Collections page
  await electronPage.goto('/');
  await electronPage.click('text=Collections');

  // WHEN: User fills form and clicks Save
  await electronPage.click('button:has-text("New Collection")');
  await electronPage.fill('input#name', 'My Collection');
  await electronPage.click('button:has-text("Save")');

  // THEN: Collection should be created and visible
  const visible = await electronPage.locator('text=My Collection').isVisible();
  expect(visible).toBe(true);
});
```

### IPC Handler Tests

**ALWAYS** test all handlers with success, error, and edge cases:

```typescript
// ✅ GOOD: Complete handler test
test.describe('NewCategory IPC Handlers', () => {
  test('new-category:save - should create new category', async ({
    electronPage,
    testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.newCategory.save({ name: 'Test' });
    });
    expect(result.success).toBe(true);
    assertDataPersisted(result, testDbPath, 'categories');
  });

  test('new-category:save - should handle invalid input', async ({
    electronPage,
    testDbPath,
  }) => {
    const result = await electronPage.evaluate(async () => {
      return await window.electronAPI.newCategory.save({ name: '' });
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### ✅ GOOD: Monaco Editor with Proper Flexbox Layout

```tsx
// src/components/request/ResponseBodyView.tsx
export const ResponseBodyView: React.FC<ResponseBodyViewProps> = ({
  response,
}) => {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Fixed header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b">
        <h3>Response Body</h3>
      </div>

      {/* Monaco editor wrapper - MUST be flex container */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <MonacoEditor
          value={formattedBody}
          height="100%"
          language="json"
          readOnly={true}
          automaticLayout={true}
        />
      </div>
    </div>
  );
};
```

**Why Good:**

- Complete flex chain: parent → wrapper → Monaco
- `flex-1 min-h-0` allows Monaco to fill space and shrink
- `flex flex-col` on wrapper enables `flex-1` to work
- `overflow-hidden` prevents unwanted scrolling
- Monaco editor properly resizes with container

### ❌ BAD: Monaco Editor with Broken Flex Chain

```tsx
// ❌ BAD: Missing flex on parent
<div className="h-full">
  <div className="flex-1"> {/* flex-1 doesn't work - parent not flex */}
    <MonacoEditor height="100%" />
  </div>
</div>

// ❌ BAD: Missing flex on Monaco wrapper
<div className="flex flex-col">
  <div className="flex-1"> {/* Missing flex flex-col - flex-1 won't work */}
    <MonacoEditor height="100%" />
  </div>
</div>

// ❌ BAD: Using h-full instead of flex-1
<div className="flex flex-col">
  <div className="h-full"> {/* h-full doesn't work in flex container */}
    <MonacoEditor height="100%" />
  </div>
</div>
```

**Why Bad:**

- `flex-1` only works when parent is `display: flex`
- Missing `flex flex-col` breaks height propagation
- `h-full` doesn't work in flex containers without explicit height
- Monaco editor collapses or doesn't resize properly

### Component Integration Tests

**ALWAYS** test components with IPC integration:

```typescript
// ✅ GOOD: Component integration test
test.describe('NewComponent Component Integration', () => {
  test('should render with data from IPC', async ({
    electronPage,
    testDbPath,
  }) => {
    // GIVEN: Data exists
    await electronPage.evaluate(async () => {
      await window.electronAPI.data.create({
        /* ... */
      });
    });

    // WHEN: Component renders
    await electronPage.goto('/');
    await electronPage.waitForLoadState('networkidle');

    // THEN: Component should display data
    const component = electronPage.locator('[data-testid="new-component"]');
    await component.waitFor({ state: 'visible' });
    expect(await component.isVisible()).toBe(true);
  });
});
```

### Performance Tests

**ALWAYS** test performance for large datasets:

```typescript
// ✅ GOOD: Performance test
test('should handle 1000+ items efficiently', async ({
  electronPage,
  testDbPath,
}) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  await electronPage.evaluate(async () => {
    const promises = [];
    for (let i = 0; i < 1000; i++) {
      promises.push(
        window.electronAPI.item.create({
          /* ... */
        })
      );
    }
    await Promise.all(promises);
  });

  const duration = Date.now() - startTime;
  const memoryDelta =
    (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;

  expect(duration).toBeLessThan(30000); // <30s
  expect(memoryDelta).toBeLessThan(500); // <500MB
});
```

### Test Patterns Reference

- **IPC Handler Tests**: See `tests/integration/ipc-handlers/env-handlers.spec.ts`
- **Component Tests**: See `tests/integration/components/collection-hierarchy.spec.ts`
- **Data Flow Tests**: See `tests/integration/data-flow/full-cycle.spec.ts`
- **Performance Tests**: See `tests/integration/performance/large-datasets.spec.ts`
