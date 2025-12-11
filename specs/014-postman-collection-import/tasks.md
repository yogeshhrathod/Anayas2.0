# Task Breakdown: Postman Collection Import

**Feature ID**: `014-postman-collection-import`  
**Status**: `in-progress`  
**Related Spec**: [spec.md](./spec.md)  
**Related Plan**: [plan.md](./plan.md)

## Task Organization

Tasks are organized by implementation phase. Tasks marked with `[P]` can be executed in parallel.

---

## Phase 1: Core Infrastructure

### Task 1.1: Create Import Types

- **File**: `electron/lib/import/types.ts`
- **Description**: Define shared TypeScript interfaces for import system:
  - `ImportStrategy` interface
  - `ImportResult` interface
  - `ParsedRequest`, `ParsedFolder`, `ParsedEnvironment` interfaces
  - `ImportOptions` interface
  - `ValidationResult` interface
  - `FormatDetectionResult` interface
- **Dependencies**: None
- **Acceptance**: Types compile without errors, all fields documented with JSDoc
- **Status**: `pending`

### Task 1.2: Create Base Strategy Interface

- **File**: `electron/lib/import/import-strategy.ts`
- **Description**: Create abstract base class/interface for import strategies:
  - Define `formatName`, `fileExtensions`, `mimeTypes` properties
  - Define `detect(content: string): boolean` method
  - Define `parse(content: string): Promise<ImportResult>` method
  - Define `validate(result: ImportResult): ValidationResult` method
- **Dependencies**: Task 1.1
- **Acceptance**: Interface is generic enough for all future formats
- **Status**: `pending`

### Task 1.3: Create Import Factory

- **File**: `electron/lib/import/import-factory.ts`
- **Description**: Implement Strategy factory:
  - `private strategies: Map<string, ImportStrategy>`
  - `register(strategy: ImportStrategy): void`
  - `detectFormat(content: string): ImportStrategy | null`
  - `parse(content: string, format?: string): Promise<ImportResult>`
  - `getSupportedFormats(): string[]`
  - Auto-register Postman parsers on initialization
- **Dependencies**: Task 1.1, Task 1.2
- **Acceptance**: Factory correctly manages and selects strategies
- **Status**: `pending`

### Task 1.4: Create Module Exports

- **File**: `electron/lib/import/index.ts`
- **Description**: Create public exports for import module:
  - Export types
  - Export factory (singleton instance)
  - Export base strategy for extension
- **Dependencies**: Task 1.1, Task 1.2, Task 1.3
- **Acceptance**: Clean public API, internal implementation hidden
- **Status**: `pending`

**Checkpoint**: Import infrastructure compiles and factory can be instantiated

---

## Phase 2: Postman v2 Parser

### Task 2.1: Create Postman v2 Parser Structure

- **File**: `electron/lib/import/postman-v2-parser.ts`
- **Description**: Create parser class implementing ImportStrategy:
  - Class `PostmanV2Parser implements ImportStrategy`
  - `formatName = 'postman-v2'`
  - `fileExtensions = ['.json']`
  - Stub all interface methods
- **Dependencies**: Phase 1
- **Acceptance**: Class structure compiles and can be registered
- **Status**: `pending`

### Task 2.2: Implement v2 Format Detection

- **File**: `electron/lib/import/postman-v2-parser.ts`
- **Description**: Implement `detect()` method:
  - Check for `info._postman_id` field
  - Check for `info.schema` containing v2 URL
  - Handle both v2.0 and v2.1 schemas
  - Return false for invalid JSON
- **Dependencies**: Task 2.1
- **Acceptance**: Correctly identifies Postman v2.x files
- **Status**: `pending`

### Task 2.3: Implement v2 Collection Parsing

- **File**: `electron/lib/import/postman-v2-parser.ts`
- **Description**: Parse root collection info:
  - Extract `info.name` as collection name
  - Extract `info.description` as collection description
  - Handle missing optional fields gracefully
- **Dependencies**: Task 2.1
- **Acceptance**: Collection metadata correctly extracted
- **Status**: `pending`

### Task 2.4: Implement v2 Folder Parsing `[P]`

- **File**: `electron/lib/import/postman-v2-parser.ts`
- **Description**: Implement recursive folder parsing:
  - Parse `item` array recursively
  - Detect folders (items with nested `item` array)
  - Build folder hierarchy with parent paths
  - Preserve folder order
  - Handle deeply nested folders (up to 10 levels)
