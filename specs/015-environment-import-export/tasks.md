# Task Breakdown: Environment Import/Export

**Feature ID**: `015-environment-import-export`  
**Status**: `planned`  
**Related Spec**: [spec.md](./spec.md)  
**Related Plan**: [plan.md](./plan.md)

## Task Organization

Tasks are organized by user story and implementation phase. Tasks marked with `[P]` can be executed in parallel.

## User Story 1: Export Environments

### Phase 1: Export Generator

#### Task 1.1: Create Export Generator Utility

- **File**: `electron/lib/environment/export-generator.ts`
- **Description**: Implement export generator that converts environments to JSON, .env, and Postman formats
- **Dependencies**: None
- **Acceptance**: Can generate valid export content in all three formats
- **Status**: `pending`

#### Task 1.2: Add Export IPC Handler `[P]`

- **File**: `electron/ipc/handlers.ts`
- **Description**: Add `env:export` IPC handler that uses export generator
- **Dependencies**: Task 1.1
- **Acceptance**: IPC handler returns export content and filename
- **Status**: `pending`

#### Task 1.3: Expose Export Preload API `[P]`

- **File**: `electron/preload.ts`
- **Description**: Add `env.export` method to preload API
- **Dependencies**: Task 1.2
- **Acceptance**: API accessible from renderer process
- **Status**: `pending`

**Checkpoint**: Export functionality working via IPC

### Phase 2: Export Dialog UI

#### Task 1.4: Create FormatSelector Component

- **File**: `src/components/environment/FormatSelector.tsx`
- **Description**: Create reusable format selection component
- **Dependencies**: None
- **Acceptance**: Component renders format options and handles selection
- **Status**: `pending`

#### Task 1.5: Create EnvironmentExportDialog Component

- **File**: `src/components/environment/EnvironmentExportDialog.tsx`
- **Description**: Create export dialog with environment selection and format selection
- **Dependencies**: Task 1.3, Task 1.4
- **Acceptance**: Dialog allows selecting environments, choosing format, and downloading file
- **Status**: `pending`

#### Task 1.6: Integrate Export Dialog into Environments Page

- **File**: `src/pages/Environments.tsx`
- **Description**: Replace basic export with lazy-loaded export dialog
- **Dependencies**: Task 1.5
- **Acceptance**: Export button opens dialog, export works end-to-end
- **Status**: `pending`

**Checkpoint**: Export dialog working end-to-end

---

## User Story 2: Import Environments

### Phase 1: Core Parsers

#### Task 2.1: Create Import Strategy Interface

- **File**: `electron/lib/environment/import-strategy.ts`
- **Description**: Define base interface for all import format parsers
- **Dependencies**: None
- **Acceptance**: Interface defines detect, parse, and validate methods
- **Status**: `pending`

#### Task 2.2: Create Shared Types

- **File**: `electron/lib/environment/types.ts`
- **Description**: Define shared types for import/export (ImportResult, ValidationResult, etc.)
- **Dependencies**: None
- **Acceptance**: Types exported and used by parsers
- **Status**: `pending`

#### Task 2.3: Implement JSON Parser `[P]`

- **File**: `electron/lib/environment/json-parser.ts`
- **Description**: Implement parser for Anayas native JSON format
- **Dependencies**: Task 2.1, Task 2.2
- **Acceptance**: Can parse JSON array or single environment object
- **Status**: `pending`

#### Task 2.4: Implement .env File Parser `[P]`

- **File**: `electron/lib/environment/env-file-parser.ts`
- **Description**: Implement parser for .env file format (key=value pairs)
- **Dependencies**: Task 2.1, Task 2.2
- **Acceptance**: Can parse .env files with `=` or `:` separators
- **Status**: `pending`

#### Task 2.5: Implement Postman Parser `[P]`

- **File**: `electron/lib/environment/postman-parser.ts`
- **Description**: Implement parser for Postman environment format
- **Dependencies**: Task 2.1, Task 2.2
- **Acceptance**: Can parse Postman v1.0 environment format
- **Status**: `pending`

#### Task 2.6: Create Import Factory

- **File**: `electron/lib/environment/import-factory.ts`
- **Description**: Create factory that manages parsers and auto-detects format
- **Dependencies**: Task 2.3, Task 2.4, Task 2.5
- **Acceptance**: Factory can detect format and return appropriate parser
- **Status**: `pending`

