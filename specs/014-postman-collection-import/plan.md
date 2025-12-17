# Implementation Plan: Postman Collection Import

**Feature ID**: `014-postman-collection-import`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Implement an extensible collection import system using the Strategy Pattern, starting with Postman v1 and v2.x format support. The architecture allows easy addition of future formats (Insomnia, OpenAPI, HAR) without modifying core import logic.

## Existing Code Analysis

### Similar Features to Reference

- [x] Feature: `specs/001-curl-import-export/` - Parser pattern, IPC structure, dialog design
- [x] Implementation: `electron/lib/curl-parser.ts` - Parsing logic patterns

### Components to Reuse

- [x] Component: `src/components/ui/Dialog.tsx` - Base dialog for import UI
- [x] Component: `src/components/ui/Button.tsx` - Action buttons
- [x] Component: `src/components/ui/ScrollArea.tsx` - Preview scrollable area
- [x] Component: `src/components/ui/Progress.tsx` - Import progress bar

### Hooks to Reuse

- [x] Hook: `src/hooks/useToastNotifications.ts` - Success/error notifications
- [x] Hook: `src/hooks/useClickOutside.ts` - Dialog close handling

### Utilities to Reuse

- [x] Utility: `src/lib/utils.ts` - Common utility functions
- [x] Utility: `electron/database/json-db.ts` - Database operations

### Types to Extend

- [x] Type: `src/types/entities.ts` - Collection, Folder, Request interfaces
- [x] Type: `src/types/electron.d.ts` - Add import API types

### Services to Reuse

- [x] Service: `electron/services/logger.ts` - Logging import operations

### Integration Points

- **Page**: Sidebar collections section
- **Existing Button/Action**: Collections header actions (add Import button next to New Collection)
- **Existing Component**: CollectionHierarchy sidebar section

### New Components Needed

- [x] New Component: `ImportCollectionDialog.tsx` - Main import dialog with file selection and preview
- [x] New Component: `ImportPreview.tsx` - Shows collection tree before import
- [x] New Component: `ImportProgress.tsx` - Progress indicator for large imports

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- [x] Yes - Import feature is lazy-loaded, parsers loaded on-demand, memory cleaned after import

**Are there more reusable or cleaner ways to achieve the same?**

- Strategy Pattern enables clean separation of format parsers
- Normalized ImportResult interface allows reuse across all formats
- Parser factory centralizes format detection logic

**Architecture Compliance:**

- [x] Follows architecture.md patterns (lazy loading, code splitting, memory management)
- [x] Uses common-utils.md utilities (avoids duplication)
- [x] Matches example-quality.md standards (performance patterns)
- [x] No architecture violations (no upfront loading, proper cleanup)

## Performance Implementation Plan

### Lazy Loading Strategy (REQUIRED)

- **How feature loads on-demand**:
  - Import button always visible in sidebar
  - Import dialog loads when button clicked
  - Format parsers loaded only when file is selected
- **Trigger**: User clicks "Import Collection" button
- **Loading State**: Dialog opens immediately with file picker, shows spinner while parsing
- **Code**:
  ```typescript
  const ImportCollectionDialog = lazy(() => import('./ImportCollectionDialog'));
  ```

### Code Splitting Plan (Supports Lazy Loading)

- **Separate Bundle**: Yes - Import feature in separate chunk
- **Bundle Type**: Feature-based splitting
- **Structure**:
  - `import-dialog.chunk.js` - UI components
  - `postman-parser.chunk.js` - Postman parsers (loaded when Postman format detected)

### Bundle Size (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: ~50KB (parsers) + ~30KB (UI components) = ~80KB total

### Memory Management Plan

- **Memory Budget**: <100MB during large imports
- **Cleanup Strategy**:
  - [x] File handles released after reading
  - [x] Parser instances garbage collected after parse
  - [x] Parsed data cleared after database write
  - [x] Dialog state reset on close
- **Cleanup Code Location**: `useEffect` cleanup in `ImportCollectionDialog`

### Performance Tracking Implementation (MANDATORY)

- **Memory Tracking** (PRIMARY):
  ```typescript
  // In import handler
  const memBefore = process.memoryUsage().heapUsed;
  const result = await parseCollection(content);
  const memAfter = process.memoryUsage().heapUsed;
  logger.info('Import memory', { delta: (memAfter - memBefore) / 1024 / 1024 });
  ```
