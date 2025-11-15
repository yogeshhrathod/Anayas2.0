# Feature Specification: Dialog Backdrop/Portal Logic Consolidation

**Status**: `completed`  
**Feature ID**: `006-dialog-backdrop-consolidation`  
**Created**: 2025-01-27  
**Last Updated**: 2025-01-27  
**Owner**: Development Team  
**Phase**: Phase 2: Code Duplication Consolidation (Medium Impact)

## Overview

Consolidate duplicated dialog backdrop and portal logic across 10+ dialog components by ensuring all dialogs use the base `Dialog` component or a shared `DialogBackdrop` component. This eliminates ~50 lines of duplicated code and ensures consistent behavior (backdrop click, escape key, portal rendering).

## Goal Alignment Summary

**How this feature supports the performance-first project goal:**
- Reduces code duplication (~50 lines), improving maintainability
- Ensures consistent dialog behavior across the app
- Reduces bundle size slightly by removing duplicate backdrop logic
- Improves developer experience with a single source of truth for dialog patterns

**Success Criteria:**
- All 10 dialogs use base `Dialog` or `DialogBackdrop` component
- No duplicated backdrop/portal logic remains
- Consistent behavior: backdrop click closes, escape key closes, portal rendering
- ~50 lines of code eliminated

**Constraints:**
- Must maintain existing dialog functionality
- Must support custom dialog layouts (not all can use base `Dialog`)
- Performance: <1MB memory, <1ms load time (refactoring only)

**Unclear Points (to confirm):**
- None - clear consolidation pattern

## Performance Impact Analysis (MANDATORY)

### Memory Impact
- **Estimated Memory Footprint**: <1MB (Target: <50MB per feature)
- **Memory Budget**: Minimal - this is refactoring, not new functionality
- **Memory Cleanup Strategy**: No new cleanup needed, existing cleanup remains

### Load Time Impact (PRIMARY)
- **Estimated Load Time**: <1ms (Target: <200ms)
- **Initialization Strategy**: No initialization needed - refactoring only
- **Performance Tracking**: N/A - refactoring doesn't change runtime behavior

### Lazy Loading Strategy (REQUIRED)
- **How feature loads on-demand**: N/A - refactoring existing code
- **Code Splitting Plan**: N/A - no new bundles
- **Trigger**: N/A - refactoring only

### Bundle Size Impact (INFORMATIONAL - Not Primary)
- **Estimated Bundle Size**: -2KB (removing duplicate code)

### Performance Monitoring (PRIMARY)
- [x] Memory usage will be tracked (before/after feature load) - N/A (refactoring)
- [x] Load time will be measured and logged - N/A (refactoring)
- [x] Performance metrics will be logged to monitoring system - N/A (refactoring)

## Goals

- [x] Eliminate duplicated backdrop/portal logic
- [x] Ensure all dialogs have consistent behavior
- [x] Use base `Dialog` component where possible
- [x] Create `DialogBackdrop` for custom layouts

## User Stories

### As a developer, I want all dialogs to use consistent backdrop/portal logic so that behavior is predictable and maintainable

**Acceptance Criteria:**
- [x] All dialogs close on backdrop click
- [x] All dialogs close on Escape key
- [x] All dialogs render in portal (outside form elements)
- [x] No duplicated backdrop code remains

**Priority**: `P1`

## Technical Requirements

### Existing Code to Leverage
- [x] Component: `src/components/ui/dialog.tsx` - Base Dialog component with backdrop/portal logic
- [x] Pattern: `createPortal` from react-dom for portal rendering
- [x] Pattern: `fixed inset-0 bg-black/50 flex items-center justify-center z-dialog` for backdrop

### Integration Points
- **Where to add**: Update existing dialog components to use base `Dialog` or new `DialogBackdrop`
- **How to integrate**: Replace duplicated backdrop code with component usage
- **Existing patterns to follow**: Base `Dialog` component pattern

### Architecture Decisions
- **Decision 1**: Use base `Dialog` component for dialogs with standard Card layout
- **Decision 2**: Create `DialogBackdrop` component for dialogs with custom layouts
- **Decision 3**: All dialogs must use portal rendering for proper z-index stacking

### Dependencies
- Internal: `src/components/ui/dialog.tsx` (base Dialog component)
- External: `react-dom` (createPortal)

### File Structure Changes
```
[New files]
- src/components/ui/dialog-backdrop.tsx (for custom layouts)

[Files to modify]
- src/components/ui/input-dialog.tsx
- src/components/ui/save-request-dialog.tsx
- src/components/ui/promote-request-dialog.tsx
- src/components/ui/bulk-edit-modal.tsx
- src/components/curl/CurlImportDialog.tsx
- src/components/collection/CollectionRunner.tsx
- src/components/request/RequestPresets.tsx
- src/components/ShortcutHelp.tsx
- src/pages/History.tsx
```

### Data Model Changes
None - UI refactoring only

### API Changes
None - component props remain the same

## Acceptance Criteria

### Functional Requirements
- [x] All dialogs close on backdrop click
- [x] All dialogs close on Escape key press
- [x] All dialogs render in portal
- [x] No visual/functional regressions

### Non-Functional Requirements
- [x] **Performance (PRIMARY)**: 
  - Memory: <1MB (refactoring only)
  - Load time: <1ms (refactoring only)
  - Lazy-loaded: N/A (refactoring)
  - Cleanup: Existing cleanup remains
- [x] **Accessibility**: Keyboard navigation (Escape) works
- [x] **Security**: No new security concerns
- [x] **Testing**: Manual testing checklist completed

## Success Metrics

- All 10 dialogs use base `Dialog` or `DialogBackdrop`
- ~50 lines of duplicated code eliminated
- 100% of dialogs have consistent backdrop/escape behavior
- No regressions in dialog functionality

## Out of Scope

- Changing dialog content/layout (only backdrop/portal logic)
- Adding new dialog features
- Changing dialog styling (only consolidation)

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Breaking existing dialog behavior | High | Low | Test all dialogs thoroughly, maintain same props/behavior |
| Custom layouts don't fit base Dialog | Medium | Medium | Create DialogBackdrop component for custom layouts |
| Portal rendering issues | Low | Low | Base Dialog already uses portal, follow same pattern |

## References

- [plan-timeline.md](../../plan-timeline.md) - Phase 2: Code Duplication Consolidation
- [plan.md](./plan.md) - Implementation plan
- [common-utils.md](../../ai-context/common-utils.md) - Dialog component documentation

## Notes

- This is a refactoring effort, not a new feature
- Focus on consolidation, not changing functionality
- Base `Dialog` component already exists and works correctly
- Some dialogs have custom layouts that need `DialogBackdrop` component
