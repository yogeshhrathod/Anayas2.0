# Common Utilities Reference

## When to Create New vs Reuse

### ✅ Reuse When:
- Utility exists and can be extended
- Functionality is similar
- Can be parameterized for your use case

### ❌ Don't Create When:
- Duplicate existing functionality
- Can use existing utility with minor changes
- Functionality already exists in a library

### ✅ Create When:
- Truly new functionality needed
- No existing utility matches
- Performance-critical custom implementation needed

## Renderer Utilities (`src/lib/`)

### `utils.ts`
**Purpose**: Tailwind class merging utility

```typescript
import { cn } from '@/lib/utils';

// Usage: Merge Tailwind classes
<div className={cn('base-class', condition && 'conditional-class')} />
```

**When to use**: Always use this for className merging in components

### `curl-parser.ts`
**Purpose**: Parse cURL commands into request objects

```typescript
import { parseCurl } from '@/lib/curl-parser';

const request = parseCurl('curl -X POST https://api.example.com -H "Content-Type: application/json"');
```

**When to use**: When importing cURL commands

**Performance**: Uses regex parsing, consider worker thread for large commands

### `curl-generator.ts`
**Purpose**: Generate cURL commands from request objects

```typescript
import { generateCurl } from '@/lib/curl-generator';

const curlCommand = generateCurl({
  method: 'POST',
  url: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' },
  body: '{"key":"value"}',
});
```

**When to use**: When exporting requests as cURL

**Performance**: Fast, no performance concerns

### `themes.ts`
**Purpose**: Theme management and utilities

```typescript
import { getTheme, applyTheme, getAvailableThemes } from '@/lib/themes';

const theme = getTheme('dark');
applyTheme(theme);
const themes = getAvailableThemes();
```

**When to use**: Theme-related operations

**Performance**: Themes are lazy-loaded, no upfront cost

### `keymap.ts`
**Purpose**: Keyboard shortcut definitions and utilities

```typescript
import { getKeymap, registerShortcut } from '@/lib/keymap';

const keymap = getKeymap();
registerShortcut('cmd+k', () => openCommandPalette());
```

**When to use**: Keyboard shortcut management

**Performance**: Lightweight, no performance concerns

### `draftNaming.ts`
**Purpose**: Generate draft request names

```typescript
import { generateDraftName } from '@/lib/draftNaming';

const name = generateDraftName(); // "New Request", "New Request 2", etc.
```

**When to use**: When creating new requests

**Performance**: Fast, no performance concerns

### Z-Index Management (Tailwind Config)
**Purpose**: Centralized z-index values using Tailwind config extension

**Approach**: Define z-index values in `tailwind.config.js` under `theme.extend.zIndex` for semantic class names.

```javascript
// tailwind.config.js
theme: {
  extend: {
    zIndex: {
      'base': '0',
      'content': '10',
      'sticky': '100',
      'dropdown': '1000',
      'popover': '1500',
      'context-menu': '2000',
      'modal-backdrop': '3000',
      'modal': '3500',
      'dialog': '3500',
      'dialog-dropdown': '3501',
      'tooltip': '5000',
      'global-search': '7000',
      'toast': '9000',
    }
  }
}
```

**Usage in components**:
```tsx
// Use semantic Tailwind classes - no imports needed
<div className="fixed inset-0 z-dialog">
  {/* Dialog content */}
</div>

<div className="z-dropdown">
  {/* Dropdown */}
</div>
```

**When to use**: 
- Always use semantic Tailwind z-index classes (`z-dialog`, `z-dropdown`, etc.)
- Never hardcode z-index values like `z-[9999]` or `z-[10000]`
- Add new z-index values to `tailwind.config.js` if needed
- Use `z-dialog-dropdown` for dropdowns that appear inside dialogs

**Benefits**:
- Type-safe via Tailwind IntelliSense autocomplete
- No runtime overhead (no string interpolation or imports)
- Better purging (Tailwind optimizes unused classes)
- Cleaner, more readable code
- Consistent with Tailwind patterns

**Performance**: No performance impact - classes are compiled at build time

## Main Process Utilities (`electron/services/`)

### `logger.ts`
**Purpose**: Winston logger for main process

```typescript
import { createLogger } from './services/logger';

const logger = createLogger('feature-name');

logger.info('Message', { data });
logger.error('Error', { error });
logger.warn('Warning', { data });
```