- **Load Time Tracking** (PRIMARY):
  ```typescript
  const startTime = performance.now();
  const result = await window.electronAPI.import.parse(content);
  logger.info('Import parse time', { time: performance.now() - startTime });
  ```

### Performance Budget Verification (PRIMARY GOALS)

- **Memory** (PRIMARY): [Estimated: 30-50MB] [Target: <100MB] [Status: ✅]
- **Load Time** (PRIMARY): [Estimated: 150ms] [Target: <200ms] [Status: ✅]

## Files to Modify/Create (with WHY)

### New Files

#### Main Process (Electron)

1. `electron/lib/import/types.ts`
   **WHY**: Shared TypeScript interfaces for import strategies, results, and validation. Separates type definitions from implementation for clean imports.

2. `electron/lib/import/import-strategy.ts`
   **WHY**: Base abstract class/interface defining the Strategy Pattern contract. All format parsers implement this interface.

3. `electron/lib/import/import-factory.ts`
   **WHY**: Factory class that manages registered strategies and auto-detects format. Central point for adding new formats.

4. `electron/lib/import/postman-v1-parser.ts`
   **WHY**: Dedicated parser for legacy Postman v1 format. Separate file allows tree-shaking if not used.

5. `electron/lib/import/postman-v2-parser.ts`
   **WHY**: Parser for current Postman v2.x format. Most commonly used format.

6. `electron/lib/import/index.ts`
   **WHY**: Public exports. Controls what's exposed from the import module.

#### Renderer Process (React)

1. `src/components/import/ImportCollectionDialog.tsx`
   **WHY**: Main dialog component handling file selection, preview, and import execution. Lazy-loaded for performance.

2. `src/components/import/ImportPreview.tsx`
   **WHY**: Reusable preview component showing collection tree. Can be used for other import formats.

3. `src/components/import/ImportProgress.tsx`
   **WHY**: Progress indicator for large imports. Provides feedback during long operations.

4. `src/components/import/index.ts`
   **WHY**: Public exports for import components.

### Modified Files

1. `electron/ipc/handlers.ts`
   **WHY**: Add IPC handlers for import operations. Following existing pattern for curl handlers.

2. `electron/preload.ts`
   **WHY**: Expose import APIs to renderer via contextBridge. Type-safe bridge.

3. `src/types/electron.d.ts`
   **WHY**: Add TypeScript definitions for new import APIs. Enables type checking in renderer.

4. `src/components/sidebar/CollectionsSidebar.tsx` (or equivalent)
   **WHY**: Add "Import Collection" button in sidebar header.

## Architecture Decisions

### Decision 1: Strategy Pattern for Import Formats

**Context**: Need to support multiple import formats (Postman v1, v2, future: Insomnia, OpenAPI, HAR) without complex conditional logic.

**Options Considered**:

- Option A: Single parser with format conditionals - Simple but grows complex with more formats
- Option B: Strategy Pattern with pluggable parsers - Clean separation, easy extension

**Decision**: Option B - Strategy Pattern  
**Rationale**:

- Each format is isolated and testable
- Adding new formats doesn't modify existing code (Open/Closed Principle)
- Enables lazy loading of specific parsers
- Clean factory pattern for format detection

**Trade-offs**: Slightly more initial setup, but much better maintainability

### Decision 2: Normalized ImportResult Interface

**Context**: Different formats have different structures, but we need a unified way to process import results.

**Options Considered**:

- Option A: Format-specific handling throughout the app - Tight coupling to format
- Option B: Normalize all formats to a common interface - Clean boundary

**Decision**: Option B - Normalized interface  
**Rationale**:

- Database operations work with one interface
- UI components work with one interface
- Format conversion happens in one place (the parser)

### Decision 3: Auto-Detection vs Manual Format Selection

**Context**: Users may not know which Postman format version they have.

**Options Considered**:

- Option A: Require manual format selection - Error-prone
- Option B: Auto-detect format from file content - Better UX

**Decision**: Option B - Auto-detection with fallback  
**Rationale**:

- Better user experience
- Reduce errors from wrong format selection
- Fallback to manual selection if detection fails

### Decision 4: Preview Before Import

**Context**: Users need confidence about what will be imported.

