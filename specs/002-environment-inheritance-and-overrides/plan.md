# Implementation Plan: Environment Setup Fixes & Collection Environment Management

**Feature ID**: `002-environment-inheritance-and-overrides`  
**Status**: `completed`  
**Related Spec**: [To be created]

## Overview

This plan addresses critical bugs and missing features in the environment setup system:

1. Remove deprecated `Collection.variables` field and migrate to `environments[]`
2. Fix collection variable autocomplete showing empty rows
3. Fix environment resolution sync between frontend and backend
4. Add collection environment management UI (add/edit/delete)
5. Ensure proper environment variable resolution

## Existing Code Analysis

### Components to Reuse

- [x] `CollectionForm` - Extend to support `environments[]` instead of `variables`
- [x] `EnvironmentForm` - Reference for collection environment form patterns
- [x] `EnvironmentVariable` - Reuse for variable editing
- [x] `VariableAutocomplete` - Fix empty rows issue
- [x] `EnvironmentSelector` - Already works, just needs data fix

### Hooks to Reuse

- [x] `useVariableResolution` - Fix collection variable fetching
- [x] `useAvailableVariables` - Fix empty collection variables
- [x] `useCollectionOperations` - Extend for environment management

### Services to Reuse

- [x] `variable-resolver.ts` - Already correct, just needs proper data
- [x] IPC handlers for collection environments - Already exist, need to be used

### Integration Points

- **Page**: `src/pages/Collections.tsx` - Add environment management UI
- **Component**: `src/components/collection/CollectionForm.tsx` - Replace variables tab with environments management
- **Hook**: `src/hooks/useVariableResolution.ts` - Fix collection variable fetching

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- [x] Yes - This is a refactoring/bug fix that doesn't add new features, just fixes existing ones. No performance impact.

**Architecture Compliance:**

- [x] Follows architecture.md patterns (no new lazy loading needed, existing patterns)
- [x] Uses common-utils.md utilities (no duplication)
- [x] Matches example-quality.md standards
- [x] No architecture violations

## Performance Implementation Plan

### Lazy Loading Strategy

- **N/A** - This is a refactoring/bug fix, not a new feature. Existing lazy loading remains.

### Memory Management Plan

- **Memory Budget**: <5MB (minimal, just UI changes)
- **Cleanup Strategy**: No new cleanup needed, existing cleanup remains

### Performance Tracking Implementation

- **N/A** - Bug fix, no new performance tracking needed

### Performance Budget Verification

- **Memory** (PRIMARY): [Estimated: <5MB] [Target: <50MB] [Status: ✅]
- **Load Time** (PRIMARY): [Estimated: <50ms] [Target: <200ms] [Status: ✅]

## Files to Modify/Create (with WHY)

### Modified Files

- `src/types/entities.ts` - **WHY**: Remove deprecated `Collection.variables` field, keep only `environments[]`
- `src/types/forms.ts` - **WHY**: Update `CollectionFormData` to use `environments[]` instead of `variables`
- `src/components/collection/CollectionForm.tsx` - **WHY**: Replace variables tab with collection environments management UI
- `src/hooks/useCollectionOperations.ts` - **WHY**: Update to save `environments[]` instead of `variables`
- `electron/ipc/handlers.ts` - **WHY**: Update `collection:save` to handle `environments[]` instead of `variables`
- `electron/database/json-db.ts` - **WHY**: Update migration to always create `environments[]` even for empty collections
- `src/hooks/useVariableResolution.ts` - **WHY**: Fix collection variable fetching to handle edge cases
- `src/hooks/useAvailableVariables.ts` - **WHY**: Fix empty collection variables in autocomplete
- `electron/ipc/handlers.ts` (request:send) - **WHY**: Ensure backend uses same environment selection as frontend

### New Files

- `src/components/collection/CollectionEnvironmentManager.tsx` - **WHY**: New component to manage collection environments (add/edit/delete)
- `src/components/collection/CollectionEnvironmentForm.tsx` - **WHY**: Form component for creating/editing collection environments

## Architecture Decisions

### Decision 1: Remove Deprecated `variables` Field

**Context**: `Collection.variables` is deprecated but still used in forms and handlers  
**Options Considered**:

- Option A: Keep both fields for backward compatibility - Pros: No breaking changes / Cons: Confusion, maintenance burden
- Option B: Remove completely, migrate all code - Pros: Clean codebase / Cons: Requires migration

**Decision**: Option B - Remove completely  
**Rationale**: New app, can clean up deprecated code. Migration already exists in database layer.  
**Trade-offs**: Need to update all code references

### Decision 2: Collection Environment Management UI

**Context**: Need UI to manage collection environments  
**Options Considered**:

- Option A: Separate page for collection environments - Pros: More space / Cons: Extra navigation
- Option B: Tab in CollectionForm - Pros: Integrated, better UX / Cons: More complex form

**Decision**: Option B - Tab in CollectionForm  
**Rationale**: Users manage environments when editing collection, integrated experience  
**Trade-offs**: Form becomes more complex

### Decision 3: Environment Resolution Sync

**Context**: Frontend uses `currentEnvironment` from store, backend uses default env  
**Options Considered**:

- Option A: Backend always uses default env - Pros: Simple / Cons: Frontend preview ≠ backend
- Option B: Backend uses same env as frontend - Pros: Consistent / Cons: Need to pass env ID

**Decision**: Option B - Backend uses same env as frontend  
**Rationale**: Consistency between preview and actual request  
**Trade-offs**: Need to pass current environment ID in request

## Implementation Phases

### Phase 1: Remove Deprecated Code & Fix Data Flow

**Goal**: Remove `Collection.variables`, update all code to use `environments[]`  
**Duration**: 2-3 hours

**Tasks**:

- [ ] Remove `variables` field from `Collection` type
- [ ] Update `CollectionFormData` to use `environments[]`
- [ ] Update `collection:save` handler to save `environments[]`
- [ ] Update `useCollectionOperations` to send `environments[]`
- [ ] Update database migration to always create `environments[]`
- [ ] Test migration with existing collections

**Dependencies**: None  
**Deliverables**: Clean codebase without deprecated fields

### Phase 2: Fix Collection Variable Fetching

**Goal**: Fix empty collection variables in autocomplete and resolution  
**Duration**: 1-2 hours

**Tasks**:

- [ ] Fix `useAvailableVariables` to handle missing `activeEnvironmentId`
- [ ] Fix `useVariableResolution` to handle edge cases
- [ ] Add fallback when collection has no environments
- [ ] Test autocomplete with various collection states

**Dependencies**: Phase 1  
**Deliverables**: Collection variables show correctly in autocomplete

### Phase 3: Add Collection Environment Management UI

**Goal**: Allow users to add/edit/delete collection environments  
**Duration**: 3-4 hours

**Tasks**:

- [ ] Create `CollectionEnvironmentManager` component
- [ ] Create `CollectionEnvironmentForm` component
- [ ] Add "Environments" tab to `CollectionForm`
- [ ] Wire up add/edit/delete actions
- [ ] Add environment switching in collection editor
- [ ] Test full CRUD flow

**Dependencies**: Phase 1  
**Deliverables**: Users can manage collection environments

### Phase 4: Fix Environment Resolution Sync

**Goal**: Ensure frontend preview matches backend resolution  
**Duration**: 2-3 hours

**Tasks**:

- [x] Update `request:send` handler to accept environment ID ✅
- [ ] **CRITICAL**: Fix backend fallback logic to match frontend (use first env if no activeEnvironmentId)
- [ ] **CRITICAL**: Handle edge case where activeEnvironmentId points to deleted environment
- [ ] **CRITICAL**: Ensure backend and frontend use identical resolution logic
- [ ] Update request sending code to pass current environment ID
- [ ] Test that preview matches actual request in all scenarios

**Dependencies**: Phase 2 (variable fetching)  
**Deliverables**: Consistent environment resolution between frontend and backend

### Phase 5: Fix EnvironmentSelector Integration

**Goal**: Ensure EnvironmentSelector properly updates collections after setting active environment  
**Duration**: 1 hour

**Tasks**:

- [x] Fix `EnvironmentSelector` to update collections array after setting active environment ✅
- [x] Add `triggerSidebarRefresh` to ensure all components see the update ✅
- [ ] Test: Setting active environment from dropdown updates UI immediately
- [ ] Test: Setting active environment persists after closing selector

