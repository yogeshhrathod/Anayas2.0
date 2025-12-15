# Implementation Plan: Environment Import/Export

**Feature ID**: `015-environment-import-export`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Implement an extensible environment import/export system using the Strategy Pattern, supporting JSON (Anayas native), .env files, and Postman environment formats. The architecture allows easy addition of future formats (Insomnia, etc.) without modifying core import/export logic. Enhance existing basic import/export functionality with proper dialogs, preview, and conflict resolution.

## Existing Code Analysis

### Similar Features to Reference

- [x] Feature: `specs/001-curl-import-export/` - Parser pattern, IPC structure, dialog design
- [x] Feature: `specs/014-postman-collection-import/` - Strategy pattern, format detection, preview UI
- [x] Implementation: `electron/lib/curl-parser.ts` - Parsing logic patterns
- [x] Implementation: `electron/lib/import/` - Strategy pattern implementation

### Components to Reuse

- [x] Component: `src/components/ui/Dialog.tsx` - Base dialog for import/export UI
- [x] Component: `src/components/ui/Button.tsx` - Action buttons
- [x] Component: `src/components/ui/ScrollArea.tsx` - Preview scrollable area
- [x] Component: `src/components/ui/Checkbox.tsx` - Environment selection for export
- [x] Component: `src/components/ui/Select.tsx` - Format selection dropdown

### Hooks to Reuse

- [x] Hook: `src/hooks/useToastNotifications.ts` - Success/error notifications
- [x] Hook: `src/hooks/useEnvironmentOperations.ts` - Existing import/export functions (to enhance)
- [x] Hook: `src/hooks/useClickOutside.ts` - Dialog close handling

### Utilities to Reuse

- [x] Utility: `src/lib/utils.ts` - Common utility functions
- [x] Utility: `electron/database/json-db.ts` - Database operations

### Types to Extend

- [x] Type: `src/types/entities.ts` - Environment interface
- [x] Type: `src/types/electron.d.ts` - Add import/export API types

### Services to Reuse

- [x] Service: `electron/services/logger.ts` - Logging import/export operations

### Integration Points

- **Page**: `src/pages/Environments.tsx` - Environments page
- **Existing Button/Action**: `CollectionActions` component with Import/Export buttons
- **Existing Component**: `EnvironmentGrid` - Environment list display

### New Components Needed

- [x] New Component: `EnvironmentImportDialog.tsx` - Main import dialog with file selection and preview
- [x] New Component: `EnvironmentExportDialog.tsx` - Export dialog with format selection and environment selection
- [x] New Component: `ImportPreview.tsx` - Shows imported environments before committing
- [x] New Component: `FormatSelector.tsx` - Format selection UI for export

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- [x] Yes - Import/export dialogs are lazy-loaded, parsers loaded on-demand, memory cleaned after operations

**Are there more reusable or cleaner ways to achieve the same?**

- Strategy Pattern enables clean separation of format parsers
- Normalized Environment interface allows reuse across all formats
- Parser factory centralizes format detection logic
- Reuse existing dialog patterns from cURL and Postman import features

**Architecture Compliance:**

- [x] Follows architecture.md patterns (lazy loading, code splitting, memory management)
- [x] Uses common-utils.md utilities (avoids duplication)
- [x] Matches example-quality.md standards (performance patterns)
- [x] No architecture violations (no upfront loading, proper cleanup)

## Performance Implementation Plan

### Lazy Loading Strategy (REQUIRED)

- **How feature loads on-demand**:
  - Import/Export buttons always visible in Environments page
  - Dialogs load when buttons clicked
  - Format parsers loaded only when file is selected or format chosen
- **Trigger**: User clicks "Import" or "Export" buttons
- **Loading State**: Dialog opens immediately, shows spinner while parsing/exporting
- **Code**:
  ```typescript
  const EnvironmentImportDialog = lazy(
    () => import('./EnvironmentImportDialog')
  );
  const EnvironmentExportDialog = lazy(
    () => import('./EnvironmentExportDialog')
  );
  ```

### Code Splitting Plan (Supports Lazy Loading)

