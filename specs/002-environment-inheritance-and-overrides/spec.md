# Feature Specification: Environment Setup Fixes & Collection Environment Management

**Status**: `completed`  
**Feature ID**: `002-environment-inheritance-and-overrides`  
**Created**: 2025-01-27  
**Last Updated**: 2025-01-27  
**Owner**: Development Team  
**Phase**: Phase 2: Essential Features (plan-timeline.md)

## Overview

Fix critical bugs and add missing features in the environment setup system. This includes removing deprecated code, fixing collection variable resolution, adding collection environment management UI, and ensuring proper environment variable resolution across the application.

## Goal Alignment Summary

**How this feature supports the performance-first project goal:**

- Removes deprecated code, reducing maintenance burden and potential bugs
- Fixes variable resolution bugs that cause incorrect behavior
- Adds missing UI features that users need for proper environment management
- Ensures consistent behavior between frontend preview and backend execution

**Success Criteria:**

- Collection variables appear correctly in autocomplete (no empty rows)
- Users can manage collection environments (add/edit/delete)
- Environment resolution is consistent between frontend and backend
- No deprecated code remains in codebase

**Constraints:**

- Must maintain backward compatibility with existing collections
- Must handle migration of existing data gracefully
- Performance: <5MB memory, <50ms load time (minimal impact, refactoring)

**Unclear Points (to confirm):**

- Should we auto-create a default environment when collection is created?
- Should we show a warning when collection has no environments?

## Performance Impact Analysis (MANDATORY)

### Memory Impact

- **Estimated Memory Footprint**: <5MB (Target: <50MB per feature)
- **Memory Budget**: Minimal - this is refactoring/bug fixes, not new heavy features
- **Memory Cleanup Strategy**: No new cleanup needed, existing cleanup remains

### Load Time Impact (PRIMARY)

- **Estimated Load Time**: <50ms (Target: <200ms)
- **Initialization Strategy**: No new initialization, just fixes to existing code
- **Performance Tracking**: No new tracking needed (refactoring)

### Lazy Loading Strategy (REQUIRED)

- **How feature loads on-demand**: N/A - This is refactoring existing features, not new features
- **Code Splitting Plan**: N/A - No new bundles needed
- **Trigger**: N/A - Existing features remain

### Bundle Size Impact (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: <10KB (Tracked for awareness, not a blocker)

### Performance Monitoring (PRIMARY)

- [x] Memory usage will be tracked (existing tracking remains) - MANDATORY
- [x] Load time will be measured and logged (existing tracking remains) - MANDATORY
- [x] Performance metrics will be logged to monitoring system - MANDATORY

## Goals

- [x] Remove deprecated `Collection.variables` field from codebase ✅
- [x] Fix collection variable autocomplete showing empty rows ✅
- [x] Add collection environment management UI (add/edit/delete) ✅
- [x] Fix environment resolution sync between frontend and backend ✅
- [x] Ensure proper variable resolution in all contexts ✅

## User Stories

### As a developer, I want collection variables to appear correctly in autocomplete so that I can use them in my requests

**Acceptance Criteria:**

- [x] Collection variables show up in autocomplete dropdown ✅
- [x] No empty rows appear in autocomplete ✅
- [x] Variables show correct values and scope indicators ✅
- [x] Variables are available when request belongs to a collection ✅

**Priority**: `P0`

### As a developer, I want to manage collection environments so that I can organize variables per collection

**Acceptance Criteria:**

- [x] Can add new collection environments ✅
- [x] Can edit existing collection environments ✅
- [x] Can delete collection environments ✅
- [x] Can switch active environment for a collection ✅
- [x] Can see which environment is active ✅
- [x] UI is integrated into collection editor ✅

**Priority**: `P0`

### As a developer, I want environment resolution to be consistent so that preview matches actual request

**Acceptance Criteria:**

- [x] Frontend preview uses same environment as backend execution ✅
- [x] Variable resolution is consistent across all contexts ✅
- [x] No discrepancies between preview and actual request ✅

**Priority**: `P1`

---

## Technical Requirements

### Existing Code to Leverage

- [x] Component: `src/components/environment/EnvironmentForm.tsx` - Reference for collection environment form
- [x] Component: `src/components/EnvironmentVariable.tsx` - Reuse for variable editing
- [x] Hook: `src/hooks/useEnvironmentOperations.ts` - Reference for CRUD patterns
- [x] IPC Handlers: `electron/ipc/handlers.ts` lines 188-268 - Collection environment handlers already exist
- [x] Service: `electron/services/variable-resolver.ts` - Already correct, just needs proper data
- [x] Page: `src/pages/Collections.tsx` - Where environment management UI will be added