**Decision**: Show full preview with tree structure before committing  
**Rationale**:

- Prevents accidental imports
- Shows potential issues before they happen
- Allows users to verify data integrity

## Implementation Phases

### Phase 1: Core Infrastructure

**Goal**: Set up the Strategy Pattern foundation and types  
**Duration**: 1-2 days

**Tasks**:

- [x] Create shared types (`types.ts`)
- [x] Create base strategy interface (`import-strategy.ts`)
- [x] Create factory with format detection (`import-factory.ts`)
- [x] Set up file structure and exports

**Dependencies**: None  
**Deliverables**: Working import infrastructure ready for parsers

### Phase 2: Postman v2 Parser

**Goal**: Parse current Postman Collection v2.x format  
**Duration**: 2-3 days

**Tasks**:

- [x] Implement Postman v2.1 parser
- [x] Handle folder hierarchy (including nested)
- [x] Parse all request fields
- [x] Handle auth types (bearer, basic, API key)
- [x] Parse environment variables
- [x] Unit tests for v2 parser

**Dependencies**: Phase 1  
**Deliverables**: Working Postman v2 import

### Phase 3: Postman v1 Parser

**Goal**: Parse legacy Postman Collection v1 format  
**Duration**: 1-2 days

**Tasks**:

- [x] Implement Postman v1 parser
- [x] Handle v1-specific folder structure
- [x] Convert v1 fields to normalized format
- [x] Unit tests for v1 parser

**Dependencies**: Phase 1  
**Deliverables**: Working Postman v1 import

### Phase 4: IPC Layer

**Goal**: Wire up import functionality to Electron IPC  
**Duration**: 1 day

**Tasks**:

- [x] Add import IPC handlers
- [x] Expose via preload
- [x] Add type definitions
- [x] Integration tests

**Dependencies**: Phase 2, Phase 3  
**Deliverables**: Import accessible from renderer

### Phase 5: UI Components

**Goal**: Create import dialog and preview UI  
**Duration**: 2-3 days

**Tasks**:

- [x] Create ImportCollectionDialog
- [x] Create ImportPreview with tree view
- [x] Create ImportProgress indicator
- [x] Add to sidebar with button
- [x] Handle loading, error, success states
- [x] Integration tests

**Dependencies**: Phase 4  
**Deliverables**: Complete import UI

### Phase 6: Testing & Polish

**Goal**: Comprehensive testing and edge case handling  
**Duration**: 1-2 days

**Tasks**:

- [x] E2E tests for full import flow
- [x] Performance tests with large collections
- [x] Error handling for all edge cases
- [x] Accessibility review
- [x] Documentation

**Dependencies**: Phase 5  
**Deliverables**: Production-ready feature

## File Structure

### New Files

```
electron/lib/import/
├── types.ts                    # Shared types
├── import-strategy.ts          # Base strategy interface
├── import-factory.ts           # Strategy factory
├── postman-v1-parser.ts        # Postman v1 parser
├── postman-v2-parser.ts        # Postman v2 parser
└── index.ts                    # Public exports

src/components/import/
├── ImportCollectionDialog.tsx  # Main dialog
├── ImportPreview.tsx           # Preview tree
├── ImportProgress.tsx          # Progress bar
└── index.ts                    # Exports
```

### Modified Files

```
electron/ipc/handlers.ts
  - Add: import:detect-format handler
  - Add: import:parse handler
  - Add: import:execute handler
  - Add: import:supported-formats handler

electron/preload.ts
  - Add: window.electronAPI.import object

src/types/electron.d.ts
  - Add: Import API type definitions

src/components/sidebar/[collections component]
  - Add: Import button in header
```

## Implementation Details

### Component 1: ImportFactory

**Location**: `electron/lib/import/import-factory.ts`  
**Purpose**: Manages import strategies and format detection

**Key Functions**:

- `register(strategy: ImportStrategy)`: Register a new format parser
- `detectFormat(content: string)`: Auto-detect format from content
- `parse(content: string, format?: string)`: Parse using detected/specified format

**Dependencies**:

- Internal: All registered parsers
- External: None

### Component 2: PostmanV2Parser

**Location**: `electron/lib/import/postman-v2-parser.ts`  
**Purpose**: Parse Postman Collection v2.x format

**Key Functions**:

- `detect(content: string)`: Check if content is Postman v2
- `parse(content: string)`: Parse to ImportResult
- `parseItem(item)`: Recursively parse folders/requests
- `parseAuth(auth)`: Convert Postman auth to Anayas format

### Component 3: ImportCollectionDialog

**Location**: `src/components/import/ImportCollectionDialog.tsx`  
**Purpose**: Main UI for importing collections

**Key Functions**:

- File selection via dialog
- Format detection on file select
- Preview rendering
- Import execution with progress
- Error display

## Data Flow

```
User clicks "Import Collection"
         ↓
ImportCollectionDialog (lazy loaded)
         ↓
User selects file → window.electronAPI.file.read()
         ↓
Format detection → window.electronAPI.import.detectFormat()
         ↓
Parse collection → window.electronAPI.import.parse()
         ↓
Show preview (ImportPreview component)
         ↓
User clicks "Import"
         ↓
Execute import → window.electronAPI.import.execute()
         ↓
Save to database → addCollection, addFolder, addRequest
         ↓
Broadcast update → 'collections:updated'
         ↓
Show success notification
```

## Testing Strategy

### Unit Tests

- [x] Test file: `tests/unit/import/postman-v1-parser.spec.ts`
- [x] Test file: `tests/unit/import/postman-v2-parser.spec.ts`
- [x] Test file: `tests/unit/import/import-factory.spec.ts`

### Integration Tests

- [x] Test: Full import flow from file to database
- [x] Test: Format detection accuracy
- [x] Test: Error handling and partial imports

### E2E Tests

- [x] Test: Import button visible and working
- [x] Test: File selection and preview
- [x] Test: Successful import shows in sidebar
- [x] Test: Large collection performance

### Manual Testing Checklist

- [x] Import Postman v1 collection
- [x] Import Postman v2.0 collection
- [x] Import Postman v2.1 collection
- [x] Import collection with nested folders
- [x] Import collection with all auth types
- [x] Import very large collection (1000+ requests)
- [x] Cancel import midway
- [x] Handle invalid/corrupted file
- [x] Handle unsupported format

## Performance Considerations

### Performance Targets (PRIMARY GOALS)

- [x] **Memory** (PRIMARY): <100MB when importing large collections
- [x] **Load Time** (PRIMARY): <200ms for dialog load
- [x] **Parse Time**: <100ms for typical collections (<100 requests)
- [x] **Lazy Loading** (REQUIRED): Feature loads on-demand
- [x] **Cleanup** (REQUIRED): Full cleanup on dialog close

### Optimization Strategy (Focus: Memory & Speed)

1. **Streaming parse for large files**: Parse incrementally, don't load entire collection in memory
2. **Batch database writes**: Write to database in batches of 50-100 items
3. **Lazy parser loading**: Load only the parser needed for detected format
4. **Progress feedback**: Show progress to prevent perceived slowness

### Performance Monitoring (MANDATORY)

- [x] Memory usage tracked and logged
- [x] Load time tracked and logged
- [x] Performance metrics logged to console/file
- [x] Large import benchmarks in test suite

## Security Considerations

- [x] Validate JSON structure before parsing (prevent prototype pollution)
- [x] Sanitize imported text (names, descriptions) to prevent XSS
- [x] Limit file size to prevent DoS (suggest 50MB limit)
- [x] No eval() or dynamic code execution from imported content
- [x] Validate URLs don't contain dangerous protocols

## Accessibility Considerations

- [x] Import button has accessible label
- [x] Preview tree is keyboard navigable
- [x] Progress indicator announces progress to screen readers
- [x] Error messages are announced
- [x] Dialog follows ARIA dialog pattern

## Rollback Plan

If import feature causes issues:

1. Import dialog can be disabled via feature flag
2. Parsers are isolated - individual formats can be disabled
3. No database schema changes - existing data unaffected
4. IPC handlers can be removed without affecting other features

## Open Questions

- [x] Resolved: Environment import strategy (user choice: collection or global)
- [x] Resolved: Postman test script handling (out of scope)
- [x] Resolved: v2.0 vs v2.1 handling (both supported, minor differences)

## References

- [spec.md](./spec.md)
- [specs/001-curl-import-export/plan.md](../001-curl-import-export/plan.md)
- [Postman Collection Format Spec](https://schema.getpostman.com/)