- **Separate Bundle**: Yes - Import/export feature in separate chunk
- **Bundle Type**: Feature-based splitting
- **Structure**:
  - `environment-import-dialog.chunk.js` - Import UI components
  - `environment-export-dialog.chunk.js` - Export UI components
  - `env-parsers.chunk.js` - Format parsers (loaded when needed)

### Bundle Size (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: ~30KB (parsers) + ~25KB (UI components) = ~55KB total

### Memory Management Plan

- **Memory Budget**: <20MB during import/export operations
- **Cleanup Strategy**:
  - [x] File handles released after reading
  - [x] Parser instances garbage collected after parse
  - [x] Parsed data cleared after database write
  - [x] Dialog state reset on close
  - [x] Event listeners removed on unmount
- **Cleanup Code Location**: `useEffect` cleanup in dialog components

### Performance Tracking Implementation (MANDATORY)

- **Memory Tracking** (PRIMARY):
  ```typescript
  // In import handler
  const memBefore = process.memoryUsage().heapUsed;
  const result = await parseEnvironments(content, format);
  const memAfter = process.memoryUsage().heapUsed;
  logger.info('Environment import memory', {
    delta: (memAfter - memBefore) / 1024 / 1024,
    format,
    count: result.environments.length,
  });
  ```
- **Load Time Tracking** (PRIMARY):
  ```typescript
  const startTime = performance.now();
  const result = await window.electronAPI.env.import(content, format);
  const loadTime = performance.now() - startTime;
  logger.info('Environment import time', {
    time: loadTime,
    format,
    count: result.environments.length,
  });
  ```

### Performance Budget Verification (PRIMARY GOALS)

- **Memory** (PRIMARY): [Estimated: 10-20MB] [Target: <20MB] [Status: ✅]
- **Load Time** (PRIMARY): [Estimated: 150ms] [Target: <200ms] [Status: ✅]

**Informational:**

- **Bundle Size**: [Estimated: ~55KB] [Tracked for awareness, not a blocker]

## Files to Modify/Create (with WHY)

### New Files

#### Main Process (Electron)

1. `electron/lib/environment/types.ts`
   **WHY**: Shared TypeScript interfaces for import/export strategies, results, and validation. Separates type definitions from implementation for clean imports.

2. `electron/lib/environment/import-strategy.ts`
   **WHY**: Base abstract class/interface defining the Strategy Pattern contract. All format parsers implement this interface.

3. `electron/lib/environment/import-factory.ts`
   **WHY**: Factory class that manages registered strategies and auto-detects format. Central point for adding new formats.

4. `electron/lib/environment/json-parser.ts`
   **WHY**: Parser for Anayas native JSON format. Handles both array and single environment formats.

5. `electron/lib/environment/env-file-parser.ts`
   **WHY**: Parser for .env file format. Handles key-value pairs separated by `=` or `:`.

6. `electron/lib/environment/postman-parser.ts`
   **WHY**: Parser for Postman environment format. Handles Postman v1.0 environment schema.

7. `electron/lib/environment/export-generator.ts`
   **WHY**: Generates export content in different formats (JSON, .env, Postman). Centralized export logic.

8. `electron/lib/environment/index.ts`
   **WHY**: Public exports for environment import/export functionality. Clean API surface.

#### Renderer Process (React)

1. `src/components/environment/EnvironmentImportDialog.tsx`
   **WHY**: Main import dialog component. Handles file selection, format detection, preview, and conflict resolution. Lazy-loaded.

2. `src/components/environment/EnvironmentExportDialog.tsx`
   **WHY**: Main export dialog component. Handles environment selection, format selection, and file download. Lazy-loaded.

3. `src/components/environment/ImportPreview.tsx`
   **WHY**: Preview component showing imported environments before committing. Displays conflicts and allows resolution.

4. `src/components/environment/FormatSelector.tsx`
   **WHY**: Format selection UI component. Reusable for both import and export dialogs.

### Modified Files