- **Dependencies**: Task 2.1
- **Acceptance**: All folder hierarchies correctly parsed
- **Status**: `pending`

### Task 2.5: Implement v2 Request Parsing `[P]`

- **File**: `electron/lib/import/postman-v2-parser.ts`
- **Description**: Parse request items:
  - Extract `request.method`
  - Parse `request.url` (string or object format)
  - Parse `request.header` array to Record
  - Parse `request.body` (handle all modes: raw, formdata, urlencoded)
  - Extract query parameters from URL
  - Preserve request order within folders
- **Dependencies**: Task 2.1
- **Acceptance**: All request fields correctly parsed
- **Status**: `pending`

### Task 2.6: Implement v2 Auth Parsing `[P]`

- **File**: `electron/lib/import/postman-v2-parser.ts`
- **Description**: Parse authentication:
  - Handle `request.auth` object
  - Support `bearer` type
  - Support `basic` type
  - Support `apikey` type
  - Handle auth inheritance from collection/folder
  - Map to Anayas auth format
- **Dependencies**: Task 2.1
- **Acceptance**: All auth types correctly converted
- **Status**: `pending`

### Task 2.7: Implement v2 Environment Parsing `[P]`

- **File**: `electron/lib/import/postman-v2-parser.ts`
- **Description**: Parse environment variables:
  - Extract `variable` array from collection
  - Handle both enabled and disabled variables
  - Preserve variable types (string, secret)
  - Build environment object
- **Dependencies**: Task 2.1
- **Acceptance**: Environment variables correctly extracted
- **Status**: `pending`

### Task 2.8: Implement v2 Validation

- **File**: `electron/lib/import/postman-v2-parser.ts`
- **Description**: Implement `validate()` method:
  - Check for required fields
  - Validate URL formats
  - Check for unsupported features
  - Return warnings for non-critical issues
  - Return errors for critical issues
- **Dependencies**: Tasks 2.3-2.7
- **Acceptance**: Validation catches common issues
- **Status**: `pending`

### Task 2.9: Write v2 Parser Unit Tests

- **File**: `tests/unit/import/postman-v2-parser.spec.ts`
- **Description**: Comprehensive unit tests:
  - Test format detection
  - Test collection parsing
  - Test folder hierarchy parsing
  - Test request parsing (all fields)
  - Test auth parsing (all types)
  - Test environment parsing
  - Test validation
  - Test error handling
  - Test edge cases
- **Dependencies**: Tasks 2.1-2.8
- **Acceptance**: All tests pass, >90% coverage
- **Status**: `pending`

**Checkpoint**: Postman v2 collections import correctly

---

## Phase 3: Postman v1 Parser

### Task 3.1: Create Postman v1 Parser Structure

- **File**: `electron/lib/import/postman-v1-parser.ts`
- **Description**: Create parser class implementing ImportStrategy:
  - Class `PostmanV1Parser implements ImportStrategy`
  - `formatName = 'postman-v1'`
  - Stub all interface methods
- **Dependencies**: Phase 1
- **Acceptance**: Class structure compiles
- **Status**: `pending`

### Task 3.2: Implement v1 Format Detection

- **File**: `electron/lib/import/postman-v1-parser.ts`
- **Description**: Implement `detect()` method:
  - Check for `id`, `name`, `requests` at root level
  - Absence of `info` object (v2 indicator)
  - Check for v1-specific fields like `timestamp`
- **Dependencies**: Task 3.1
- **Acceptance**: Correctly identifies Postman v1 files
- **Status**: `pending`

### Task 3.3: Implement v1 Collection Parsing

- **File**: `electron/lib/import/postman-v1-parser.ts`
- **Description**: Parse v1 collection info:
  - Extract `name` from root
  - Extract `description` from root
  - Handle `timestamp` field
- **Dependencies**: Task 3.1
- **Acceptance**: Collection metadata correctly extracted
- **Status**: `pending`

### Task 3.4: Implement v1 Folder Parsing

- **File**: `electron/lib/import/postman-v1-parser.ts`
- **Description**: Parse v1 folder structure:
  - Parse `folders` array
  - Handle `folder` references in requests
  - Build folder hierarchy
  - Note: v1 has flat folder structure (no nesting)
- **Dependencies**: Task 3.1
- **Acceptance**: Folders correctly parsed
- **Status**: `pending`

