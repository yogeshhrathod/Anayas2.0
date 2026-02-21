# Luna (Anayas2.0) — Comprehensive Code Review

> **Date:** 2026-02-21  
> **Project:** Luna — Professional Electron Desktop App for API Testing  
> **Stack:** React 18 + TypeScript + Electron 28 + Vite 5 + Zustand + TailwindCSS  
> **Version:** `0.0.1-alpha.7`

---

## Table of Contents

1. [🔴 Critical Issues](#-critical-issues)
2. [🟠 Security Vulnerabilities](#-security-vulnerabilities)
3. [🟡 Architecture & Design Flaws](#-architecture--design-flaws)
4. [🔵 TypeScript & Type Safety](#-typescript--type-safety)
5. [🟣 Performance Issues](#-performance-issues)
6. [⚪ Code Quality & Maintainability](#-code-quality--maintainability)
7. [🟤 Incomplete Features (TODOs)](#-incomplete-features-todos)
8. [🟢 Data Persistence & Database](#-data-persistence--database)
9. [⚫ Build, Config & DevOps](#-build-config--devops)
10. [📊 Summary & Severity Matrix](#-summary--severity-matrix)

---

## 🔴 Critical Issues

### 1. TypeScript Compilation Error — Build Breaker

**File:** `src/hooks/useRequestState.ts:348`

```
error TS2304: Cannot find name 'EntityId'.
```

The `EntityId` type is used but **never imported** in `useRequestState.ts`. This will cause the **production build to fail** (`tsc && vite build`), even though Vite's dev server tolerates it.

```typescript
// Line 348 — Missing import
const prevIdRef = useRef<EntityId | undefined>(selectedRequest?.id);
```

**Fix:** Add `import { EntityId } from '../types/entities';` at the top.

---

### 2. Massive ESLint Error Count — 2,482 Problems

Running `npx eslint .` yields:

```
✖ 2,482 problems (1,393 errors, 1,089 warnings)
```

This is an **extremely high error count** for a project of this size. Key categories:
- **1,089 `@typescript-eslint/no-explicit-any` warnings** — pervasive use of `any` across the entire codebase
- **Multiple unused variables** — dead code in handlers, test files
- **React hooks dependency issues** — potential stale closures

The `lint` script in `package.json` masks this by appending `|| true`:
```json
"lint": "eslint . || true",
```
This means **lint always exits successfully**, silently hiding all errors from CI/CD.

---

### 3. `.env` File Committed to Git with Live Secrets

**File:** `.env` (tracked in version control)

The `.env` file contains **live credentials** that are actively committed:

```
SENTRY_DSN=https://d05b1c6c0aab3736deaee734a9b06a4a@o4508971823464448.ingest.us.sentry.io/4510704746627072
SENTRY_AUTH_TOKEN=sntrys_eyJpYXQiOjE3NzE2NjEzNDcuNDU1Mzk1...
```

**Despite `.env` being listed in `.gitignore`**, the file was clearly committed at some point. The Sentry auth token is particularly dangerous — it grants **write access** to upload source maps to your Sentry project. Anyone with this token can:
- Upload arbitrary source maps
- Potentially overwrite production debugging data
- Access organization-level Sentry features

**Immediate action needed:** Rotate the `SENTRY_AUTH_TOKEN` and remove the `.env` from git history using `git filter-branch` or `bfg`.

---

### 4. `App.tsx` is a 931-Line God Component

**File:** `src/App.tsx` — **931 lines, 33KB**

This single file handles:
- All application layout and routing
- Sidebar logic, resizing, and sections
- Dialog state management (5+ dialogs)
- Keyboard shortcut registration (20+ shortcuts)
- Data loading / initialization
- Export/import logic
- Drag-and-drop for unsaved requests
- Clear all unsaved requests
- Collection duplication logic
- Theme loading
- Performance tracking
- Splash screen orchestration
- Onboarding flow

This violates the **Single Responsibility Principle** and makes the file extremely difficult to maintain, test, or review.

---

## 🟠 Security Vulnerabilities

### 5. Anonymous User Tracking Uses Machine-Identifiable Data

**File:** `electron/sentry.ts:203-218`

```typescript
function getAnonymousUserId(): string {
  const machineId = `${os.hostname()}-${os.userInfo().username}-${os.platform()}`;
  return crypto.createHash('sha256').update(machineId).digest('hex').substring(0, 16);
}
```

Despite being called "anonymous," this creates a **deterministic hash from the user's hostname and username**. While SHA256 makes reversal impractical, the same user will always produce the same ID, enabling **cross-session tracking**. If the hostname or username is known, the hash can be trivially reproduced. Combined with `sendDefaultPii: false`, this creates a false sense of privacy.

---

### 6. Input Validation Missing on IPC Handlers

**File:** `electron/ipc/handlers.ts`

All IPC handlers accept data directly from the renderer process with **zero validation**:

```typescript
ipcMain.handle('env:save', async (_, env) => {
  if (env.id) {
    updateEnvironment(env.id, {
      name: env.name,          // No validation
      displayName: env.displayName,
      variables: env.variables || {},
    });
  }
});
```

There's no:
- Type checking on incoming data
- Length limits on strings
- Sanitization of variable names/values
- Protection against prototype pollution via `Object.assign(env, updates)` (line 399)

While Electron's context isolation provides some protection, a compromised renderer process or malicious preload script could inject arbitrary data.

---

### 7. `nodeIntegration: false` but `require()` Still Used

**File:** `electron/sentry.ts:206-207`

```typescript
const crypto = require('crypto');
const os = require('os');
```

Using CommonJS `require()` in the main process is fine (it's Node.js), but the pattern is inconsistent with the rest of the codebase which uses ES module imports. This isn't a security issue per se, but mixing module systems causes confusion.

---

## 🟡 Architecture & Design Flaws

### 8. JSON File as Database — No Concurrency Protection

**File:** `electron/database/json-db.ts`

The entire application data is stored as a **single JSON file** (`database.json`):

```typescript
export function saveDatabase(): void {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}
```

Problems:
- **No write locking** — Multiple save calls can corrupt the file if they overlap (e.g., rapid auto-save + manual save)
- **Entire DB rewritten on every single change** — Adding one header to a request rewrites the entire database
- **No transactions or rollback** — A crash during `writeFileSync` corrupts the database
- **No backup mechanism** — Database corruption means total data loss
- **Scales poorly** — As history grows, save operations become increasingly slow
- **`writeFileSync` blocks the main process** — This freezes the entire Electron app during large writes

**Recommendation:** At minimum, add a debounced write with atomic file writing (write to temp, then rename). Better: migrate to SQLite (which `better-sqlite3` is already a dev dependency for).

---

### 9. Duplicate Type Definitions Between Preload and Source

Types are defined **three separate times** with subtle inconsistencies:

| Location | `Request.body` | `Request.isFavorite` | `Collection.isFavorite` |
|---|---|---|---|
| `src/types/entities.ts` | `string` (required) | `number` (required) | `number` (required) |
| `electron/preload.ts` | `string \| null` (optional) | `number` (optional) | `number` (optional) |
| `src/types/forms.ts` | `string` | `boolean` | `boolean` |

This causes runtime confusion — the preload layer sends `null` for body, the renderer expects `string`, and forms use `boolean` for favorites. There is no single source of truth.

---

### 10. Zustand Store Persists `selectedRequest` with Full Response Data

**File:** `src/store/useStore.ts:386`

```typescript
partialize: state => ({
  // ...
  selectedRequest: state.selectedRequest,
  activeUnsavedRequestId: state.activeUnsavedRequestId,
  currentPage: state.currentPage,
}),
```

`selectedRequest` is persisted to localStorage, and it includes `lastResponse` which can contain **megabytes of response body data**. This:
- Bloats localStorage beyond browser limits (typically 5-10MB)
- Slows app startup as the entire response is parsed from JSON on every load
- Creates stale data — the persisted response may not match the database

---

### 11. `Set` Serialization Workaround

**File:** `src/store/useStore.ts:377,390-398`

```typescript
partialize: state => ({
  expandedCollections: Array.from(state.expandedCollections),
  // ...
}),
onRehydrateStorage: () => state => {
  if (state) {
    state.expandedCollections = new Set(
      state.expandedCollections as unknown as number[]
    );
  }
},
```

Using `as unknown as number[]` is a code smell. Zustand's `persist` middleware doesn't handle `Set` natively, so the code manually serializes/deserializes. The `expandedSidebarSections: Set<string>` is NOT included in `partialize`, meaning it's persisted via a **separate mechanism** (`sidebar.setState` in the database), creating two sources of truth.

---

### 12. `CollectionHierarchy.tsx` — 1,329 Lines of Deeply Nested JSX

**File:** `src/components/CollectionHierarchy.tsx` — **1,329 lines, 51KB**

Despite the file's own comment claiming it's "refactored" and "much smaller and more maintainable," this component:
- Contains **530+ lines of JSX render output** with 6+ levels of nesting
- Duplicates drag-and-drop event handlers inline for collections, folders, and requests
- Has identical `onDragOver`, `onDrop`, `onDragEnter`, `onDragLeave` blocks repeated 4+ times
- Mixes business logic (API calls, state management) with rendering

---

## 🔵 TypeScript & Type Safety

### 13. Pervasive Use of `any` — 1,089 Warnings

The `any` type is used extensively across **50+ files**, including:

| File | Occurrences | Impact |
|---|---|---|
| `electron/ipc/handlers.ts` | 40+ | All IPC data is untyped |
| `electron/database/json-db.ts` | 15+ | All CRUD operations use `any` params |
| `src/store/useStore.ts` | 5+ | Settings, selectedItem.data |
| `src/App.tsx` | 10+ | Requests, collections, dialog state |
| `src/components/CollectionHierarchy.tsx` | 5+ | Error handling, drag data |

Key problematic patterns:
```typescript
// Database stores everything as any
interface Database {
  environments: any[];
  collections: any[];
  folders: any[];
  requests: any[];
  // ...
}

// Store settings is completely untyped
settings: Record<string, any>;
setSettings: (settings: Record<string, any>) => void;

// Selected item data is any
selectedItem: { type: ...; id: EntityId | null; data: any; };
```

---

### 14. `EntityId` Type Union Causes Confusion

**File:** `src/types/entities.ts:117`

```typescript
export type EntityId = number | string;
```

This means every ID comparison must account for both types. The database generates `number` IDs, but unsaved requests use `string` IDs (e.g., `"unsaved-12345"`). This leads to unsafe casts throughout:

```typescript
await window.electronAPI.request.delete(requestId as any);
await window.electronAPI.request.reorder(requestId as any, newOrder);
```

---

### 15. `ElectronAPI` Interface Out of Sync with Preload

**File:** `src/types/api.ts:139-200`

The `ElectronAPI` interface in `api.ts` is missing many methods that the preload exposes:
- Missing: `unsavedRequest.*`, `preset.*`, `curl.*`, `import.*`, `sidebar.*`, `app.*`, `window.*`, `notification.*`, `file.saveFile`, `file.readFile`, `file.writeFile`, `file.selectDirectory`
- Missing: `collection.addEnvironment`, `collection.updateEnvironment`, `collection.deleteEnvironment`, `collection.setActiveEnvironment`, `collection.run`, `collection.onUpdated`
- Missing: `request.get`, `request.onUpdated`, `request.onHistoryUpdated`, `request.clearAllHistory`
- Missing: `env.import`, `env.export`, `env.detectFormat`, `env.getSupportedFormats`, `env.setCurrent`
- Missing: `folder.saveAfter`, `folder.reorder`, `folder.onUpdated`

This interface is **never actually used** — the code accesses `window.electronAPI` directly, bypassing any type checking. The `electron.d.ts` file is just:
```typescript
interface Window {
  electronAPI: any;
}
```

---

### 16. `isFavorite` Type Mismatch Between Layers

The favorite field changes type across three boundaries:

- **Database layer:** `isFavorite` is stored as `number` (0 or 1)
- **Entity types:** `isFavorite: number`
- **Form types:** `isFavorite: boolean`
- **UI layer:** Converts between them inconsistently

```typescript
// In useRequestState
isFavorite: Boolean(selectedRequest.isFavorite),  // number → boolean

// In useRequestActions
isFavorite: requestData.isFavorite ? 1 : 0,  // boolean → number

// In CollectionHierarchy
isFavorite: 0,  // Hardcoded as number
```

This constant type juggling is a source of subtle bugs.

---

## 🟣 Performance Issues

### 17. Excessive Re-renders from Store Extraction Pattern

**File:** `src/App.tsx:75-103`

```typescript
const currentPage = useStore(state => state.currentPage);
const setCurrentPage = useStore(state => state.setCurrentPage);
const setEnvironments = useStore(state => state.setEnvironments);
const setCurrentEnvironment = useStore(state => state.setCurrentEnvironment);
const collections = useStore(state => state.collections);
const setCollections = useStore(state => state.setCollections);
// ... 25+ more individual selectors
```

While individual selectors are better than destructuring the entire store, **29 separate `useStore` calls** in a single component means 29 separate subscriptions. Any change to any of these values triggers a re-render of the **entire 931-line App component** and all its children. Combined with the heavy render logic, this creates unnecessary re-render cascading.

---

### 18. `saveDatabase()` is Synchronous and Blocks the Main Process

**File:** `electron/database/json-db.ts:288-294`

```typescript
export function saveDatabase(): void {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}
```

`fs.writeFileSync` blocks the **entire Electron main process**. Every request save, every settings change, every sidebar toggle calls this. As the database grows (especially `request_history` capped at 1,000 entries), the serialization + write time increases, causing visible UI freezes.

---

### 19. Repeated `.find()` Calls on Same Request

**File:** `src/components/CollectionHierarchy.tsx:400-416`

```typescript
onMoveRequest: async (requestId, targetCollectionId, targetFolderId) => {
  await window.electronAPI.request.save({
    id: requestId as any,
    name: requests.find(r => r.id === requestId)?.name || '',
    method: (requests.find(r => r.id === requestId)?.method as any) || 'GET',
    url: requests.find(r => r.id === requestId)?.url || '',
    headers: requests.find(r => r.id === requestId)?.headers || {},
    body: requests.find(r => r.id === requestId)?.body || '',
    queryParams: requests.find(r => r.id === requestId)?.queryParams || [],
    auth: requests.find(r => r.id === requestId)?.auth || { type: 'none' },
    // ...
    isFavorite: requests.find(r => r.id === requestId)?.isFavorite || 0,
  });
}
```

The same `requests.find(r => r.id === requestId)` is called **8 times** for the same request ID. This should be a single lookup stored in a variable.

---

### 20. Auto-Save Creates Excessive Writes

**File:** `src/hooks/useRequestState.ts`

Two separate auto-save mechanisms run simultaneously:
1. **Saved requests:** Auto-saves after 1 second of inactivity (lines 326-345)
2. **Unsaved requests:** Auto-saves after 1 second of inactivity (lines 362-377)

Both trigger on **every keystroke** (after debounce). For unsaved requests, this means:
- Every character typed in URL → full request serialized → IPC call → JSON file rewritten
- After each save, all unsaved requests are reloaded (`getAll()`) → full list returned via IPC
- Sidebar refresh is triggered → all collections/requests reloaded

---

## ⚪ Code Quality & Maintainability

### 21. Extensive `console.log` Statements in Production Code

`console.log` is scattered across **10+ source files**:

```typescript
// src/App.tsx
console.log('Show shortcuts help');
console.log('Save request');
console.log('Add folder');
console.log('New collection');

// src/store/useStore.ts
console.log('[Store] setEnvironmentToEdit called with:', { environmentId, variableName });
console.log('[Store] environmentToEditId set to:', environmentId);

// src/components/CollectionHierarchy.tsx
console.log('Edit collection:', collection.id);
console.log('Edit folder:', folder.id);
console.log('Edit request:', request.id);
console.log('Export request:', request.id);
console.log('Import collection:', collection.id);
console.log('Export collection:', collection.id);
```

These are debug artifacts left in production code, cluttering the console and potentially leaking information.

---

### 22. Empty Event Handlers as Placeholders

Multiple handlers are wired up but do nothing:

```typescript
// CollectionHierarchy.tsx — 5 instances
onEdit={() => { console.log('Edit collection:', collection.id); }}
onEdit={() => { console.log('Edit folder:', folder.id); }}
onEdit={() => { console.log('Edit request:', request.id); }}
onExport={() => { console.log('Export request:', request.id); }}
onImport={() => { console.log('Import collection:', collection.id); }}
onExport={() => { console.log('Export collection:', collection.id); }}
```

These make the UI appear functional (context menu items show up) but the features don't work, creating a deceptive user experience.

---

### 23. Duplicate ESLint Config Files

Two ESLint config files exist:
- `eslint.config.js` (1,218 bytes)
- `eslint.config.mjs` (1,220 bytes — nearly identical)

Only one is needed. ESLint will use one and ignore the other, creating confusion about which config is active.

---

### 24. Cleanup Code Missing in `useEffect`

**File:** `src/hooks/useRequestState.ts:341-343`

```typescript
return () => {
  if (autoSaveTimeoutRef.current) {
    // Empty cleanup — timeout is referenced but not cleared!
  }
};
```

The cleanup function checks if a timeout exists but **doesn't actually clear it**. This means when the component unmounts or the effect re-runs, the old timeout is not canceled and will fire with stale data.

---

### 25. `alert()` Used for Critical Errors

**File:** `src/App.tsx:586`

```typescript
} catch (error) {
  console.error('Failed to load initial data:', error);
  alert('Failed to load application data. Please restart the application.');
}
```

Using `alert()` in an Electron app with `frame: false` is:
- Jarring and unprofessional
- Blocks the main thread
- Doesn't match the app's design language (it has a toast system)

---

### 26. `lastGeneratedFilePath` Variable Never Used

**File:** `electron/main.ts:18`

```typescript
let lastGeneratedFilePath: string | null = null;
```

This variable is declared but **never read or assigned** anywhere in the file. Dead code.

---

## 🟤 Incomplete Features (TODOs)

The codebase has **11 TODOs** in production source code representing **unimplemented features**:

| Location | TODO | Impact |
|---|---|---|
| `App.tsx:201` | `// TODO: Implement shortcut help dialog` | ❌ Help shortcut does nothing |
| `App.tsx:219` | `// TODO: Implement folder editing` | ❌ Folder rename broken |
| `App.tsx:357` | `// TODO: Trigger send request action` | ❌ Keyboard shortcut for send doesn't work |
| `App.tsx:362` | `// TODO: Trigger save request action` | ❌ Keyboard shortcut for save doesn't work |
| `App.tsx:406` | `// TODO: Implement new folder creation` | ❌ Keyboard shortcut for new folder broken |
| `App.tsx:411` | `// TODO: Implement new collection creation` | ❌ Keyboard shortcut for new collection broken |
| `useConfirmation.ts:50` | `// TODO: Replace with proper modal` | Uses browser `confirm()` dialog |
| `useShortcutContext.ts:31` | `// TODO: Get this from App.tsx or store` | Sidebar state hardcoded to `true` |
| `performance.ts:110` | `// TODO: Send to IPC handler` | Performance data not persisted |
| `performance.ts:144` | `// TODO: Send to IPC handler` | Performance warnings not logged |
| `performance.ts:172` | `// TODO: Send to IPC handler` | Performance data not sent to main process |

---

## 🟢 Data Persistence & Database

### 27. ID Generation Uses `Date.now()` — Collision Risk

**File:** `electron/database/json-db.ts:52-61`

```typescript
let lastId = Date.now();
export function generateUniqueId(): number {
  const now = Date.now();
  if (now <= lastId) {
    lastId += 1;
  } else {
    lastId = now;
  }
  return lastId;
}
```

Issues:
- **IDs are predictable** — they're just timestamps
- **Collision after restart** — if the app restarts within the same millisecond (unlikely but possible), duplicate IDs can occur
- **No uniqueness guarantee across imports** — importing collections from another Luna instance could create ID conflicts
- **The workaround in collection duplication** reveals this concern:
  ```typescript
  // Small delay to ensure unique IDs
  await new Promise(resolve => setTimeout(resolve, 1));
  ```

---

### 28. No Data Migration Strategy

The database uses ad-hoc migration checks:

```typescript
if (!db.folders) {
  db.folders = [];
}
if (!db.unsaved_requests) {
  db.unsaved_requests = [];
}
if (!db.presets) {
  db.presets = [];
}
```

There's no versioning, no migration tracking, no rollback capability, and no way to know which migrations have been applied. As the schema evolves, this approach will become unsustainable.

---

### 29. Unsaved Request Cleanup Race Condition

**File:** `src/components/CollectionHierarchy.tsx:254-258`

```typescript
const { setActiveUnsavedRequestId, setUnsavedRequests } = useStore.getState();
if (data.id) {
  setActiveUnsavedRequestId(null);
}
```

After promoting an unsaved request, the code clears `activeUnsavedRequestId`. However, the auto-save timer in `useRequestState.ts` might fire between the promotion and the cleanup, creating a new unsaved request from the same data.

---

### 30. Delete Collection Doesn't Clean Up History

**File:** `electron/database/json-db.ts:340-346`

```typescript
export function deleteCollection(id: number): void {
  db.collections = db.collections.filter(c => c.id !== id);
  db.folders = db.folders.filter(f => f.collectionId !== id);
  db.requests = db.requests.filter(r => r.collectionId !== id);
  saveDatabase();
}
```

When a collection is deleted, its folders and requests are removed, but **request history, presets, and unsaved requests** referencing these entities are **not cleaned up**. This creates orphaned data.

---

## ⚫ Build, Config & DevOps

### 31. Global Build Script Always Publishes

**File:** `package.json:10`

```json
"build": "tsc && vite build && electron-builder --publish always",
```

`--publish always` means **every local build attempt will try to publish** to GitHub Releases. This should be `--publish never` for local builds, with `always` only in CI/CD.

---

### 32. Dev Server Always Opens DevTools

**File:** `electron/main.ts:46`

```typescript
if (process.env.VITE_DEV_SERVER_URL) {
  mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  mainWindow.webContents.openDevTools();
}
```

DevTools are **always opened** in development, even if not needed. There's no flag to disable them.

---

### 33. `better-sqlite3` Listed as DevDependency but Never Used

**File:** `package.json:65`

```json
"@types/better-sqlite3": "^7.6.8",
```

The type definitions for `better-sqlite3` are installed, but `better-sqlite3` itself is not a dependency and is never imported. This is leftover from a planned SQLite migration that was never implemented. The database uses plain JSON files instead.

---

### 34. Sentry Replay at 10% Session Rate

**File:** `src/lib/sentry-renderer.ts:114`

```typescript
replaysSessionSampleRate: 0.1, // 10% of sessions
replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
```

Session replays capture UI interactions including potentially sensitive API data (headers, auth tokens, request bodies). For an API testing tool, this is a **privacy concern**. Even at 10%, users' API interactions are being recorded.

---

### 35. `tracesSampleRate: 1.0` — 100% Transaction Sampling

**Files:** `electron/sentry.ts:95`, `src/lib/sentry-renderer.ts:88`

```typescript
tracesSampleRate: 1.0, // Capture 100% of transactions
```

In production, sampling **100% of transactions** generates excessive data and can impact:
- App performance (serialization overhead for every operation)
- Sentry billing (transaction-based pricing)
- User privacy (every navigation and API call is tracked)

---

## 📊 Summary & Severity Matrix

| Category | Count | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| **Critical / Build-Breaking** | 3 | 3 | — | — | — |
| **Security** | 3 | 1 | 2 | — | — |
| **Architecture** | 5 | — | 3 | 2 | — |
| **Type Safety** | 4 | — | 2 | 2 | — |
| **Performance** | 4 | — | 2 | 2 | — |
| **Code Quality** | 6 | — | — | 4 | 2 |
| **Incomplete Features** | 11 | — | 3 | 5 | 3 |
| **Data/Persistence** | 4 | — | 2 | 2 | — |
| **Build/Config** | 5 | — | 2 | 2 | 1 |
| **TOTAL** | **45** | **4** | **16** | **19** | **6** |

---

## Recommended Priority Actions

### Immediate (Do Now)
1. **Rotate Sentry auth token** — The committed token is compromised
2. **Fix TypeScript build error** in `useRequestState.ts` — Blocks production builds  
3. **Fix the `lint` script** — Remove `|| true` to surface errors

### Short-Term (This Sprint)
4. **Split `App.tsx`** into smaller components (routing, sidebar, dialogs, shortcuts)
5. **Create a single source of truth** for entity types (remove preload duplicates)
6. **Make `saveDatabase()` async** — Use `fs.writeFile` instead of `writeFileSync`
7. **Add input validation** to IPC handlers
8. **Remove all `console.log`** debug statements

### Medium-Term (Next 2-4 Sprints)
9. **Reduce `any` usage** — Target < 50 instances (currently 1,000+)
10. **Implement proper database** (SQLite or at minimum atomic JSON writes)
11. **Extract drag-and-drop logic** from CollectionHierarchy into reusable hooks
12. **Add database versioning** and proper migration system
13. **Implement the TODO features** or remove the dead shortcut registrations

### Long-Term (Backlog)
14. **Add comprehensive test coverage** — Currently tests exist but are not run in CI
15. **Review Sentry configuration** — Reduce trace/replay sampling rates
16. **Consider moving to a proper state management pattern** for request data flow
17. **Implement data backup/restore** for the JSON database

---

*This document should be reviewed and updated as issues are resolved. Each fix should reference the issue number from this document for traceability.*
