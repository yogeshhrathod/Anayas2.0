# Anayas Architecture

## Core Principles

1. **Strict Separation**: Main process (Electron) ↔ Renderer (React)
2. **Type Safety**: All IPC contracts typed
3. **No Node Integration**: Use preload bridge, never enable Node in renderer
4. **JSON Database**: Lightweight, fast, no heavy dependencies
5. **Zustand State**: UI state management (separate from persisted data)
6. **Performance First**: Every decision optimized for speed and memory

## File Organization

```
anayas/
├── electron/                 # Main Process (Node.js)
│   ├── main.ts              # Electron entry point
│   ├── preload.ts           # IPC bridge (typed)
│   ├── database/            # JSON database
│   ├── ipc/                 # IPC handlers
│   ├── services/            # Background services
│   └── lib/                 # Main process utilities
├── src/                     # Renderer Process (React)
│   ├── components/          # Reusable UI components
│   ├── pages/               # Page components (lazy-loaded)
│   ├── store/               # Zustand stores
│   ├── hooks/               # React hooks
│   ├── lib/                 # Shared utilities
│   └── types/               # TypeScript types
├── ai-context/              # AI context files
└── specs/                   # Feature specifications
```

## Communication Pattern

```
Renderer → window.electronAPI → Preload → IPC → Main Process → Database
```

**Rules:**
- Renderer NEVER accesses Node.js directly
- All communication through typed `window.electronAPI`
- IPC handlers validate all inputs
- Errors logged with Winston logger

## State Management

### UI State (Zustand)
- Location: `src/store/useStore.ts`
- Purpose: Temporary UI state (selected items, UI preferences)
- **NOT persisted** to database
- Cleared on app close

### Persistent Data (JSON Database)
- Location: `electron/database/json-db.ts`
- Purpose: Collections, requests, environments, history, settings
- Accessed via IPC handlers
- **Separate from UI state**

**Never mix UI state with persisted data!**

## Performance-First Architecture

### 1. Lazy Loading Strategy

#### Pages (Route-based)
```typescript
// ✅ GOOD: Lazy load pages
const Homepage = lazy(() => import('./pages/Homepage'));
const Collections = lazy(() => import('./pages/Collections'));
const History = lazy(() => import('./pages/History'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Homepage />
</Suspense>
```

#### Heavy Components
```typescript
// ✅ GOOD: Lazy load heavy components
const MonacoEditor = lazy(() => import('./components/MonacoEditor'));
const ResponseViewer = lazy(() => import('./components/ResponseViewer'));
```

#### Services
```typescript
// ✅ GOOD: Initialize services only when feature is used
let requestService: RequestService | null = null;

function getRequestService() {
  if (!requestService) {
    requestService = new RequestService();
  }
  return requestService;
}
```

### 2. Code Splitting

#### Route-based Splitting
- Each page is a separate chunk
- Loaded only when route is accessed
- Reduces initial bundle size

#### Feature-based Splitting
- Major features are separate chunks
- Example: Monaco Editor, Theme Editor, Collection Runner
- Loaded on-demand

#### Vendor Splitting
- Separate vendor chunks for better caching
- Shared dependencies in vendor bundle
- Updated less frequently

### 3. Memory Management

#### Cleanup on Unmount
```typescript
// ✅ GOOD: Clean up everything
useEffect(() => {
  const subscription = subscribe();
  return () => {
    subscription.unsubscribe(); // Cleanup
    cancelRequests(); // Cancel pending requests
    clearCache(); // Clear caches
  };
}, []);
```

#### Virtual Scrolling
- For large lists (collections, history)
- Only render visible items
- Reduces DOM nodes and memory

#### Response Streaming
- For large responses (>1MB)
- Stream instead of loading all at once
- Reduces memory spike

#### Worker Threads
- Heavy parsing in background threads
- JSON parsing, cURL parsing, etc.
- Doesn't block main thread

#### Debounced Operations
- Auto-save: 500ms debounce
- Search: 300ms debounce
- Reduces unnecessary operations

### 4. Performance Monitoring

#### Memory Tracking
```typescript
// Track memory usage per feature
const memoryBefore = performance.memory?.usedJSHeapSize || 0;
// ... load feature ...
const memoryAfter = performance.memory?.usedJSHeapSize || 0;
const memoryDelta = memoryAfter - memoryBefore;
logger.info('Feature memory usage', { feature, memoryDelta });
```

#### Load Time Tracking
```typescript
// Track feature load time
const startTime = performance.now();
await loadFeature();
const loadTime = performance.now() - startTime;
logger.info('Feature load time', { feature, loadTime });
```

#### Bundle Size Tracking
- Track bundle sizes in build
- Alert on size increases
- Set budgets per feature

## Code Patterns

### IPC Pattern
```typescript
// ✅ GOOD: Typed, validated, logged
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
  
  // Return typed result
  return collection;
}
```

### Component Pattern
```typescript
// ✅ GOOD: Lazy-loaded, memoized, typed
import { lazy, Suspense, memo } from 'react';
import { useStore } from '@/store/useStore';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

export const MyComponent = memo(() => {
  const { data } = useStore();
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent data={data} />
    </Suspense>
  );
});
```

### Service Pattern
```typescript
// ✅ GOOD: Singleton, lazy initialization
class MyService {
  private static instance: MyService | null = null;
  
  static getInstance(): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService();
    }
    return MyService.instance;
  }
  
  cleanup() {
    // Clean up resources
    MyService.instance = null;
  }
}
```

## Database Pattern

### JSON Database
- Location: `electron/database/json-db.ts`
- Lightweight, no heavy dependencies
- Fast reads/writes
- Schema migrations in `initDatabase`

### Data Access
- Always through IPC handlers
- Never direct database access from renderer
- Typed interfaces for all data

## UI Patterns

### shadcn/ui + TailwindCSS
- Use shadcn/ui components
- TailwindCSS for styling
- Follow existing component patterns
- Keep components small and focused

### Theme System
- VS Code-style theme engine
- JSON-based configuration
- Lazy load theme assets
- Support custom themes

## Performance Anti-Patterns

### ❌ DON'T: Load everything upfront
```typescript
// ❌ BAD: All imports at top
import { HeavyComponent1 } from './HeavyComponent1';
import { HeavyComponent2 } from './HeavyComponent2';
import { HeavyComponent3 } from './HeavyComponent3';
```

### ❌ DON'T: Forget cleanup
```typescript
// ❌ BAD: No cleanup
useEffect(() => {
  subscribe();
  // Missing cleanup!
}, []);
```

### ❌ DON'T: Large bundles
```typescript
// ❌ BAD: Importing entire library
import * as _ from 'lodash';
// ✅ GOOD: Import only what you need
import { debounce } from 'lodash';
```

### ❌ DON'T: Block main thread
```typescript
// ❌ BAD: Heavy operation on main thread
const result = parseLargeJSON(data); // Blocks UI
// ✅ GOOD: Use worker thread
const result = await parseLargeJSONInWorker(data);
```

## Testing Patterns

### Performance Tests
- Measure memory usage
- Measure load times
- Measure bundle sizes
- Alert on regressions

### Unit Tests
- Test utilities and hooks
- Mock IPC calls
- Test cleanup functions

### E2E Tests
- Test user workflows
- Test performance metrics
- Test memory cleanup