### Task 3.5: Implement v1 Request Parsing

- **File**: `electron/lib/import/postman-v1-parser.ts`
- **Description**: Parse v1 request format:
  - Extract from `requests` array
  - Parse `method`, `url`, `name`
  - Parse `headers` (string format to Record)
  - Parse `data` (body content)
  - Parse `dataMode` (raw, urlencoded, params)
  - Handle `folder` reference for placement
- **Dependencies**: Task 3.1
- **Acceptance**: All request fields correctly parsed
- **Status**: `pending`

### Task 3.6: Implement v1 Auth Parsing

- **File**: `electron/lib/import/postman-v1-parser.ts`
- **Description**: Parse v1 authentication:
  - Extract from `currentHelper` field
  - Handle basic auth
  - Handle bearer auth
  - Map to Anayas auth format
- **Dependencies**: Task 3.1
- **Acceptance**: Auth correctly converted
- **Status**: `pending`

### Task 3.7: Write v1 Parser Unit Tests

- **File**: `tests/unit/import/postman-v1-parser.spec.ts`
- **Description**: Comprehensive unit tests:
  - Test format detection
  - Test collection parsing
  - Test folder parsing
  - Test request parsing
  - Test auth parsing
  - Test edge cases
- **Dependencies**: Tasks 3.1-3.6
- **Acceptance**: All tests pass
- **Status**: `pending`

**Checkpoint**: Both Postman v1 and v2 collections import correctly

---

## Phase 4: IPC Layer

### Task 4.1: Add Import IPC Handlers

- **File**: `electron/ipc/handlers.ts`
- **Description**: Add import-related handlers:
  - `import:detect-format` - Detect format of file content
  - `import:parse` - Parse content to ImportResult
  - `import:execute` - Save import to database
  - `import:supported-formats` - Get list of supported formats
  - Add proper error handling and logging
- **Dependencies**: Phase 2, Phase 3
- **Acceptance**: All handlers work correctly
- **Status**: `pending`

### Task 4.2: Implement Execute Handler Logic

- **File**: `electron/ipc/handlers.ts`
- **Description**: Implement database save logic:
  - Create collection first
  - Create folders maintaining hierarchy and order
  - Create requests with folder assignments
  - Handle environments (optional)
  - Broadcast 'collections:updated'
  - Return summary (collectionId, counts)
- **Dependencies**: Task 4.1
- **Acceptance**: Full import persisted correctly
- **Status**: `pending`

### Task 4.3: Expose Import APIs in Preload

- **File**: `electron/preload.ts`
- **Description**: Add import APIs to electronAPI:
  ```typescript
  import: {
    detectFormat: (content: string) => ipcRenderer.invoke('import:detect-format', content),
    parse: (content: string, format?: string) => ipcRenderer.invoke('import:parse', content, format),
    execute: (result: ImportResult, options: ImportOptions) => ipcRenderer.invoke('import:execute', result, options),
    getSupportedFormats: () => ipcRenderer.invoke('import:supported-formats')
  }
  ```
- **Dependencies**: Task 4.1
- **Acceptance**: APIs accessible from renderer
- **Status**: `pending`

### Task 4.4: Add Import Types to electron.d.ts

- **File**: `src/types/electron.d.ts`
- **Description**: Add TypeScript definitions:
  - ImportResult interface
  - ImportOptions interface
  - FormatDetectionResult interface
  - ImportExecutionResult interface
  - Add to ElectronAPI interface
- **Dependencies**: Task 4.3
- **Acceptance**: Full type safety in renderer
- **Status**: `pending`

### Task 4.5: Write IPC Integration Tests

- **File**: `tests/integration/ipc-handlers/import-handlers.spec.ts`
- **Description**: Integration tests for IPC:
  - Test format detection via IPC
  - Test parse via IPC
  - Test execute via IPC
  - Test full flow: detect → parse → execute
  - Test error handling
- **Dependencies**: Tasks 4.1-4.4
- **Acceptance**: All integration tests pass
- **Status**: `pending`

**Checkpoint**: Import functionality accessible from renderer

---

## Phase 5: UI Components

### Task 5.1: Create ImportCollectionDialog Component

- **File**: `src/components/import/ImportCollectionDialog.tsx`
- **Description**: Main import dialog:
  - File selection button
  - Format detection display
  - Preview section (uses ImportPreview)
  - Import button with loading state
  - Cancel button
  - Error display
  - Use Dialog component from shadcn/ui
  - Implement lazy loading wrapper