**Checkpoint**: All parsers working and format detection functional

### Phase 2: IPC Integration

#### Task 2.7: Enhance Import IPC Handler

- **File**: `electron/ipc/handlers.ts`
- **Description**: Enhance existing `env:import` handler to use import factory and support multiple formats
- **Dependencies**: Task 2.6
- **Acceptance**: Handler can import from all supported formats
- **Status**: `pending`

#### Task 2.8: Add Format Detection IPC Handler

- **File**: `electron/ipc/handlers.ts`
- **Description**: Add `env:detect-format` handler for format detection
- **Dependencies**: Task 2.6
- **Acceptance**: Handler returns detected format and validation status
- **Status**: `pending`

#### Task 2.9: Add Supported Formats IPC Handler

- **File**: `electron/ipc/handlers.ts`
- **Description**: Add `env:supported-formats` handler to list supported formats
- **Dependencies**: Task 2.6
- **Acceptance**: Handler returns array of supported format names
- **Status**: `pending`

#### Task 2.10: Expose Import Preload APIs `[P]`

- **File**: `electron/preload.ts`
- **Description**: Add `env.import`, `env.detectFormat`, and `env.getSupportedFormats` methods
- **Dependencies**: Task 2.7, Task 2.8, Task 2.9
- **Acceptance**: APIs accessible from renderer process
- **Status**: `pending`

**Checkpoint**: IPC communication working for all import operations

### Phase 3: Import Dialog UI

#### Task 2.11: Create ImportPreview Component

- **File**: `src/components/environment/ImportPreview.tsx`
- **Description**: Create preview component showing imported environments with conflict indicators
- **Dependencies**: Task 2.10
- **Acceptance**: Preview shows environment names, variable counts, and conflicts
- **Status**: `pending`

#### Task 2.12: Create EnvironmentImportDialog Component

- **File**: `src/components/environment/EnvironmentImportDialog.tsx`
- **Description**: Create import dialog with file selection, format detection, preview, and conflict resolution
- **Dependencies**: Task 2.10, Task 2.11, Task 1.4
- **Acceptance**: Dialog handles full import flow with preview and conflict resolution
- **Status**: `pending`

#### Task 2.13: Integrate Import Dialog into Environments Page

- **File**: `src/pages/Environments.tsx`
- **Description**: Replace basic file picker with lazy-loaded import dialog
- **Dependencies**: Task 2.12
- **Acceptance**: Import button opens dialog, import works end-to-end with preview
- **Status**: `pending`

**Checkpoint**: Import dialog working end-to-end with preview

---

## User Story 3: Preview and Conflict Resolution

### Phase 1: Preview Implementation

#### Task 3.1: Implement Conflict Detection

- **File**: `electron/lib/environment/import-factory.ts` or `electron/ipc/handlers.ts`
- **Description**: Detect conflicts by comparing imported environment names with existing ones
- **Dependencies**: Task 2.6
- **Acceptance**: Conflicts detected and returned in import result
- **Status**: `pending`

#### Task 3.2: Implement Conflict Resolution Logic

- **File**: `electron/ipc/handlers.ts`
- **Description**: Implement skip, overwrite, and rename conflict resolution actions
- **Dependencies**: Task 3.1
- **Acceptance**: Each resolution action works correctly
- **Status**: `pending`

#### Task 3.3: Update ImportPreview to Show Conflicts

- **File**: `src/components/environment/ImportPreview.tsx`
- **Description**: Display conflicts with visual indicators and resolution buttons
- **Dependencies**: Task 2.11, Task 3.1
- **Acceptance**: Conflicts clearly displayed with resolution options
- **Status**: `pending`

**Checkpoint**: Preview and conflict resolution working

---

## User Story 4: Error Handling

### Phase 1: Error Handling Implementation

#### Task 4.1: Add Validation to Parsers

- **File**: `electron/lib/environment/*-parser.ts`
- **Description**: Add validation logic to each parser with clear error messages
- **Dependencies**: Task 2.3, Task 2.4, Task 2.5
- **Acceptance**: Parsers return detailed error messages for invalid input
- **Status**: `pending`

#### Task 4.2: Add Error Display in Import Dialog