**Dependencies**: Phase 3  
**Deliverables**: EnvironmentSelector works correctly end-to-end

## File Structure

### Modified Files

```
src/types/entities.ts
  - Remove: Collection.variables field
  - Keep: Collection.environments[] and activeEnvironmentId

src/types/forms.ts
  - Remove: CollectionFormData.variables
  - Add: CollectionFormData.environments[]

src/components/collection/CollectionForm.tsx
  - Replace: Variables tab with Environments tab
  - Add: CollectionEnvironmentManager integration

src/hooks/useCollectionOperations.ts
  - Update: createCollection/updateCollection to use environments[]

electron/ipc/handlers.ts
  - Update: collection:save to handle environments[]
  - Update: request:send to accept environmentId parameter
  - **CRITICAL FIX**: Update request:send collection variable fetching to match frontend fallback logic
  - **CRITICAL FIX**: Handle edge case where activeEnvironmentId points to deleted environment

electron/database/json-db.ts
  - Update: Migration to always create environments[] array

src/hooks/useVariableResolution.ts
  - Fix: Collection variable fetching edge cases
  - Fix: Handle missing activeEnvironmentId

src/hooks/useAvailableVariables.ts
  - Fix: Empty collection variables issue

src/components/EnvironmentSelector.tsx
  - **CRITICAL FIX**: Update collections array after setting active environment
  - **CRITICAL FIX**: Trigger sidebar refresh after environment change
```

### New Files

```
src/components/collection/CollectionEnvironmentManager.tsx
  - Component to list and manage collection environments

src/components/collection/CollectionEnvironmentForm.tsx
  - Form for creating/editing collection environments
```

## Implementation Details

### Component 1: CollectionEnvironmentManager

**Location**: `src/components/collection/CollectionEnvironmentManager.tsx`  
**Purpose**: Manage collection environments (list, add, edit, delete, switch active)  
**Key Functions**:

- `handleAddEnvironment()`: Open form to add new environment
- `handleEditEnvironment()`: Open form to edit existing environment
- `handleDeleteEnvironment()`: Delete environment with confirmation
- `handleSetActiveEnvironment()`: Set active environment for collection

**Dependencies**:

- Internal: `CollectionEnvironmentForm`, `useCollectionOperations`
- External: IPC handlers for collection environments

### Component 2: CollectionEnvironmentForm

**Location**: `src/components/collection/CollectionEnvironmentForm.tsx`  
**Purpose**: Form for creating/editing collection environments  
**Key Functions**:

- `handleSubmit()`: Save environment to collection
- `handleCancel()`: Close form without saving

**Dependencies**:

- Internal: `EnvironmentVariable` component for variable editing
- External: IPC handlers

## Data Flow

```
User edits collection → CollectionForm → Environments tab
  ↓
CollectionEnvironmentManager
  ↓
Add/Edit Environment → CollectionEnvironmentForm
  ↓
Save → IPC: collection:addEnvironment / collection:updateEnvironment
  ↓
Database updated → Store refreshed → UI updated
```

## Testing Strategy

### Manual Testing Checklist

#### Basic Functionality

- [x] Create new collection - should have empty environments[] array ✅
- [x] Add collection environment - should appear in list ✅
- [x] Edit collection environment - changes should save ✅
- [x] Delete collection environment - should be removed ✅
- [x] Set active environment (in CollectionEnvironmentManager) - should be highlighted ✅
- [ ] **CRITICAL**: Set active environment (in EnvironmentSelector) - should update UI immediately
- [ ] Variable autocomplete - should show collection variables (no empty rows)
- [ ] Variable resolution - should use collection variables correctly
- [ ] Request send - should use correct environment
- [ ] Migration - existing collections should migrate correctly

#### Edge Cases (CRITICAL - Missing from original plan)

- [ ] **Edge Case 1**: Collection has environments but no activeEnvironmentId
  - Frontend: Should use first environment as fallback
  - Backend: Should use first environment as fallback (CURRENTLY BROKEN - needs fix)
