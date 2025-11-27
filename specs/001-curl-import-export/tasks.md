# Task Breakdown: cURL Import/Export

**Feature ID**: `001-curl-import-export`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)  
**Related Plan**: [plan.md](./plan.md)

## Task Organization

Tasks are organized by user story and implementation phase. Tasks marked with `[P]` can be executed in parallel.

## User Story 1: Import cURL Commands

### Phase 1: Core Parser

#### Task 1.1: Research cURL Parsing Libraries

- **File**: N/A
- **Description**: Research and evaluate npm libraries for cURL parsing (curl-to-json, curlconverter, etc.)
- **Dependencies**: None
- **Acceptance**: Decision made on library vs custom parser
- **Status**: `completed`

#### Task 1.2: Create cURL Parser Utility

- **File**: `src/lib/curl-parser.ts`
- **Description**: Implement parser to convert cURL commands to Request objects. Support method, URL, headers, data, auth, query params
- **Dependencies**: Task 1.1
- **Acceptance**: Can parse standard cURL commands with all supported features
- **Status**: `completed`

#### Task 1.3: Create cURL Generator Utility `[P]`

- **File**: `src/lib/curl-generator.ts`
- **Description**: Implement generator to convert Request objects to cURL commands. Support all request types, proper escaping
- **Dependencies**: None
- **Acceptance**: Can generate valid cURL commands from any request
- **Status**: `completed`

**Checkpoint**: Parser and generator utilities complete and tested

### Phase 2: IPC Integration

#### Task 2.1: Add IPC Handlers

- **File**: `electron/ipc/handlers.ts`
- **Description**: Add curl:parse, curl:generate, and curl:import-bulk IPC handlers
- **Dependencies**: Task 1.2, Task 1.3
- **Acceptance**: IPC handlers work correctly with parser and generator
- **Status**: `completed`

#### Task 2.2: Expose Preload APIs

- **File**: `electron/preload.ts`
- **Description**: Add electronAPI.curl namespace with parse, generate, importBulk methods
- **Dependencies**: Task 2.1
- **Acceptance**: APIs accessible from renderer process
- **Status**: `completed`

**Checkpoint**: IPC communication working

### Phase 3: Import UI

#### Task 3.1: Create Import Dialog Component

- **File**: `src/components/curl/CurlImportDialog.tsx`
- **Description**: Create dialog with textarea, file upload, preview, and save options. Support bulk import
- **Dependencies**: Task 2.2
- **Acceptance**: Dialog can import and preview cURL commands
- **Status**: `completed`

#### Task 3.2: Add Import Options to UI

- **File**: `src/pages/Collections.tsx`, `src/components/collection/RequestItem.tsx`
- **Description**: Add Import cURL button/menu items to Collections page and context menus
- **Dependencies**: Task 3.1
- **Acceptance**: Users can access import dialog from multiple places
- **Status**: `completed`

**Checkpoint**: Import functionality complete

## User Story 2: Export as cURL

### Phase 1: Export UI

#### Task 4.1: Add Copy as cURL Button

- **File**: `src/components/request/RequestHeader.tsx`
- **Description**: Add Copy as cURL button next to Send button. Call generator and copy to clipboard
- **Dependencies**: Task 2.2
- **Acceptance**: Button generates and copies cURL command successfully
- **Status**: `completed`

**Checkpoint**: Export functionality complete

## User Story 3: Bulk Import

### Phase 1: Bulk Import Support

#### Task 5.1: Implement Bulk Import Logic

- **File**: `src/components/curl/CurlImportDialog.tsx`, `src/lib/curl-parser.ts`
- **Description**: Add support for importing multiple cURL commands separated by newlines
- **Dependencies**: Task 3.1
- **Acceptance**: Can import multiple commands, errors don't block others
- **Status**: `completed`

**Checkpoint**: Bulk import working

## Testing Tasks

### Unit Tests

#### Test Task 1: Parser Tests

- **File**: `src/lib/__tests__/curl-parser.test.ts` (if test setup exists)
- **Description**: Test parser with various cURL formats, edge cases, error handling
- **Dependencies**: Task 1.2
- **Status**: `completed`

#### Test Task 2: Generator Tests

- **File**: `src/lib/__tests__/curl-generator.test.ts` (if test setup exists)
- **Description**: Test generator with all request types, auth types, special characters
- **Dependencies**: Task 1.3
- **Status**: `completed`

### Integration Tests

#### Test Task 3: IPC Handler Tests

- **File**: Integration test file (if exists)
- **Description**: Test IPC handlers with various inputs
- **Dependencies**: Task 2.1
- **Status**: `completed`

### Manual Testing

#### Test Task 4: Manual Testing Checklist

- **File**: N/A
- **Description**: Test all scenarios manually: import/export, various formats, edge cases
- **Dependencies**: All implementation tasks
- **Status**: `completed`

---

## Task Execution Order

### Sequential Tasks

1. Task 1.1 (Research libraries)
2. Task 1.2 (Create parser) - can start in parallel with 1.3
3. Task 1.3 (Create generator) - can start in parallel with 1.2
4. Task 2.1 (IPC handlers) - depends on 1.2 and 1.3
5. Task 2.2 (Preload APIs) - depends on 2.1
6. Task 3.1 (Import dialog) - depends on 2.2
7. Task 3.2 (Import UI options) - depends on 3.1
8. Task 4.1 (Copy button) - depends on 2.2
9. Task 5.1 (Bulk import) - depends on 3.1

### Parallel Tasks

- Task 1.2 and Task 1.3 can run in parallel
- Task 3.2 and Task 4.1 can run in parallel after Task 2.2

---

## Progress Tracking

**Total Tasks**: 13  
**Completed**: 13  
**In Progress**: 0  
**Pending**: 0  
**Blocked**: 0

**Completion**: 100%

---

## Notes

- Parser should handle edge cases gracefully (partial parsing if possible)
- Generator should prioritize readability over compactness
- Error messages should be clear and actionable
- Consider adding clipboard detection as future enhancement
