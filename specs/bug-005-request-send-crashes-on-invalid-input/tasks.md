# Task Breakdown: request-send-crashes-on-invalid-input (Bug Fix)

**Feature ID**: `bug-005-request-send-crashes-on-invalid-input`  
**Status**: `in-progress`  
**Related Spec**: `specs/bug-005-request-send-crashes-on-invalid-input/spec.md`  
**Related Plan**: `specs/bug-005-request-send-crashes-on-invalid-input/plan.md`

## Task Organization

Tasks are organized by user story and implementation phase. Tasks marked with `[P]` can be executed in parallel.

## User Story 1: Prevent crashes on invalid request inputs

### Phase 1: Setup & Foundation

#### Task 1.1: Add IPC test for empty header handling
- **File**: `tests/integration/ipc-handlers/request-handlers.spec.ts`
- **Description**: Add test to send request with headers containing empty key `''` and expect success (empty key ignored)
- **Dependencies**: None
- **Acceptance**: Test fails before fix, passes after
- **Status**: `pending`

#### Task 1.2: Map IPC result to ResponseData in renderer `[P]`
- **File**: `src/hooks/useRequestActions.ts`
- **Description**: On success, map to `ResponseData` and set state; on failure, show toast and do not set response
- **Dependencies**: Task 1.1
- **Acceptance**: UI no longer crashes on invalid URL or empty header
- **Status**: `pending`

**Checkpoint**: IPC test added and failing; mapping implemented

### Phase 2: Core Implementation

#### Task 2.1: Sanitize headers in renderer and IPC
- **File**: `src/hooks/useRequestActions.ts`, `electron/ipc/handlers.ts`
- **Description**: Filter out headers with empty/whitespace keys before sending; defensively filter in handler
- **Dependencies**: Task 1.2
- **Acceptance**: IPC test passes; manual: empty header + Send does not crash
- **Status**: `pending`

#### Task 2.2: Append query params to URL in handler
- **File**: `electron/ipc/handlers.ts`
- **Description**: Append `options.queryParams` (enabled=true) to `resolvedUrl`
- **Dependencies**: Task 2.1
- **Acceptance**: Request with query params succeeds and URL saved to history includes params
- **Status**: `pending`

**Checkpoint**: All tests pass locally

---

## User Story 2: (Optional) Renderer E2E for error toast

### Phase 1: [Phase Name]

#### Task 2.1.1: [Task Name]
- **File**: `path/to/file.ts`
- **Description**: [What needs to be done]
- **Dependencies**: [Task IDs]
- **Acceptance**: [How to verify completion]
- **Status**: `pending` | `in-progress` | `completed` | `blocked`

---

## Testing Tasks

### Unit Tests

- N/A

### Integration Tests

#### Test Task 2: IPC empty header ignored
- **File**: `tests/integration/ipc-handlers/request-handlers.spec.ts`
- **Description**: Ensure empty header keys don't crash and request succeeds
- **Dependencies**: Task 2.1
- **Status**: `pending`

### E2E Tests

- Optional renderer e2e for toast - not required

---

## Task Execution Order

### Sequential Tasks
1. Task 1.1
2. Task 1.2 (depends on 1.1)
3. Task 2.1 (depends on 1.2)
4. Task 2.2 (depends on 2.1)

### Parallel Tasks
- Task 1.3 `[P]` and Task 1.4 `[P]` can run simultaneously after Task 1.2

---

## Progress Tracking

**Total Tasks**: 6  
**Completed**: 0  
**In Progress**: 0  
**Pending**: 6  
**Blocked**: 0

**Completion**: 0%

---

## Notes

- Run: `npm run test:electron -- tests/integration/` before marking resolved