1. `electron/ipc/handlers.ts`
   **WHY**:
   - Enhance existing `env:import` handler to support multiple formats
   - Add new `env:export` handler for exporting environments
   - Add `env:detect-format` handler for format detection
   - Add `env:supported-formats` handler for listing supported formats

2. `electron/preload.ts`
   **WHY**: Expose enhanced import/export APIs to renderer process. Add new methods to `window.electronAPI.env`.

3. `src/hooks/useEnvironmentOperations.ts`
   **WHY**: Enhance existing `importEnvironments` and `exportEnvironments` functions to use new dialogs instead of basic file picker.

4. `src/pages/Environments.tsx`
   **WHY**: Replace basic file picker with lazy-loaded import/export dialogs. Integrate new dialog components.

5. `src/types/electron.d.ts`
   **WHY**: Add TypeScript types for new import/export APIs.

## Architecture Decisions

### Decision 1: Strategy Pattern for Format Parsers

**Context**: Need to support multiple import formats (JSON, .env, Postman) with extensibility for future formats.

**Options Considered**:

- Option A: Single parser with if/else logic - Simple but not extensible
- Option B: Strategy Pattern with factory - Extensible, clean separation

**Decision**: Strategy Pattern with factory (Option B)

**Rationale**:

- Easy to add new formats without modifying core logic
- Each parser is independently testable
- Follows same pattern as Postman collection import
- Enables lazy loading of parsers

**Trade-offs**:

- Slightly more complex initial setup
- More files to maintain (but cleaner separation)

### Decision 2: Unified Export Generator

**Context**: Need to export to multiple formats (JSON, .env, Postman).

**Options Considered**:

- Option A: Separate generator per format - More modular
- Option B: Unified generator with format parameter - Simpler API

**Decision**: Unified generator with format parameter (Option B)

**Rationale**:

- Simpler API surface
- Shared validation logic
- Easier to maintain
- Export logic is simpler than import (no detection needed)

**Trade-offs**:

- Single file may grow large (but can be split if needed)

### Decision 3: Preview Before Import

**Context**: Users need to verify imported data before committing.

**Options Considered**:

- Option A: Direct import without preview - Faster but risky
- Option B: Preview with conflict resolution - Safer, better UX

**Decision**: Preview with conflict resolution (Option B)

**Rationale**:

- Prevents accidental overwrites
- Better user experience
- Allows selective import
- Follows pattern from Postman import

**Trade-offs**:

- Additional UI complexity
- Slightly longer import flow

## Implementation Phases

### Phase 1: Core Parsers and Export Generator

**Goal**: Implement format parsers and export generator  
**Duration**: 1-2 days

**Tasks**:

- [ ] Create base import strategy interface
- [ ] Implement JSON parser
- [ ] Implement .env file parser
- [ ] Implement Postman parser
- [ ] Create import factory
- [ ] Implement export generator
- [ ] Add unit tests for parsers

**Dependencies**: None  
**Deliverables**: Working parsers and export generator with tests

### Phase 2: IPC Integration

**Goal**: Wire up IPC handlers and preload APIs  
**Duration**: 0.5-1 day

**Tasks**:

- [ ] Enhance `env:import` handler
- [ ] Add `env:export` handler
- [ ] Add `env:detect-format` handler
- [ ] Add `env:supported-formats` handler
- [ ] Update preload.ts with new APIs
- [ ] Add TypeScript types

**Dependencies**: Phase 1  
**Deliverables**: Working IPC handlers and preload APIs

### Phase 3: Import Dialog

**Goal**: Build import dialog with preview and conflict resolution  
**Duration**: 1-2 days

**Tasks**:

- [ ] Create EnvironmentImportDialog component
- [ ] Create ImportPreview component
- [ ] Create FormatSelector component
- [ ] Implement file selection
- [ ] Implement format detection
- [ ] Implement preview display
- [ ] Implement conflict resolution
- [ ] Add error handling
- [ ] Add loading states

**Dependencies**: Phase 2  
**Deliverables**: Working import dialog with preview

### Phase 4: Export Dialog

**Goal**: Build export dialog with format selection  
**Duration**: 0.5-1 day

**Tasks**:

- [ ] Create EnvironmentExportDialog component
- [ ] Implement environment selection
- [ ] Implement format selection
- [ ] Implement file download
- [ ] Add error handling
- [ ] Add loading states

**Dependencies**: Phase 2  
**Deliverables**: Working export dialog

### Phase 5: Integration and Testing

**Goal**: Integrate dialogs into Environments page and add tests  
**Duration**: 1-2 days

**Tasks**:

- [ ] Update Environments page to use new dialogs
- [ ] Update useEnvironmentOperations hook
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Performance testing
- [ ] Manual testing checklist

**Dependencies**: Phase 3, Phase 4  
**Deliverables**: Fully integrated feature with tests

## File Structure

### New Files

```
electron/lib/environment/
├── types.ts
├── import-strategy.ts
├── import-factory.ts
├── json-parser.ts
├── env-file-parser.ts
├── postman-parser.ts
├── export-generator.ts
└── index.ts

src/components/environment/
├── EnvironmentImportDialog.tsx
├── EnvironmentExportDialog.tsx
├── ImportPreview.tsx
└── FormatSelector.tsx
```

### Modified Files

```
electron/ipc/handlers.ts
  - Enhance env:import handler
  - Add env:export handler
  - Add env:detect-format handler
  - Add env:supported-formats handler

electron/preload.ts
  - Add env.import API
  - Add env.export API
  - Add env.detectFormat API
  - Add env.getSupportedFormats API

src/hooks/useEnvironmentOperations.ts
  - Enhance importEnvironments to use new dialog
  - Enhance exportEnvironments to use new dialog

src/pages/Environments.tsx
  - Replace basic file picker with lazy-loaded dialogs
  - Add dialog state management

src/types/electron.d.ts
  - Add ImportResult type
  - Add ExportResult type
  - Add FormatDetectionResult type
```

## Implementation Details

### Component 1: EnvironmentImportDialog

**Location**: `src/components/environment/EnvironmentImportDialog.tsx`  
**Purpose**: Main import dialog with file selection, format detection, preview, and conflict resolution

**Key Functions**:

- `handleFileSelect()`: Handle file selection and trigger format detection
- `handleImport()`: Execute import with conflict resolution
- `handleConflictResolution()`: Handle skip/overwrite/rename actions

**Dependencies**:

- Internal: ImportPreview, FormatSelector, Dialog, Button
- External: window.electronAPI.env

### Component 2: EnvironmentExportDialog

**Location**: `src/components/environment/EnvironmentExportDialog.tsx`  
**Purpose**: Export dialog with environment selection and format selection

**Key Functions**:

- `handleExport()`: Generate export content and trigger download
- `handleEnvironmentToggle()`: Toggle environment selection

**Dependencies**:

- Internal: FormatSelector, Dialog, Button, Checkbox
- External: window.electronAPI.env

### Component 3: ImportPreview

**Location**: `src/components/environment/ImportPreview.tsx`  
**Purpose**: Preview imported environments before committing

**Key Functions**:

- `renderEnvironmentList()`: Display environments with conflict indicators
- `renderConflictActions()`: Render conflict resolution buttons

**Dependencies**:

- Internal: ScrollArea, Badge, Button
- External: None

## Data Flow

### Import Flow

```
User clicks Import → EnvironmentImportDialog opens
  → User selects file → Format detection
  → Parser selected → Parse file content
  → Preview shown → User resolves conflicts
  → Import executed → Environments saved
  → Success notification → Dialog closes
```

### Export Flow

```
User clicks Export → EnvironmentExportDialog opens
  → User selects environments → User selects format
  → Export generator creates content → File download triggered
  → Success notification → Dialog closes
```

## Testing Strategy

### Unit Tests

- [ ] Test file: `tests/unit/environment/json-parser.spec.ts` - Test JSON parser
- [ ] Test file: `tests/unit/environment/env-file-parser.spec.ts` - Test .env parser
- [ ] Test file: `tests/unit/environment/postman-parser.spec.ts` - Test Postman parser
- [ ] Test file: `tests/unit/environment/export-generator.spec.ts` - Test export generator
- [ ] Test file: `tests/unit/environment/import-factory.spec.ts` - Test format detection