- [ ] **Edge Case 2**: activeEnvironmentId points to deleted environment
  - Frontend: Should fallback to first environment
  - Backend: Should fallback to first environment (CURRENTLY BROKEN - needs fix)
- [ ] **Edge Case 3**: Collection has no environments
  - Frontend: Should not show collection variables
  - Backend: Should not use collection variables
- [ ] **Edge Case 4**: Frontend preview vs backend execution
  - Change collection environment in EnvironmentSelector
  - Preview should update immediately
  - Send request - backend should use same environment as preview
- [ ] **Edge Case 5**: Multiple collections with different environments
  - Switch between requests in different collections
  - Each should use its own collection's active environment
- [ ] **Edge Case 6**: Collection environment deleted while active
  - Delete active environment
  - Should auto-select first remaining environment
  - Should update UI immediately

#### End-to-End Scenarios

- [ ] **Scenario 1**: Full workflow
  1. Create collection
  2. Add environment with variables
  3. Set as active
  4. Create request in collection
  5. Use collection variables in request
  6. Preview shows resolved values
  7. Send request - backend uses same values
- [ ] **Scenario 2**: Environment switching
  1. Collection has 2 environments (dev, prod)
  2. Set dev as active
  3. Create request with {{collection.baseUrl}}
  4. Switch to prod in EnvironmentSelector
  5. Preview should update immediately
  6. Send request - should use prod values

## Migration & Rollout

### Database Migrations

- Existing migration already handles `variables` → `environments[]` conversion
- Update migration to always create `environments[]` even for empty collections
- Ensure `activeEnvironmentId` is set when first environment is added

### Rollout Plan

1. Phase 1: Remove deprecated code (no user impact, internal cleanup)
2. Phase 2: Fix variable fetching (fixes empty rows bug)
3. Phase 3: Add management UI (new feature, users can now manage environments)
4. Phase 4: Fix resolution sync (ensures consistency)

## Performance Considerations

### Performance Targets

- [x] **Memory** (PRIMARY): <5MB (minimal UI changes) - ✅
- [x] **Load Time** (PRIMARY): <50ms (no new heavy operations) - ✅
- [x] **Lazy Loading**: N/A (refactoring, not new feature) - ✅
- [x] **Cleanup**: Existing cleanup remains - ✅

## Security Considerations

- [ ] No new security concerns (existing patterns)

## Accessibility Considerations

- [ ] Form inputs have proper labels
- [ ] Buttons have accessible names
- [ ] Keyboard navigation works

## Rollback Plan

If issues arise:

1. Revert code changes
2. Database migration is backward compatible (keeps both fields during transition)
3. No data loss (migration preserves data)

## Critical Issues Found (Not in Original Plan)

### Issue 1: Backend Fallback Logic Mismatch

**Problem**: Backend `request:send` handler doesn't match frontend fallback logic

- Frontend: Falls back to first environment if `activeEnvironmentId` not set
- Backend: Only uses environment if `activeEnvironmentId` is set (no fallback)
  **Impact**: Frontend preview ≠ backend execution
  **Fix**: Update backend to match frontend logic

### Issue 2: Missing Edge Case Handling

**Problem**: No handling for deleted `activeEnvironmentId`
**Impact**: Request fails or uses wrong environment
**Fix**: Add validation to check if `activeEnvironmentId` points to existing environment

### Issue 3: EnvironmentSelector Not Updating Collections

**Problem**: Setting active environment in EnvironmentSelector doesn't refresh collections
**Impact**: UI doesn't update after selection
**Fix**: Update collections array in store after setting active environment (✅ FIXED)

### Issue 4: Incomplete Testing

**Problem**: Plan doesn't cover all edge cases and end-to-end scenarios
**Impact**: Bugs go undetected
**Fix**: Add comprehensive test checklist above

## Open Questions

- [ ] Should we show a warning when collection has no environments?
- [ ] Should we auto-create a default environment when collection is created?
- [ ] Should we validate that activeEnvironmentId points to existing environment on save?

## References

- Existing IPC handlers: `electron/ipc/handlers.ts` lines 188-268
- Existing variable resolution: `electron/services/variable-resolver.ts`
- Frontend variable resolution: `src/hooks/useVariableResolution.ts`
