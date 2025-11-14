# Task Breakdown: Environment Setup Fixes & Collection Environment Management

**Feature ID**: `002-environment-inheritance-and-overrides`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)  
**Related Plan**: [plan.md](./plan.md)

## Task Organization

Tasks are organized by user story and implementation phase. Tasks marked with `[P]` can be executed in parallel.

## User Story 1: Fix Collection Variable Autocomplete

### Phase 1: Remove Deprecated Code

#### Task 1.1: Remove Deprecated `Collection.variables` Field from Types
- **File**: `src/types/entities.ts`
- **Description**: Remove `variables: Record<string, string>` field from `Collection` interface, keep only `environments[]` and `activeEnvironmentId`
- **Dependencies**: None
- **Acceptance**: Type definition no longer includes deprecated field
- **Status**: `completed`

#### Task 1.2: Update `CollectionFormData` Type
- **File**: `src/types/forms.ts`
- **Description**: Remove `variables` field, add `environments?: CollectionEnvironment[]` field to `CollectionFormData`
- **Dependencies**: Task 1.1
- **Acceptance**: Form data type matches new structure
- **Status**: `completed`

#### Task 1.3: Update Database Migration
- **File**: `electron/database/json-db.ts`
- **Description**: Update migration to always create `environments[]` array even for empty collections. Ensure `activeEnvironmentId` is set when first environment is added.
- **Dependencies**: None
- **Acceptance**: Migration creates `environments[]` for all collections, handles empty collections
- **Status**: `completed`

**Checkpoint**: Deprecated field removed from types, migration updated

### Phase 2: Update Handlers and Operations

#### Task 2.1: Update `collection:save` IPC Handler
- **File**: `electron/ipc/handlers.ts`
- **Description**: Update handler to save `environments[]` instead of `variables`. Remove `variables` from save operation.
- **Dependencies**: Task 1.1
- **Acceptance**: Handler saves `environments[]` correctly, ignores `variables` field
- **Status**: `completed`

#### Task 2.2: Update `useCollectionOperations` Hook
- **File**: `src/hooks/useCollectionOperations.ts`
- **Description**: Update `createCollection` and `updateCollection` to send `environments[]` instead of `variables`
- **Dependencies**: Task 1.2, Task 2.1
- **Acceptance**: Hook sends correct data structure to backend
- **Status**: `completed`

**Checkpoint**: Backend handlers updated to use `environments[]`

### Phase 3: Fix Variable Fetching

#### Task 3.1: Fix `useAvailableVariables` Hook
- **File**: `src/hooks/useVariableResolution.ts`
- **Description**: Fix collection variable fetching to handle edge cases: missing `activeEnvironmentId`, empty `environments[]`, collection with no environments. Add proper fallbacks.
- **Dependencies**: Task 1.3
- **Acceptance**: Collection variables appear correctly in autocomplete, no empty rows
- **Status**: `completed`

#### Task 3.2: Fix `useVariableResolution` Hook
- **File**: `src/hooks/useVariableResolution.ts`
- **Description**: Fix collection variable resolution to handle same edge cases as Task 3.1. Ensure proper fallback when collection has no active environment.
- **Dependencies**: Task 3.1
- **Acceptance**: Variable resolution works correctly with collection environments
- **Status**: `completed`

**Checkpoint**: Collection variables fetch and resolve correctly

## User Story 2: Add Collection Environment Management UI

### Phase 1: Create Environment Management Components

#### Task 4.1: Create `CollectionEnvironmentForm` Component
- **File**: `src/components/collection/CollectionEnvironmentForm.tsx`
- **Description**: Create form component for creating/editing collection environments. Similar to `EnvironmentForm` but simpler (no displayName, just name and variables). Use `EnvironmentVariable` component for variable editing.
- **Dependencies**: None
- **Acceptance**: Form can create and edit collection environments
- **Status**: `completed`

#### Task 4.2: Create `CollectionEnvironmentManager` Component
- **File**: `src/components/collection/CollectionEnvironmentManager.tsx`
- **Description**: Create component to list, add, edit, delete, and switch active collection environments. Show list of environments with active indicator. Buttons for add/edit/delete/switch actions.
- **Dependencies**: Task 4.1
- **Acceptance**: Component displays environments, allows CRUD operations
- **Status**: `completed`

**Checkpoint**: Environment management components created

### Phase 2: Integrate into CollectionForm

#### Task 5.1: Update `CollectionForm` to Use Environments Tab
- **File**: `src/components/collection/CollectionForm.tsx`
- **Description**: Replace "Variables" tab with "Environments" tab. Remove old variables editing code. Add `CollectionEnvironmentManager` component in new tab. Update form data handling to use `environments[]`.
- **Dependencies**: Task 4.2, Task 1.2
- **Acceptance**: CollectionForm shows environments tab, allows managing collection environments
- **Status**: `completed`