### Integration Tests

- [ ] Test scenario: Import JSON format
- [ ] Test scenario: Import .env format
- [ ] Test scenario: Import Postman format
- [ ] Test scenario: Export JSON format
- [ ] Test scenario: Export .env format
- [ ] Test scenario: Export Postman format
- [ ] Test scenario: Conflict resolution (skip, overwrite, rename)

### E2E Tests

- [ ] E2E test: Full import flow with preview
- [ ] E2E test: Full export flow with format selection
- [ ] E2E test: Conflict resolution workflow

### Manual Testing Checklist

- [ ] Import JSON file (single environment)
- [ ] Import JSON file (multiple environments)
- [ ] Import .env file
- [ ] Import Postman environment file
- [ ] Export all environments to JSON
- [ ] Export selected environments to .env
- [ ] Export to Postman format
- [ ] Preview shows conflicts correctly
- [ ] Conflict resolution works (skip, overwrite, rename)
- [ ] Error handling for invalid files
- [ ] Error handling for unsupported formats

## Migration & Rollout

### Database Migrations

No database schema changes required. Uses existing Environment interface.

### Feature Flags

No feature flags needed. Feature is ready for immediate use.

### Rollout Plan

1. Step 1: Deploy parsers and export generator (backend ready)
2. Step 2: Deploy IPC handlers (API ready)
3. Step 3: Deploy import/export dialogs (UI ready)
4. Step 4: Update Environments page (integration complete)

## Performance Considerations

### Performance Targets (PRIMARY GOALS)

- [x] **Memory** (PRIMARY): <20MB when active (measured before/after feature load) - MANDATORY
- [x] **Load Time** (PRIMARY): <200ms (measured from trigger to ready) - MANDATORY
- [x] **Lazy Loading** (REQUIRED): Feature loads on-demand (not upfront) - MANDATORY
- [x] **Cleanup** (REQUIRED): Full cleanup on unmount (no memory leaks) - MANDATORY

**Informational:**

- [x] **Bundle Size**: Tracked in build (for awareness, not a blocker)

### Optimization Strategy (Focus: Memory & Speed)

- Lazy load dialogs only when buttons clicked
- Load parsers only when format detected
- Clean up parser instances after use
- Stream large file parsing (if needed)
- Debounce file selection events

### Performance Monitoring (MANDATORY)

- [x] Memory usage tracked and logged - MANDATORY
- [x] Load time tracked and logged - MANDATORY
- [x] Performance metrics logged to monitoring system - MANDATORY
- [x] Alerts on memory/load time budget violations - MANDATORY

**Optional/Informational:**

- [x] Bundle size tracked in build (for awareness)

## Security Considerations

- [x] Security concern 1: Validate file content before parsing - Sanitize input, check file size limits
- [x] Security concern 2: No code execution - Parsers only parse, never execute
- [x] Security concern 3: Environment variable sanitization - Validate variable names and values

## Accessibility Considerations

- [x] A11y requirement 1: Keyboard navigation in dialogs
- [x] A11y requirement 2: Screen reader support for preview and conflict resolution
- [x] A11y requirement 3: Focus management when dialogs open/close

## Rollback Plan

If the feature needs to be rolled back:

1. Revert Environments page to use basic file picker
2. Keep parsers and handlers (they don't break existing functionality)
3. Remove dialog components
4. Restore original useEnvironmentOperations functions

## Open Questions

- [ ] Question 1: Should we support environment variable encryption? (Answer: Out of scope for MVP)
- [ ] Question 2: Should we support bulk import from multiple files? (Answer: Out of scope for MVP)

## References

- [spec.md](./spec.md) - Feature specification
- [contracts/api-spec.json](./contracts/api-spec.json) - API contracts
- [contracts/data-model.md](./contracts/data-model.md) - Data model
- [specs/001-curl-import-export/](../001-curl-import-export/) - Similar feature reference
- [specs/014-postman-collection-import/](../014-postman-collection-import/) - Strategy pattern reference