- **File**: `src/components/environment/EnvironmentImportDialog.tsx`
- **Description**: Display validation errors and parse errors clearly
- **Dependencies**: Task 2.12, Task 4.1
- **Acceptance**: Errors shown with helpful messages
- **Status**: `pending`

**Checkpoint**: Error handling working end-to-end

---

## Testing Tasks

### Unit Tests

#### Test Task 1: Test JSON Parser

- **File**: `tests/unit/environment/json-parser.spec.ts`
- **Description**: Test JSON parser with valid/invalid inputs, single/multiple environments
- **Dependencies**: Task 2.3
- **Status**: `pending`

#### Test Task 2: Test .env Parser

- **File**: `tests/unit/environment/env-file-parser.spec.ts`
- **Description**: Test .env parser with various formats, edge cases
- **Dependencies**: Task 2.4
- **Status**: `pending`

#### Test Task 3: Test Postman Parser

- **File**: `tests/unit/environment/postman-parser.spec.ts`
- **Description**: Test Postman parser with valid/invalid Postman formats
- **Dependencies**: Task 2.5
- **Status**: `pending`

#### Test Task 4: Test Export Generator

- **File**: `tests/unit/environment/export-generator.spec.ts`
- **Description**: Test export generator for all formats
- **Dependencies**: Task 1.1
- **Status**: `pending`

#### Test Task 5: Test Import Factory

- **File**: `tests/unit/environment/import-factory.spec.ts`
- **Description**: Test format detection and parser selection
- **Dependencies**: Task 2.6
- **Status**: `pending`

### Integration Tests

#### Test Task 6: Test Import IPC Handler

- **File**: `tests/integration/ipc-handlers/env-import.spec.ts`
- **Description**: Test import handler with all formats, error cases
- **Dependencies**: Task 2.7
- **Status**: `pending`

#### Test Task 7: Test Export IPC Handler

- **File**: `tests/integration/ipc-handlers/env-export.spec.ts`
- **Description**: Test export handler with all formats
- **Dependencies**: Task 1.2
- **Status**: `pending`

#### Test Task 8: Test Conflict Resolution

- **File**: `tests/integration/environment/conflict-resolution.spec.ts`
- **Description**: Test conflict detection and resolution (skip, overwrite, rename)
- **Dependencies**: Task 3.2
- **Status**: `pending`

### E2E Tests

#### Test Task 9: Test Full Import Flow

- **File**: `tests/integration/environment/import-flow.spec.ts`
- **Description**: Test complete import flow: file selection → preview → conflict resolution → import
- **Dependencies**: Task 2.13
- **Status**: `pending`

#### Test Task 10: Test Full Export Flow

- **File**: `tests/integration/environment/export-flow.spec.ts`
- **Description**: Test complete export flow: environment selection → format selection → download
- **Dependencies**: Task 1.6
- **Status**: `pending`

---

## Task Execution Order

### Sequential Tasks

1. Task 2.1, Task 2.2 (foundation)
2. Task 2.3, Task 2.4, Task 2.5 (parsers in parallel)
3. Task 2.6 (factory after parsers)
4. Task 2.7, Task 2.8, Task 2.9 (IPC handlers)
5. Task 2.10 (preload APIs)
6. Task 2.11, Task 1.4 (UI components)
7. Task 2.12 (import dialog)
8. Task 2.13 (integration)

### Parallel Tasks

- Task 2.3 `[P]`, Task 2.4 `[P]`, Task 2.5 `[P]` can run simultaneously after Task 2.1, Task 2.2
- Task 1.1 `[P]`, Task 1.2 `[P]`, Task 1.3 `[P]` can run in parallel (export feature)
- Task 2.7 `[P]`, Task 2.8 `[P]`, Task 2.9 `[P]` can run simultaneously after Task 2.6
- Task 1.4 `[P]`, Task 2.11 `[P]` can run in parallel (UI components)

---

## Progress Tracking

**Total Tasks**: 30  
**Completed**: 0  
**In Progress**: 0  
**Pending**: 30  
**Blocked**: 0

**Completion**: 0%

---

## Notes

- Follow TDD principles: Write tests before implementation
- Use BDD format (Given-When-Then) for test scenarios
- Reference existing test patterns from cURL and Postman import features
- Ensure all parsers have 100% test coverage
- Performance tracking must be implemented for memory and load time
- All dialogs must be lazy-loaded