**When to use**: Always use this in main process, never `console.log`

**Performance**: Async logging, no performance impact

### `request.ts` (RequestService)
**Purpose**: HTTP request service

```typescript
import { RequestService } from './services/request';

const service = RequestService.getInstance();
const response = await service.sendRequest({
  method: 'POST',
  url: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' },
  body: '{"key":"value"}',
});
```

**When to use**: All HTTP requests from main process

**Performance**: Uses fetch API, efficient

**Memory**: Singleton pattern, lazy initialization

### `variable-resolver.ts`
**Purpose**: Resolve variables in strings ({{variableName}})

```typescript
import { resolveVariables } from './services/variable-resolver';

const resolved = resolveVariables(
  'https://{{base_url}}/api/{{endpoint}}',
  { base_url: 'https://api.example.com', endpoint: 'users' }
);
// Result: 'https://api.example.com/api/users'
```

**When to use**: When resolving environment variables

**Performance**: Fast regex-based, no performance concerns

### `api.ts` (ApiService)
**Purpose**: API service wrapper

```typescript
import { apiService } from './services/api';

const response = await apiService.get('/endpoint');
```

**When to use**: API calls from main process

**Performance**: Wraps RequestService, same performance

## Main Process Libraries (`electron/lib/`)

### `curl-parser.ts`
**Purpose**: Parse cURL commands (main process version)

```typescript
import { parseCurl } from './lib/curl-parser';

const request = parseCurl('curl -X POST https://api.example.com');
```

**When to use**: When parsing cURL in main process

**Performance**: Consider worker thread for large commands

### `curl-generator.ts`
**Purpose**: Generate cURL commands (main process version)

```typescript
import { generateCurl } from './lib/curl-generator';

const curl = generateCurl(requestObject);
```

**When to use**: When generating cURL in main process

**Performance**: Fast, no performance concerns

## Database Utilities (`electron/database/`)

### `json-db.ts`
**Purpose**: JSON-based database operations

```typescript
import { db } from './database';

const collection = await db.createCollection(data);
const collections = await db.getAllCollections();
await db.updateCollection(id, data);
await db.deleteCollection(id);
```

**When to use**: All database operations

**Performance**: Fast reads/writes, lightweight

**Memory**: Efficient, no heavy dependencies

## React Hooks (`src/hooks/`)

### `useShortcuts.ts`
**Purpose**: Keyboard shortcut handling

```typescript
import { useShortcuts } from '@/hooks/useShortcuts';

useShortcuts();
```

**When to use**: In main App component

**Performance**: Event listeners, efficient

### `useSessionRecovery.ts`
**Purpose**: Recover unsaved requests on startup

```typescript
import { useSessionRecovery } from '@/hooks/useSessionRecovery';

useSessionRecovery();
```

**When to use**: In main App component

**Performance**: Runs once on startup, efficient

## Performance Utilities

### Performance Tracking (to be created)
**Purpose**: Track feature load times and memory usage

```typescript
import { trackFeatureLoad } from '@/lib/performance';

const tracker = trackFeatureLoad('FeatureName');
await loadFeature();
tracker.end();
```

**When to use**: When loading features on-demand

**Performance**: Minimal overhead, valuable metrics

## Utility Creation Guidelines

### Before Creating a New Utility:

1. **Search existing utilities**: Check `src/lib/` and `electron/lib/`
2. **Check if library exists**: Can you use an existing npm package?
3. **Consider performance**: Is this performance-critical?
4. **Consider reusability**: Will others need this?
5. **Document usage**: Add examples and performance notes

### Utility Template

```typescript
/**
 * [Utility Name]
 * 
 * Purpose: [What this utility does]
 * 
 * Performance: [Performance characteristics]
 * Memory: [Memory impact]
 * 
 * @example
 * ```typescript
 * import { utilityFunction } from '@/lib/utility';
 * const result = utilityFunction(input);
 * ```
 */
export function utilityFunction(input: InputType): OutputType {
  // Implementation
}
```

## Common Patterns

### Debouncing
```typescript
import { debounce } from 'lodash';

const debouncedFn = debounce((value: string) => {
  // Do something
}, 300);
```

**When to use**: Search, auto-save, input validation

### Memoization
```typescript
import { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

**When to use**: Expensive calculations, derived values

### Lazy Loading
```typescript
import { lazy } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

**When to use**: Heavy components, features not always used