### Integration Points

- **Where to add**: `src/components/collection/CollectionForm.tsx` - Replace variables tab with environments tab
- **How to integrate**: Add new "Environments" tab alongside existing tabs
- **Existing patterns to follow**: Follow `EnvironmentForm` and `useEnvironmentOperations` patterns

### Architecture Decisions

- Decision 1: Remove deprecated `Collection.variables` completely (new app, can clean up)
- Decision 2: Add environment management as tab in CollectionForm (integrated UX)
- Decision 3: Backend uses same environment as frontend (consistency)

### Dependencies

- Internal:
  - Collection entity types (`src/types/entities.ts`)
  - IPC handlers (`electron/ipc/handlers.ts`)
  - Variable resolution hooks (`src/hooks/useVariableResolution.ts`)
  - Collection operations hook (`src/hooks/useCollectionOperations.ts`)
- External:
  - No additional dependencies

### File Structure Changes

```
New Files:
- src/components/collection/CollectionEnvironmentManager.tsx
- src/components/collection/CollectionEnvironmentForm.tsx

Modified Files:
- src/types/entities.ts (remove deprecated variables field)
- src/types/forms.ts (update CollectionFormData)
- src/components/collection/CollectionForm.tsx (replace variables tab)
- src/hooks/useCollectionOperations.ts (update to use environments[])
- electron/ipc/handlers.ts (update collection:save handler)
- electron/database/json-db.ts (update migration)
- src/hooks/useVariableResolution.ts (fix collection variable fetching)
- src/hooks/useAvailableVariables.ts (fix empty variables)
```

### Data Model Changes

- Remove: `Collection.variables` field (deprecated)
- Keep: `Collection.environments[]` and `Collection.activeEnvironmentId`
- Migration: Update existing migration to always create `environments[]` array

### API Changes

- Update: `collection:save` handler to accept `environments[]` instead of `variables`
- Update: `request:send` handler to accept `environmentId` parameter for consistency
- Existing: `collection:addEnvironment`, `collection:updateEnvironment`, `collection:deleteEnvironment`, `collection:setActiveEnvironment` (already exist)

## Acceptance Criteria

### Functional Requirements

- [x] Deprecated `Collection.variables` field removed from all code ✅
- [x] Collection variables appear correctly in autocomplete (no empty rows) ✅
- [x] Users can add collection environments via UI ✅
- [x] Users can edit collection environments via UI ✅
- [x] Users can delete collection environments via UI ✅
- [x] Users can switch active environment for collection ✅
- [x] Variable resolution works correctly with collection environments ✅
- [x] Frontend preview matches backend execution ✅
- [x] Migration handles existing collections correctly ✅

### Non-Functional Requirements

- [ ] **Performance (PRIMARY)**:
  - Memory: <5MB (refactoring, minimal impact)
  - Load time: <50ms (refactoring, minimal impact)
  - Lazy-loaded: N/A (refactoring existing features)
  - Cleanup: Existing cleanup remains
- [ ] **Accessibility**: Form inputs have proper labels, keyboard navigation works
- [ ] **Security**: No new security concerns (existing patterns)
- [ ] **Testing**: Manual testing checklist completed

## Success Metrics

- Collection variables show correctly in autocomplete 100% of the time
- Users can successfully manage collection environments
- Environment resolution is consistent between frontend and backend
- No deprecated code remains in codebase

## Out of Scope

- Environment inheritance/overrides (separate feature)
- Environment templates/presets (future enhancement)
- Environment sharing between collections (future enhancement)
- Variable validation rules (future enhancement)

## Risks & Mitigation

| Risk                                       | Impact | Probability | Mitigation                                                               |
| ------------------------------------------ | ------ | ----------- | ------------------------------------------------------------------------ |
| Migration breaks existing collections      | High   | Low         | Test migration thoroughly, keep backward compatibility during transition |
| Collection variables still empty after fix | Medium | Medium      | Add comprehensive edge case handling, test all scenarios                 |
| UI complexity increases                    | Low    | Medium      | Follow existing patterns, keep UI simple and intuitive                   |

## References

- [plan-timeline.md](../../plan-timeline.md) - Phase 2.2 Environment & Variables System
- [plan.md](./plan.md) - Implementation plan

## Notes

- This is primarily a bug fix and refactoring effort, not a new feature
- Focus on fixing existing functionality rather than adding new features
- Ensure backward compatibility during migration
- Test thoroughly with existing collections that have variables