- **Dependencies**: Phase 4
- **Acceptance**: Dialog opens and closes correctly
- **Status**: `pending`

### Task 5.2: Create ImportPreview Component

- **File**: `src/components/import/ImportPreview.tsx`
- **Description**: Preview tree component:
  - Show collection name and description
  - Tree view of folders and requests
  - Expand/collapse functionality
  - Show request method and name
  - Show warning/error badges
  - Show counts (folders, requests)
  - Use ScrollArea for long lists
- **Dependencies**: Task 5.1
- **Acceptance**: Preview renders correctly for complex collections
- **Status**: `pending`

### Task 5.3: Create ImportProgress Component

- **File**: `src/components/import/ImportProgress.tsx`
- **Description**: Progress indicator:
  - Progress bar (determinate when possible)
  - Current item text
  - Cancel button
  - Use Progress component from shadcn/ui
- **Dependencies**: Task 5.1
- **Acceptance**: Progress shows during import
- **Status**: `pending`

### Task 5.4: Create Component Exports

- **File**: `src/components/import/index.ts`
- **Description**: Export components:
  - Export ImportCollectionDialog (lazy loadable)
  - Export other components as needed
- **Dependencies**: Tasks 5.1-5.3
- **Acceptance**: Clean exports for lazy loading
- **Status**: `pending`

### Task 5.5: Add Import Button to Sidebar

- **File**: `src/components/sidebar/CollectionHierarchy.tsx` (or equivalent)
- **Description**: Add import entry point:
  - Add "Import" button in collections header
  - Use Plus/Import icon
  - Open ImportCollectionDialog on click
  - Handle dialog state (open/close)
- **Dependencies**: Tasks 5.1-5.4
- **Acceptance**: Import button visible and functional
- **Status**: `pending`

### Task 5.6: Implement File Selection Flow

- **File**: `src/components/import/ImportCollectionDialog.tsx`
- **Description**: File selection logic:
  - Use `window.electronAPI.file.select()` with filters
  - Filter for JSON files
  - Read file content
  - Trigger format detection
  - Show detected format
  - Handle file read errors
- **Dependencies**: Task 5.1
- **Acceptance**: Files can be selected and read
- **Status**: `pending`

### Task 5.7: Implement Parse and Preview Flow

- **File**: `src/components/import/ImportCollectionDialog.tsx`
- **Description**: Parse and preview logic:
  - Call `window.electronAPI.import.parse()` after detection
  - Handle parse errors gracefully
  - Display warnings in preview
  - Show loading state during parse
  - Update preview when parsed
- **Dependencies**: Task 5.6
- **Acceptance**: Preview shows after file selection
- **Status**: `pending`

### Task 5.8: Implement Import Execution Flow

- **File**: `src/components/import/ImportCollectionDialog.tsx`
- **Description**: Import execution logic:
  - Call `window.electronAPI.import.execute()`
  - Show progress during import
  - Handle success: close dialog, show toast
  - Handle partial failure: show warnings
  - Handle failure: show error
  - Update sidebar after import
- **Dependencies**: Task 5.7
- **Acceptance**: Import executes and persists correctly
- **Status**: `pending`

### Task 5.9: Add Toast Notifications

- **File**: `src/components/import/ImportCollectionDialog.tsx`
- **Description**: Add success/error notifications:
  - Success: "Collection imported successfully"
  - Partial: "Collection imported with warnings"
  - Error: "Failed to import collection"
  - Use existing toast hook
- **Dependencies**: Task 5.8
- **Acceptance**: Appropriate notifications shown
- **Status**: `pending`

### Task 5.10: Write Component Integration Tests

- **File**: `tests/integration/components/import-dialog.spec.ts`
- **Description**: Integration tests for UI:
  - Test dialog opens/closes
  - Test file selection
  - Test preview rendering
  - Test import execution
  - Test error handling
  - Test accessibility
- **Dependencies**: Tasks 5.1-5.9
- **Acceptance**: All component tests pass
- **Status**: `pending`

**Checkpoint**: Full import UI working end-to-end

---

## Phase 6: Testing & Polish

### Task 6.1: Write E2E Tests

