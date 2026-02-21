# Luna (Anayas2.0) — Deep Code Inspection Report

> **Date:** 2026-02-21  
> **Project:** Luna — Professional Electron Desktop App for API Testing  
> **Stack:** React 18 + TypeScript + Electron 28 + Vite 5 + Zustand + TailwindCSS  
> **Version:** `0.0.1-alpha.7`  
> **Scope:** Code-level bugs, vulnerabilities, crash points, performance, coding practices, invalid logic.  
> *(TypeScript/ESLint type-only issues excluded per request)*

---

## Table of Contents

1.  [🔴 Crash & Data Loss Risks](#1--crash--data-loss-risks)
2.  [🛡️ Security Vulnerabilities](#2-️-security-vulnerabilities)
3.  [🐛 Logic Bugs & Invalid Behavior](#3--logic-bugs--invalid-behavior)
4.  [🐌 Performance Bottlenecks](#4--performance-bottlenecks)
5.  [🧱 Coding Practice Issues](#5--coding-practice-issues)
6.  [🔍 Dead Code & Incomplete Features](#6--dead-code--incomplete-features)
7.  [📊 Summary Matrix](#7--summary-matrix)

---

## 1. 🔴 Crash & Data Loss Risks

### 1.1 — `writeFileSync` Can Corrupt Database on Crash

**File:** `electron/database/json-db.ts:288-294`  
**Severity:** 🔴 Critical

```typescript
export function saveDatabase(): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Failed to save database', { error });
  }
}
```

**The Problem:**  
- `JSON.stringify` is called first — if the DB is very large (1,000+ history entries with response bodies), the serialization happens in memory. If the app crashes mid-`writeFileSync`, the file will be **partially written** and contain truncated JSON.
- On next startup, `JSON.parse(data)` will throw a `SyntaxError`, and the catch block creates a **blank database** — all user data is lost.
- `writeFileSync` **blocks the Node.js event loop** in the main process, freezing the entire Electron app.
- Every single CRUD operation calls `saveDatabase()` synchronously. A rapid sequence (e.g., importing 50 requests) calls it 50 times.

**Impact:** App freeze + potential total data loss on crash.

**Fix:** Use atomic writes (write to `database.json.tmp`, then `fs.renameSync`), or switch to async writes with a write queue.

---

### 1.2 — Auto-Save Timeout Cleanup is Incomplete

**File:** `src/hooks/useRequestState.ts:341-344` (previous version had empty cleanup)  
**Severity:** 🟠 High

The auto-save mechanism has TWO simultaneous debounce timers:
1. **Saved requests** (`autoSaveTimeoutRef`) at line 326
2. **Unsaved requests** (`unsavedSaveTimeoutRef`) at line 367

Both fire on **every keystroke** (after 1s debounce) and both trigger `saveDatabase()`. This means:
- Typing a single URL character triggers **two** separate save chains
- Each save chain refreshes all unsaved requests and triggers sidebar refresh
- If the component rapidly unmounts/remounts (e.g., switching requests), stale timeout refs can fire on the wrong request data

---

### 1.3 — `No Environment Selected` Crashes Request Send

**File:** `electron/ipc/handlers.ts:633-635`  
**Severity:** 🟠 High

```typescript
if (!globalEnv) {
  throw new Error('No environment selected');
}
```

If the user deletes all environments and tries to send a request, this `throw` propagates up. The renderer-side catch (in `useRequestActions.ts:204`) catches it, but the error message "No environment selected" is confusing — the user might not realize environments are required.

**Worse:** The `collection:run` handler at line 808-810 has the same pattern. Running a collection with no environments crashes the entire collection runner, returning a generic error with no partial results.

---

### 1.4 — History Rerun Crashes on Malformed Headers

**File:** `src/pages/History.tsx:250-253`  
**Severity:** 🟠 High

```typescript
const headers = typeof request.headers === 'string'
  ? JSON.parse(request.headers)
  : request.headers || {};
```

`JSON.parse` is called **without a try/catch**. If `request.headers` is a malformed string (corrupted in DB, or from an older version), this throws an unhandled exception. This same unguarded pattern appears at **6 different locations** in History.tsx (lines 252, 320, 343, 379, 900, 916).

**Impact:** Clicking "Rerun", "Go to Request", "Copy cURL", or "Copy Data" on a history item with corrupted headers crashes the page.

---

### 1.5 — Database Initialization Silently Creates Empty DB on Parse Error

**File:** `electron/database/json-db.ts:151-163`  
**Severity:** 🔴 Critical

```typescript
} catch (error) {
  logger.error('Failed to load database, creating new one', { error });
  db = {
    environments: [],
    collections: [],
    // ... all empty
  };
}
```

If `JSON.parse(data)` fails (corrupted file, disk error, encoding issue), the app silently creates an empty database. **All existing user data is permanently lost** with no recovery option, no backup, and only a log entry.

---

### 1.6 — `useSessionRecovery` Dependencies Missing

**File:** `src/hooks/useSessionRecovery.ts:53`  
**Severity:** 🟡 Medium

```typescript
}, []); // Only run on mount
```

The `useEffect` references `setUnsavedRequests`, `setSelectedRequest`, `activeUnsavedRequestId`, and `setCurrentPage` but has an empty dependency array. If Zustand re-creates these functions (which it does if the store structure changes), the hook uses stale references. React's strict mode in dev will run this twice, potentially causing duplicate data loads.

---

### 1.7 — `collection:run` Passes Function as IPC Argument

**File:** `electron/ipc/handlers.ts:796`  
**Severity:** 🟠 High

```typescript
ipcMain.handle('collection:run', async (_, collectionId, onProgress) => {
```

IPC in Electron **cannot pass functions** between processes. `onProgress` from the renderer will always be `undefined` in the main process. Lines 967-994 check `if (onProgress && typeof onProgress === 'function')` but this will always be `false`. The progress callback never fires — the UI shows no progress during collection runs.

---

### 1.8 — `app:getPath` Accepts Arbitrary Path Names

**File:** `electron/ipc/handlers.ts:1130-1132`  
**Severity:** 🟡 Medium

```typescript
ipcMain.handle('app:getPath', async (_, name) => {
  return app.getPath(name as any);
});
```

If a malicious renderer sends `app:getPath` with an invalid path name, Electron will throw an unhandled error (e.g., `app.getPath('passwords')`). This is not caught, and the resulting unhandled promise rejection crashes the IPC handler.

---

## 2. 🛡️ Security Vulnerabilities

### 2.1 — Live Sentry Auth Token Committed to Git

**File:** `.env` (tracked in repo)  
**Severity:** 🔴 Critical

```
SENTRY_AUTH_TOKEN=sntrys_eyJpYXQiOjE3NzE2NjEzNDcuNDU1Mzk1...
```

This token has **write access** to your Sentry project. Anyone with this can:
- Upload/overwrite source maps
- Create releases
- Access organization-level Sentry APIs
- Potentially expose debugging data for production users

**Action:** Rotate this token immediately. Remove from git history with `git filter-branch` or `bfg`.

---

### 2.2 — `Object.assign` Prototype Pollution Vector

**File:** `electron/ipc/handlers.ts:399`  
**Severity:** 🟠 High

```typescript
Object.assign(env, updates);
```

In the `collection:updateEnvironment` handler, `updates` comes directly from the renderer with **zero validation**. A malicious payload like `{ "__proto__": { "admin": true } }` could pollute the `Object` prototype, affecting all objects in the main process.

While `contextIsolation: true` provides some protection, a compromised renderer (e.g., via XSS in a response body rendered unsafely) could exploit this to escalate privileges in the main process.

---

### 2.3 — Arbitrary File Read/Write via IPC

**File:** `electron/ipc/handlers.ts:1107-1123`  
**Severity:** 🟠 High

```typescript
ipcMain.handle('file:read', async (_, filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return { success: true, content };
});

ipcMain.handle('file:write', async (_, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  return { success: true };
});
```

These handlers accept **any file path** from the renderer process. There's no:
- Path validation (no check against directory traversal)
- Allowlist of permitted directories
- Size limits on content
- Permission checks

A compromised renderer could read `/etc/passwd` or write to any file the user has access to.

**Even the "file:save" handler** bypasses this concern because it uses `dialog.showSaveDialog()` — but `file:write` does not.

---

### 2.4 — Notification Click Opens Arbitrary File Paths

**File:** `electron/ipc/handlers.ts:1174-1178`  
**Severity:** 🟡 Medium

```typescript
notification.on('click', async () => {
  const { shell } = require('electron');
  await shell.openPath(options.filePath!);
});
```

`shell.openPath` will **execute any file** the user has access to. If a renderer passes `/usr/bin/rm -rf /` as `filePath`, clicking the notification could execute it. `shell.openPath` opens files with their default handler, which for scripts could mean execution.

---

### 2.5 — Request Headers Logged to File

**File:** `electron/services/api.ts:39`  
**Severity:** 🟠 High

```typescript
logger.info(`API Request: ${options.method} ${url}`, { headers });
```

**All request headers** — including `Authorization` tokens, API keys, and session cookies — are logged to `combined.log` on disk. For an API testing tool, this means every auth token the user sends is persisted in plain text log files.

The log files have `maxsize: 3MB` and `maxFiles: 3`, meaning up to **9MB of headers with auth tokens** can accumulate on disk.

---

### 2.6 — Variable Context Logged with All Variables

**File:** `electron/services/variable-resolver.ts:67-70`  
**Severity:** 🟡 Medium

```typescript
logger.warn(`Variable not resolved: ${variableName}`, {
  match,
  context,  // Contains ALL global and collection variables
});
```

When a variable isn't resolved, the **entire variable context** (including all environment secrets like API keys stored as variables) is logged. This happens for every typo in variable names.

---

### 2.7 — `DSN` Hardcoded as Fallback

**File:** `electron/sentry.ts` and `src/lib/sentry-renderer.ts`  
**Severity:** 🟡 Medium

If the environment variable isn't set, the Sentry DSN falls back to the hardcoded value in `.env`, which is **the same production DSN**. This means development errors are mixed with production errors, and the DSN is effectively public.

---

## 3. 🐛 Logic Bugs & Invalid Behavior

### 3.1 — History Status Filter Only Considers 200 as "Success"

**File:** `src/pages/History.tsx:162-164`  
**Severity:** 🟡 Medium

```typescript
(filterStatus === 'success' && request.status === 200) ||
(filterStatus === 'error' && request.status !== 200)
```

Only HTTP `200` is treated as success. This means:
- `201 Created` → Error ❌
- `204 No Content` → Error ❌
- `301 Redirect` → Error ❌
- `304 Not Modified` → Error ❌

All 2xx and 3xx status codes should be considered success.

---

### 3.2 — Delete Collection Doesn't Clean Up Related Data

**File:** `electron/database/json-db.ts:340-346`  
**Severity:** 🟡 Medium

```typescript
export function deleteCollection(id: number): void {
  db.collections = db.collections.filter(c => c.id !== id);
  db.folders = db.folders.filter(f => f.collectionId !== id);
  db.requests = db.requests.filter(r => r.collectionId !== id);
  saveDatabase();
}
```

**Not cleaned up:**
- `request_history` entries referencing deleted `collectionId` → orphaned data grows indefinitely
- `presets` linked to deleted `requestId` → preset list shows ghosts
- `unsaved_requests` that reference deleted collections → potential confusion
- The store's `selectedRequest` may still point to a deleted request → crash when saving

---

### 3.3 — `deleteFolder` Doesn't Clean Up Presets for Deleted Requests

**File:** `electron/database/json-db.ts:436-441`  
**Severity:** 🟡 Medium

```typescript
export function deleteFolder(id: number): void {
  db.folders = db.folders.filter(f => f.id !== id);
  db.requests = db.requests.filter(r => r.folderId !== id);
  saveDatabase();
}
```

When deleting a folder, associated requests are deleted, but `presets` and `request_history` for those requests are not cleaned up.

---

### 3.4 — ID Generation Collision After Rapid Operations

**File:** `electron/database/json-db.ts:52-61`  
**Severity:** 🟡 Medium

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

**Problems:**
1. After app restart, `Date.now()` resets. If two items are created at the same millisecond across restarts, IDs collide.
2. The import feature generates IDs rapidly (during bulk import). The collection duplication code even has a workaround: `await new Promise(resolve => setTimeout(resolve, 1))` — acknowledging the problem.
3. After extended use, `lastId` can drift significantly from `Date.now()`, producing confusing timestamps.

---

### 3.5 — Unsaved Request Auto-Save Fires Even When Nothing Changed

**File:** `src/hooks/useRequestState.ts:367-382`  
**Severity:** 🟡 Medium

```typescript
useEffect(() => {
  unsavedSaveTimeoutRef.current = setTimeout(() => {
    autoSaveUnsaved();
  }, 1000);
  //...
}, [state.requestData, autoSaveUnsaved]);
```

There's **no dirty check**. Every time `state.requestData` changes (including when it's initialized from `selectedRequest`), the timer fires. This means:
- Clicking on a saved request triggers `autoSaveUnsaved()` with the saved request's data
- The `autoSaveUnsaved` callback checks `selectedRequest?.id` to skip saved requests, but the check is done at callback creation time (via `useCallback` deps), not at execution time — potential stale closure

---

### 3.6 — `request:send` Fails Silently If No Environments Exist

**File:** `electron/ipc/handlers.ts:629-635`  
**Severity:** 🟡 Medium

```typescript
if (!globalEnv) {
  throw new Error('No environment selected');
}
```

Fresh installs seed a demo environment in `initDatabase`. But if the user deletes all environments, **every request will fail** with "No environment selected" even though the request might not use any variables. The variable resolver should gracefully handle missing environments.

---

### 3.7 — `addFolderAfter` Order Calculation Can Produce Identical Orders

**File:** `electron/database/json-db.ts:389-394`  
**Severity:** 🟡 Medium

```typescript
order = afterOrder + Math.floor(((nextFolder.order || 0) - afterOrder) / 2);
if (order === afterOrder) {
  order = afterOrder + 1;
}
```

If `afterOrder = 5` and `nextFolder.order = 6`, then:
- `order = 5 + Math.floor((6 - 5) / 2) = 5 + 0 = 5`
- `5 === 5` so `order = 6`
- Now **two folders** have `order = 6`, breaking the sort

This applies to `addRequestAfter` as well (same logic at line 490).

---

### 3.8 — `handleSaveDialogSave` Doesn't Clear Unsaved Draft

**File:** `src/components/ApiRequestBuilder.tsx:226-280`  
**Severity:** 🟡 Medium

When an unsaved request is saved to a collection via the Save Dialog:
1. The request is saved via `window.electronAPI.request.save()`
2. `requestState.setIsSaved(true)` is called
3. The `selectedRequest` in the store is updated

But `activeUnsavedRequestId` is **never cleared** and the unsaved request is **never deleted** from the database. Result: The sidebar still shows the unsaved draft, and the auto-save timer keeps writing to it.

---

### 3.9 — `sendRequest` Dependency Array Missing Critical Values

**File:** `src/hooks/useRequestActions.ts:223`  
**Severity:** 🟡 Medium

```typescript
}, [requestData, showSuccess, showError, selectedRequest]);
```

Missing from dependencies:
- `currentEnvironment` — If the user switches environments, `sendRequest` still uses the old environment
- `activeUnsavedRequestId` — If the ID changes, `sendRequest` still uses the old one
- `setSelectedRequest` — Used inside but not in deps
- `triggerSidebarRefresh` — Used inside but not in deps

This causes **stale closure bugs** where sending a request uses outdated environment or ID values.

---

### 3.10 — Variable Resolver Converts Falsy Values to Empty String

**File:** `electron/services/variable-resolver.ts:138-148`  
**Severity:** 🟡 Medium

```typescript
if (context.collectionVariables && context.collectionVariables[variableName]) {
  return context.collectionVariables[variableName];
}
```

If a variable is set to `"0"`, `""`, or `"false"`, the truthy check `context.collectionVariables[variableName]` returns `false`, and the variable resolves to empty string instead of its actual value. The user explicitly set `{{port}}` to `"0"` but it resolves to `""`.

---

## 4. 🐌 Performance Bottlenecks

### 4.1 — `saveDatabase()` Called 50+ Times During Collection Import

**File:** `electron/ipc/handlers.ts:1485-1602` + `electron/database/json-db.ts`  
**Severity:** 🔴 Critical

During `import:execute`, the handler calls:
1. `addCollection()` → `saveDatabase()` (1x)
2. `addFolder()` for each folder → `saveDatabase()` (N times)
3. `addRequest()` for each request → `saveDatabase()` (M times)
4. `saveDatabase()` for environments (1x)

For a Postman collection with 10 folders and 50 requests, this is **62 synchronous file writes** of the entire database. Each write:
- Serializes the entire DB to JSON
- Writes synchronously (blocking the main process)
- Causes the app to freeze for the duration

**Same pattern affects:** Bulk cURL import, collection duplication, environment import.

---

### 4.2 — Repeated `.find()` Calls for Same Item

**File:** `src/components/CollectionHierarchy.tsx:400-416`  
**Severity:** 🟡 Medium

```typescript
name: requests.find(r => r.id === requestId)?.name || '',
method: (requests.find(r => r.id === requestId)?.method) || 'GET',
url: requests.find(r => r.id === requestId)?.url || '',
headers: requests.find(r => r.id === requestId)?.headers || {},
body: requests.find(r => r.id === requestId)?.body || '',
queryParams: requests.find(r => r.id === requestId)?.queryParams || [],
auth: requests.find(r => r.id === requestId)?.auth || { type: 'none' },
isFavorite: requests.find(r => r.id === requestId)?.isFavorite || 0,
```

**8 `.find()` calls** for the same `requestId`. This is O(8*N) when it should be O(N) with a single lookup.

---

### 4.3 — Dual Auto-Save Timers Fire on Every Keystroke

**File:** `src/hooks/useRequestState.ts:326-382`  
**Severity:** 🟠 High

Two independent `useEffect` hooks watch `state.requestData`:
1. Lines 326-346: For saved requests (calls `autoSave` → IPC → `saveDatabase()`)
2. Lines 367-382: For unsaved requests (calls `autoSaveUnsaved` → IPC → `saveDatabase()`)

Each keystroke:
1. Clears both old timeouts
2. Sets two new 1-second timeouts
3. Both fire independently after 1 second
4. Both call `saveDatabase()` via IPC
5. The unsaved save also calls `getAll()` to reload all unsaved requests

**Net effect:** After every pause in typing, the database is written **twice**, and the entire unsaved request list is fetched.

---

### 4.4 — Sidebar Refresh Triggers Full Data Reload

**File:** `src/components/CollectionHierarchy.tsx` (multiple locations)  
**Severity:** 🟡 Medium

`triggerSidebarRefresh()` is called after:
- Every auto-save (both saved and unsaved)
- Every request save
- Every collection CRUD operation
- Every folder CRUD operation
- Every drag-and-drop

The sidebar component watches `sidebarRefreshTrigger` and reloads **all collections, all requests, and all folders** from the database on every trigger. With a large workspace, this is expensive.

---

### 4.5 — Binary Response Bodies Stored as Base64 in JSON

**File:** `electron/services/api.ts:76-78`  
**Severity:** 🟡 Medium

```typescript
const buffer = await response.arrayBuffer();
responseBody = Buffer.from(buffer).toString('base64');
```

Binary responses (images, PDFs, etc.) are base64-encoded (33% size increase) and stored in:
- The request history (in `database.json`)
- The `lastResponse` field of requests
- The Zustand store (persisted to `localStorage`)

A 5MB image response becomes a 6.7MB string stored in the JSON database. Multiple such responses quickly balloon the database file.

---

### 4.6 — `filteredHistory` Recalculated on Every Render

**File:** `src/pages/History.tsx:134-197`  
**Severity:** 🟡 Medium

```typescript
const filteredHistory = requestHistory.filter((request: any) => {
  // Complex filtering logic with Date parsing and string operations
});
```

This is **not memoized**. Every re-render (keystroke in search, any state change) re-runs the filter on the entire history array. History can have up to 1,000 entries, each with Date parsing and string operations.

The `groupedHistory` below **is** memoized with `useMemo`, but its input `filteredHistory` isn't, so the memoization is partially ineffective.

---

### 4.7 — `ApiRequestBuilder` Re-registers 13 Keyboard Listeners on Every Data Change

**File:** `src/components/ApiRequestBuilder.tsx:74-214`  
**Severity:** 🟡 Medium

```typescript
useEffect(() => {
  // ... 13 event listeners created
  document.addEventListener('keydown', handleSaveRequest);
  // ... 12 more
  return () => {
    document.removeEventListener('keydown', handleSaveRequest);
    // ... 12 more
  };
}, [requestState.requestData, requestActions]);
```

The dependency array includes `requestState.requestData` and `requestActions`. **Both change on every keystroke** (since `requestData` changes). This means:
1. 13 event listeners are removed
2. 13 new event listeners are added
3. This happens on **every single keypress**

---

### 4.8 — `selectedRequest` with `lastResponse` Persisted to localStorage

**File:** `src/store/useStore.ts:386`  
**Severity:** 🟡 Medium

```typescript
partialize: state => ({
  selectedRequest: state.selectedRequest,
  // ...
}),
```

`selectedRequest` includes `lastResponse` which contains the full response body. A 2MB JSON response means 2MB written to localStorage on every state change. localStorage has a 5-10MB limit — a few large responses will hit the limit and cause `QuotaExceededError`, silently breaking persistence.

---

## 5. 🧱 Coding Practice Issues

### 5.1 — `alert()` Used for Critical Error

**File:** `src/App.tsx:586`  
**Severity:** 🟡 Medium

```typescript
alert('Failed to load application data. Please restart the application.');
```

Using `alert()` in a frameless Electron app (`frame: false`):
- Blocks the entire renderer process
- Appears as a generic OS dialog with no Luna branding
- Cannot be styled or customized
- The app has a toast system (`useToastNotifications`) that should be used instead

---

### 5.2 — `confirm()` Used for Destructive Actions

**File:** `src/pages/History.tsx:233`  
**Severity:** 🟡 Medium

```typescript
if (!confirm('Are you sure you want to delete this request from history?')) return;
```

Same issue as `alert()`. The app has a `useConfirmation` hook (which itself has a TODO to replace `confirm()`) but it's not used consistently. Found in:
- `History.tsx:233` — Delete history item
- `useConfirmation.ts:50` (the hook itself uses `confirm()`)

---

### 5.3 — Inconsistent Error Handling Patterns

The codebase has 4 different error handling patterns:

| Pattern | Files | Problem |
|---|---|---|
| `catch (error) { console.error(...) }` | 15+ files | Silent failure, user unaware |
| `catch (error) { showError(...) }` | 10+ files | Good — user gets feedback |
| `catch (error) { return [] }` | IPC handlers | Swallows error, returns empty |
| `catch (error) { throw error }` | entity CRUD | Re-throws without user feedback |

The IPC handlers are particularly dangerous — `unsaved-request:get-all` returns `[]` on error (line 1226), making it impossible to distinguish "no unsaved requests" from "database error."

---

### 5.4 — Console Debug Statements in Production Code

Found **30+ `console.log` statements** that are purely debug artifacts:

```typescript
// App.tsx
console.log('Show shortcuts help');
console.log('Save request');
console.log('Add folder');
console.log('New collection');

// useStore.ts
console.log('[Store] setEnvironmentToEdit called with:', { environmentId, variableName });

// CollectionHierarchy.tsx
console.log('Edit collection:', collection.id);
console.log('Edit folder:', folder.id);

// handlers.ts
console.log('[Import] Detecting format, content length:', content?.length || 0);
console.log('[Import] Format detection result:', result);
console.log('[Import] Parsing content, format:', format);
```

These pollute the console, leak internal implementation details, and indicate unfinished features (several `console.log` calls are placeholders for actual implementation).

---

### 5.5 — Empty Event Handlers Mislead Users

**File:** `src/components/CollectionHierarchy.tsx` (5+ locations)  
**Severity:** 🟡 Medium

```typescript
onEdit={() => { console.log('Edit collection:', collection.id); }}
onEdit={() => { console.log('Edit folder:', folder.id); }}
onExport={() => { console.log('Export request:', request.id); }}
```

Context menu items appear fully functional but do **nothing** except log. The user clicks "Edit Folder" and nothing happens, making the app feel broken. These should either be implemented or removed from the context menu.

---

### 5.6 — Inconsistent `isFavorite` Type Between Layers

The `isFavorite` field changes type 3 times in a single request lifecycle:

```
Database (number: 0|1) 
  → Entity Types (number) 
  → Form Types (boolean) 
  → Save Handler (number: ternary conversion)
```

Every save operation does `isFavorite: requestData.isFavorite ? 1 : 0`. Every load does `Boolean(selectedRequest.isFavorite)`. This constant conversion is:
- Error-prone (what if someone passes `2`?)
- Unclear (is `0` "not favorite" or "unset"?)
- Violates the principle of a single source of truth

---

### 5.7 — `useCallback` Dependency Arrays Missing Values

Multiple `useCallback` hooks have incomplete dependency arrays. Beyond the `sendRequest` example (3.9), the `autoSave` callback in `useRequestState.ts` references `state.requestData` from the outer scope but doesn't include it in its dependency array — relying instead on a `stateRef` workaround that still has timing issues.

---

### 5.8 — `broadcast` Function Sends to All Windows

**File:** `electron/ipc/handlers.ts:54-58`  
**Severity:** Low

```typescript
const broadcast = (channel: string, payload?: any) => {
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send(channel, payload);
  });
};
```

While Luna currently has only one window, this broadcasts to **all** windows. If a second window is ever opened (About, Settings, DevTools), it will receive collection/request update events it doesn't handle.

---

## 6. 🔍 Dead Code & Incomplete Features

### 6.1 — 11 TODO Shortcuts That Do Nothing

| Location | Shortcut | What User Sees |
|---|---|---|
| `App.tsx:201` | `Cmd+?` | Nothing happens |
| `App.tsx:219` | Folder edit | Can't rename folders |
| `App.tsx:357` | `Cmd+Enter` | Should send request — doesn't |
| `App.tsx:362` | `Cmd+S` | Should save request — doesn't |
| `App.tsx:406` | `Cmd+Shift+N` | Should create folder — doesn't |
| `App.tsx:411` | `Cmd+Shift+C` | Should create collection — doesn't |

**Note:** The `ApiRequestBuilder` component registers its **own** `Cmd+S` and `Cmd+Enter` shortcuts. This means the App-level shortcuts are dead code that will conflicts if both are active simultaneously.

---

### 6.2 — `lastGeneratedFilePath` Never Used

**File:** `electron/main.ts:18`  
**Severity:** Low (dead code)

```typescript
let lastGeneratedFilePath: string | null = null;
```

Declared but never read or assigned anywhere.

---

### 6.3 — Performance Tracking Never Sends Data

**File:** `src/lib/performance.ts:110-173`  
**Severity:** Low (dead feature)

Three TODO comments indicate performance metrics should be sent to the main process via IPC, but the IPC handlers don't exist:
```typescript
// TODO: Send to IPC handler to log to Winston logger in main process
// window.electronAPI?.performance?.logMetrics(metrics);
```

Performance tracking runs, logs to console in dev, but **never persists data**, making it useless for actual performance analysis.

---

### 6.4 — Duplicate ESLint Config Files

**Files:** `eslint.config.js` (1,218 bytes) and `eslint.config.mjs` (1,220 bytes)  
**Severity:** Low

Two nearly identical configurations. ESLint 9 uses flat config — only one file is active.

---

### 6.5 — `better-sqlite3` Types Installed but Library Not Used

**File:** `package.json:65`  
**Severity:** Low (dead dependency)

```json
"@types/better-sqlite3": "^7.6.8"
```

Type definitions for a SQLite library that was never adopted (the project uses JSON files).

---

### 6.6 — `lint` Script Always Passes

**File:** `package.json:13`  

```json
"lint": "eslint . || true",
```

The `|| true` means lint always exits with code 0, even with 1,393 errors. CI/CD will never catch lint failures.

---

### 6.7 — `build` Script Always Publishes

**File:** `package.json:10`  

```json
"build": "tsc && vite build && electron-builder --publish always",
```

`--publish always` attempts to **publish to GitHub Releases** on every local build. Should be `--publish never` locally.

---

## 7. 📊 Summary Matrix

### By Severity

| Severity | Count | Categories |
|---|---|---|
| 🔴 **Critical** | 5 | Data loss (1.1, 1.5), security (2.1), performance (4.1) |
| 🟠 **High** | 10 | Crashes (1.2-1.4, 1.7-1.8), security (2.2-2.3, 2.5), performance (4.3) |
| 🟡 **Medium** | 22 | Logic bugs, performance, practices |
| ⚪ **Low** | 7 | Dead code, minor issues |
| **TOTAL** | **44** | |

### By Category

| Category | Count | Most Impactful |
|---|---|---|
| **Crash & Data Loss** | 8 | Corrupted DB → total data loss |
| **Security** | 7 | Auth token leaked, file read/write |
| **Logic Bugs** | 10 | Wrong status filter, orphaned data |
| **Performance** | 8 | 62 sync writes during import |
| **Coding Practices** | 8 | alert(), inconsistent error handling |
| **Dead Code / Incomplete** | 7 | 6 broken keyboard shortcuts |

### Priority Actions

**🔴 Do Today:**
1. Rotate Sentry auth token (2.1)
2. Add atomic writes to `saveDatabase` (1.1)
3. Add DB backup before startup (1.5)
4. Validate/sanitize file paths in `file:read`/`file:write` (2.3)

**🟠 Do This Week:**
5. Batch `saveDatabase` calls during imports (4.1)
6. Add try/catch around `JSON.parse` in History.tsx (1.4)
7. Remove header logging or redact auth headers (2.5)
8. Fix `Object.assign` prototype pollution (2.2)
9. Fix stale closure in `sendRequest` deps (3.9)

**🟡 Do This Sprint:**
10. Fix status filter to include all 2xx/3xx (3.1)
11. Clean up orphaned data on collection/folder delete (3.2, 3.3)
12. Memoize `filteredHistory` (4.6)
13. Remove `console.log` debug statements (5.4)
14. Implement or remove empty event handlers (5.5)
15. Fix keyboard listener churn in ApiRequestBuilder (4.7)

---

*This document should be reviewed and updated as issues are resolved. Each fix should reference the issue number for traceability.*
