# Feature Specification: Form Validation Patterns Consolidation

**Status**: `completed`  
**Feature ID**: `007-form-validation-consolidation`  
**Created**: 2025-01-27  
**Last Updated**: 2025-01-27  
**Owner**: Development Team  
**Phase**: Phase 2: Code Duplication Consolidation (Medium Impact)

## Overview

Consolidate duplicated form validation logic across 3 components (`SaveRequestDialog`, `PromoteRequestDialog`, `Settings`) by migrating them to use the existing `useFormValidation` hook. This eliminates ~80 lines of duplicated validation code and ensures consistent validation behavior across the application.

## Goal Alignment Summary

**How this feature supports the performance-first project goal:**

- Reduces code duplication (~80 lines), improving maintainability
- Ensures consistent validation behavior across all forms
- Reduces bundle size slightly by removing duplicate validation logic
- Improves developer experience with a single source of truth for validation patterns

**Success Criteria:**

- All 3 components use `useFormValidation` hook
- No duplicated validation logic remains
- Consistent validation behavior: same rules, same error messages, same UX
- ~80 lines of code eliminated

**Constraints:**

- Must maintain existing validation rules and error messages
- Must support custom validation for number fields (Settings page)
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

- **How feature loads on-demand**: N/A - this is refactoring existing code
- **Code Splitting Plan**: N/A - no new code splitting needed
- **Trigger**: N/A - refactoring only

### Bundle Size Impact (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: ~2KB reduction (removing duplicate code)

### Performance Monitoring (PRIMARY)

- [x] Memory usage will be tracked (before/after feature load) - N/A (refactoring)
- [x] Load time will be measured and logged - N/A (refactoring)
- [x] Performance metrics will be logged to monitoring system - N/A (refactoring)

**Optional/Informational:**

- [x] Bundle size will be tracked in build (for awareness)

## Goals

- [x] Eliminate duplicated validation logic in SaveRequestDialog
- [x] Eliminate duplicated validation logic in PromoteRequestDialog
- [x] Eliminate duplicated validation logic in Settings page
- [x] Ensure all forms use consistent validation patterns
- [x] Maintain existing validation rules and error messages

## User Stories

### As a developer, I want all forms to use the same validation hook so that validation behavior is consistent and maintainable

**Acceptance Criteria:**

- [x] SaveRequestDialog uses `useFormValidation` hook
- [x] PromoteRequestDialog uses `useFormValidation` hook
- [x] Settings page uses `useFormValidation` hook (with custom number validation)
- [x] All validation rules remain the same
- [x] All error messages remain the same
- [x] No visual/functional regressions

**Priority**: `P1`

---

## Technical Requirements

### Existing Code to Leverage

- [x] Hook: `src/hooks/useFormValidation.ts` - Already exists and is used by other forms
- [x] Type: `src/types/forms.ts` - `ValidationSchema` and `ValidationRule` types already defined
- [x] Component: `src/components/environment/EnvironmentForm.tsx` - Example of using `useFormValidation`
- [x] Component: `src/components/collection/CollectionForm.tsx` - Example of using `useFormValidation`

### Integration Points

- **Where to modify**:
  - `src/components/ui/save-request-dialog.tsx` - Replace manual validation with `useFormValidation`
  - `src/components/ui/promote-request-dialog.tsx` - Replace manual validation with `useFormValidation`
  - `src/pages/Settings.tsx` - Replace manual validation with `useFormValidation` (with custom validation)

### Architecture Decisions

**Decision 1: Use existing `useFormValidation` hook**

- **Context**: Three components have duplicated validation logic
- **Options Considered**:
  - Option A: Create new validation hook - Cons: More code, duplication
  - Option B: Use existing `useFormValidation` hook - Pros: Reuse existing code, consistent behavior
- **Decision**: Option B - Use existing `useFormValidation` hook
- **Rationale**: Hook already exists and works well, no need to create new one
- **Trade-offs**: Need to ensure hook supports custom validation for number fields

**Decision 2: Custom validation for number fields**

- **Context**: Settings page has custom number validation (min/max ranges)
- **Options Considered**:
  - Option A: Extend `useFormValidation` to support number validation - Cons: More complexity
  - Option B: Use `custom` validation function in schema - Pros: Already supported, flexible
- **Decision**: Option B - Use `custom` validation function
- **Rationale**: Hook already supports custom validation via `custom` function in `ValidationRule`
- **Trade-offs**: None - this is the intended way to handle custom validation

### Dependencies

- Internal: `useFormValidation` hook, `ValidationSchema` type
- External: None

### File Structure Changes

```
Modified Files:
- src/components/ui/save-request-dialog.tsx - Replace manual validation
- src/components/ui/promote-request-dialog.tsx - Replace manual validation
- src/pages/Settings.tsx - Replace manual validation
```

### Data Model Changes

None - no data model changes

### API Changes

None - no API changes

## Acceptance Criteria

### Functional Requirements

- [x] SaveRequestDialog validates name (required, minLength: 2, maxLength: 100) and collection (required)
- [x] PromoteRequestDialog validates name (required, minLength: 2, maxLength: 100) and collection (required)
- [x] Settings page validates requestTimeout (min: 1000, max: 300000) and maxHistory (min: 1, max: 10000)
- [x] All error messages match existing behavior
- [x] All validation triggers match existing behavior (on blur, on submit)

### Non-Functional Requirements

- [x] **Performance (PRIMARY)**:
  - Memory: <1MB (refactoring only) - ✅
  - Load time: <1ms (refactoring only) - ✅
  - Lazy-loaded: N/A (refactoring only)
  - Cleanup: N/A (refactoring only)
  - Bundle size: ~2KB reduction - ✅
- [x] **Accessibility**: No changes to accessibility
- [x] **Security**: No security changes
- [x] **Testing**: Manual testing of all three forms

## Success Metrics

- ~80 lines of duplicated code eliminated
- 3 components migrated to use `useFormValidation`
- 0 validation regressions
- Consistent validation behavior across all forms

## Out of Scope

- Creating new validation rules
- Changing existing validation rules
- Adding new validation features
- Performance optimizations beyond code reduction

## Risks & Mitigation

| Risk                                  | Impact | Probability | Mitigation                                                  |
| ------------------------------------- | ------ | ----------- | ----------------------------------------------------------- |
| Breaking existing validation behavior | High   | Low         | Test all forms thoroughly, maintain same rules/messages     |
| Custom number validation doesn't work | Medium | Low         | Use `custom` validation function which is already supported |
| Error message format changes          | Low    | Low         | Ensure error messages match existing format                 |

## References

- [plan-timeline.md](../../plan-timeline.md) - Phase 2: Code Duplication Consolidation
- [plan.md](./plan.md) - Implementation plan
- [common-utils.md](../../ai-context/common-utils.md) - useFormValidation hook documentation

## Notes

- This is a refactoring effort, not a new feature
- Focus on consolidation, not changing functionality
- `useFormValidation` hook already exists and is used by other forms
- Settings page needs custom validation for number fields (use `custom` function)