#### Task 5.2: Wire Up Environment Management Actions
- **File**: `src/components/collection/CollectionEnvironmentManager.tsx`, `src/hooks/useCollectionOperations.ts`
- **Description**: Connect add/edit/delete/switch actions to IPC handlers. Update store after operations. Show success/error notifications.
- **Dependencies**: Task 5.1
- **Acceptance**: All CRUD operations work correctly, store updates properly
- **Status**: `completed`

**Checkpoint**: Environment management UI fully integrated

## User Story 3: Fix Environment Resolution Sync

### Phase 1: Update Request Sending

#### Task 6.1: Update `request:send` Handler to Accept Environment ID
- **File**: `electron/ipc/handlers.ts`
- **Description**: Update handler to accept optional `environmentId` parameter. Use provided environment instead of always using default. Fallback to default if not provided.
- **Dependencies**: None
- **Acceptance**: Handler uses provided environment ID when available
- **Status**: `completed`

#### Task 6.2: Update Request Sending Code to Pass Environment ID
- **File**: `src/hooks/useRequestActions.ts` or wherever request sending happens
- **Description**: Find where `request:send` is called and update to pass current environment ID from store.
- **Dependencies**: Task 6.1
- **Acceptance**: Request sending uses same environment as frontend preview
- **Status**: `completed`

#### Task 6.3: **CRITICAL** - Fix Backend Fallback Logic to Match Frontend
- **File**: `electron/ipc/handlers.ts`
- **Description**: Backend `request:send` handler must match frontend fallback logic. If `activeEnvironmentId` is not set or points to deleted environment, use first environment as fallback (same as frontend).
- **Dependencies**: Task 6.1
- **Acceptance**: Backend and frontend use identical fallback logic
- **Status**: `completed`

#### Task 6.4: **CRITICAL** - Handle Deleted activeEnvironmentId Edge Case
- **File**: `electron/ipc/handlers.ts`
- **Description**: Add validation to check if `activeEnvironmentId` points to existing environment. If not found, fallback to first environment.
- **Dependencies**: Task 6.3
- **Acceptance**: Backend handles deleted activeEnvironmentId gracefully
- **Status**: `completed`

#### Task 6.5: Fix EnvironmentSelector to Update Collections
- **File**: `src/components/EnvironmentSelector.tsx`
- **Description**: After setting active environment, update collections array in store and trigger sidebar refresh to ensure UI updates immediately.
- **Dependencies**: None
- **Acceptance**: EnvironmentSelector updates UI immediately after selection
- **Status**: `completed`

**Checkpoint**: Environment resolution is consistent between frontend and backend

## Testing Tasks

### Manual Testing

#### Test Task 1: Collection Variable Autocomplete
- **File**: N/A
- **Description**: Test that collection variables appear correctly in autocomplete. Test with: collection with environments, collection without environments, collection with no active environment, empty variables.
- **Dependencies**: Task 3.1, Task 3.2
- **Status**: `completed`

#### Test Task 2: Collection Environment Management
- **File**: N/A
- **Description**: Test full CRUD flow: create collection, add environment, edit environment, delete environment, switch active environment. Verify store updates correctly.
- **Dependencies**: Task 5.2
- **Status**: `completed`

#### Test Task 3: Environment Resolution Sync
- **File**: N/A
- **Description**: Test that frontend preview matches backend execution. Change environment, verify preview updates, send request, verify same environment used.
- **Dependencies**: Task 6.2
- **Status**: `completed`

#### Test Task 4: Migration Testing
- **File**: N/A
- **Description**: Test migration with existing collections that have `variables` field. Verify migration creates `environments[]` correctly.
- **Dependencies**: Task 1.3
- **Status**: `completed`

---

## Task Execution Order

### Sequential Tasks
1. Task 1.1 (Remove deprecated field from types)
2. Task 1.2 (Update form data type) - depends on 1.1
3. Task 1.3 (Update migration) - can run in parallel with 1.2
4. Task 2.1 (Update save handler) - depends on 1.1
5. Task 2.2 (Update operations hook) - depends on 1.2, 2.1
6. Task 3.1 (Fix useAvailableVariables) - depends on 1.3
7. Task 3.2 (Fix useVariableResolution) - depends on 3.1
8. Task 4.1 (Create environment form) - can run in parallel
9. Task 4.2 (Create environment manager) - depends on 4.1
10. Task 5.1 (Update CollectionForm) - depends on 4.2, 1.2
11. Task 5.2 (Wire up actions) - depends on 5.1
12. Task 6.1 (Update request handler) - can run in parallel
13. Task 6.2 (Update request sending) - depends on 6.1

### Parallel Tasks
- Task 1.2 and Task 1.3 can run in parallel
- Task 4.1 can run in parallel with Phase 1 tasks
- Task 6.1 can run in parallel with other tasks

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

- Focus on fixing bugs first (autocomplete empty rows), then add new features (management UI)
- Test migration thoroughly with existing collections
- Ensure backward compatibility during transition period
- Follow existing patterns from `EnvironmentForm` and `useEnvironmentOperations`