- **File**: `tests/e2e/import-collection.spec.ts`
- **Description**: End-to-end tests:
  - Import Postman v1 collection file
  - Import Postman v2.1 collection file
  - Verify collection appears in sidebar
  - Verify folders created correctly
  - Verify requests have correct data
  - Test large collection import
- **Dependencies**: Phase 5
- **Acceptance**: All E2E tests pass
- **Status**: `pending`

### Task 6.2: Write Performance Tests

- **File**: `tests/performance/import-performance.spec.ts`
- **Description**: Performance benchmarks:
  - Import 100-request collection: <1s
  - Import 500-request collection: <3s
  - Import 1000-request collection: <5s
  - Memory usage stays under 100MB
  - No memory leaks after dialog close
- **Dependencies**: Phase 5
- **Acceptance**: All performance targets met
- **Status**: `pending`

### Task 6.3: Edge Case Testing

- **File**: Update existing test files
- **Description**: Test edge cases:
  - Empty collection
  - Collection with only folders
  - Collection with only requests
  - Invalid JSON file
  - Very large file (>10MB)
  - File with special characters
  - File with unicode content
  - Corrupted Postman file
  - Mixed v1/v2 content
- **Dependencies**: Tasks 6.1-6.2
- **Acceptance**: All edge cases handled gracefully
- **Status**: `pending`

### Task 6.4: Error Message Review

- **File**: Multiple files
- **Description**: Review and improve error messages:
  - Clear, actionable error text
  - Specific failure reasons
  - Suggestions for fixing issues
  - Consistent error format
- **Dependencies**: Tasks 6.1-6.3
- **Acceptance**: Error messages are helpful and clear
- **Status**: `pending`

### Task 6.5: Accessibility Review

- **File**: `src/components/import/`
- **Description**: Accessibility audit:
  - Keyboard navigation works
  - Screen reader announcements correct
  - Focus management proper
  - ARIA labels complete
  - Color contrast sufficient
- **Dependencies**: Tasks 5.1-5.10
- **Acceptance**: WCAG 2.1 AA compliance
- **Status**: `pending`

### Task 6.6: Documentation

- **File**: `specs/014-postman-collection-import/`
- **Description**: Final documentation:
  - Update spec.md with any changes
  - Document API contracts
  - Add usage examples
  - Document supported Postman features
  - Add troubleshooting guide
- **Dependencies**: All previous tasks
- **Acceptance**: Documentation complete and accurate
- **Status**: `pending`

**Checkpoint**: Feature production-ready

---

## Task Execution Order

### Sequential Dependencies

1. Task 1.1 → 1.2 → 1.3 → 1.4 (Core infrastructure)
2. Phase 2 (v2 Parser) depends on Phase 1
3. Phase 3 (v1 Parser) depends on Phase 1
4. Phase 4 (IPC) depends on Phase 2 and 3
5. Phase 5 (UI) depends on Phase 4
6. Phase 6 (Testing) depends on Phase 5

### Parallel Tasks

- Phase 2 and Phase 3 can run in parallel after Phase 1
- Tasks 2.4, 2.5, 2.6, 2.7 can run in parallel
- Tasks 5.1, 5.2, 5.3 can start in parallel (UI structure)

---

## Progress Tracking

**Total Tasks**: 37  
**Completed**: 31 (Phases 1-5)  
**In Progress**: 0  
**Pending**: 6 (Phase 6: Testing)  
**Blocked**: 0

**Completion**: 84%

### Implementation Summary (Completed)

- ✅ Phase 1: Core Infrastructure (types, strategy, factory)
- ✅ Phase 2: Postman v2 Parser (full support for v2.0/v2.1)
- ✅ Phase 3: Postman v1 Parser (legacy format support)
- ✅ Phase 4: IPC Layer (handlers + preload APIs)
- ✅ Phase 5: UI Components (ImportCollectionDialog, ImportPreview)

### Remaining (Phase 6: Testing)

- ⏳ Unit tests for parsers
- ⏳ Integration tests for IPC handlers
- ⏳ E2E tests for full flow
- ⏳ Performance tests
- ⏳ Edge case testing
- ⏳ Documentation

---

## Notes

- Priority is v2 parser (most common format) over v1 (legacy)
- Can ship v2 support first, add v1 in follow-up if needed
- Consider adding format-specific test fixtures in `tests/fixtures/postman/`
- Keep parser logic pure for easy testing
- Use existing Dialog patterns for consistent UI
