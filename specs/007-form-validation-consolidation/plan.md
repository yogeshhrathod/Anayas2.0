# Implementation Plan: Form Validation Patterns Consolidation

**Feature ID**: `007-form-validation-consolidation`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Migrate three components (`SaveRequestDialog`, `PromoteRequestDialog`, `Settings`) from manual validation logic to the existing `useFormValidation` hook. This eliminates ~80 lines of duplicated code and ensures consistent validation behavior.

## Existing Code Analysis

### Similar Features to Reference
- ✅ Feature: `specs/005-variable-input-consolidation/` - Similar consolidation pattern
- ✅ Feature: `specs/006-dialog-backdrop-consolidation/` - Similar consolidation pattern

### Components to Reuse
- ✅ Component: `src/components/environment/EnvironmentForm.tsx` - Example of using `useFormValidation`
- ✅ Component: `src/components/collection/CollectionForm.tsx` - Example of using `useFormValidation`

### Hooks to Reuse
- ✅ Hook: `src/hooks/useFormValidation.ts` - Main hook for validation logic

### Utilities to Reuse
- ✅ Type: `src/types/forms.ts` - `ValidationSchema` and `ValidationRule` types

### Types to Extend
- None - existing types are sufficient

### Services to Reuse
- None - no services needed

### Integration Points
- **Component**: `src/components/ui/save-request-dialog.tsx` - Replace manual validation
- **Component**: `src/components/ui/promote-request-dialog.tsx` - Replace manual validation
- **Page**: `src/pages/Settings.tsx` - Replace manual validation

### New Components Needed
- None - using existing hook

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**
- ✅ Yes - Reduces code duplication, improves maintainability, slightly reduces bundle size

**Are there more reusable or cleaner ways to achieve the same?**
- ✅ Using existing `useFormValidation` hook is the cleanest approach
- ✅ No need to create new validation utilities

**Architecture Compliance:**
- ✅ Follows architecture.md patterns (reuse existing code)
- ✅ Uses common-utils.md utilities (useFormValidation hook)
- ✅ Matches example-quality.md standards (consistent patterns)
- ✅ No architecture violations

## Performance Implementation Plan

### Lazy Loading Strategy (REQUIRED)
- **How feature loads on-demand**: N/A - this is refactoring existing code
- **Trigger**: N/A - refactoring only

### Code Splitting Plan (Supports Lazy Loading)
- **Separate Bundle**: No - refactoring only
- **Bundle Type**: N/A
- **Vite Configuration**: None needed

### Bundle Size (INFORMATIONAL - Not Primary)
- **Estimated Bundle Size**: ~2KB reduction (removing duplicate code)

### Memory Management Plan
- **Memory Budget**: <1MB (refactoring only)
- **Cleanup Strategy**: No new cleanup needed
  - [x] No event listeners to remove
  - [x] No subscriptions to cancel
  - [x] No requests to abort
  - [x] No caches to clear
  - [x] No workers to terminate
  - [x] No timers to clear
- **Cleanup Code Location**: N/A

### Performance Tracking Implementation (MANDATORY)
- **Memory Tracking** (PRIMARY): N/A - refactoring only
- **Load Time Tracking** (PRIMARY): N/A - refactoring only
- **Performance Metrics Logging**: N/A - refactoring only

**Optional/Informational:**
- **Bundle Size Tracking**: Tracked in build output

### Performance Budget Verification (PRIMARY GOALS)
- **Memory** (PRIMARY): [Estimated: <1MB] [Target: <50MB] [Status: ✅] - MANDATORY
- **Load Time** (PRIMARY): [Estimated: <1ms] [Target: <200ms] [Status: ✅] - MANDATORY

**Informational:**
- **Bundle Size**: [Estimated: -2KB] [Tracked for awareness, not a blocker]

## Files to Modify/Create (with WHY)

### Modified Files
- `src/components/ui/save-request-dialog.tsx` - **WHY**: Replace manual validation with `useFormValidation` hook, eliminate ~30 lines of duplicate code
- `src/components/ui/promote-request-dialog.tsx` - **WHY**: Replace manual validation with `useFormValidation` hook, eliminate ~30 lines of duplicate code
- `src/pages/Settings.tsx` - **WHY**: Replace manual validation with `useFormValidation` hook, eliminate ~20 lines of duplicate code, use custom validation for number fields

### New Files
- None

## Architecture Decisions

### Decision 1: Use Existing `useFormValidation` Hook
**Context**: Three components have duplicated validation logic  
**Options Considered**:
- Option A: Create new validation hook - Cons: More code, duplication
- Option B: Use existing `useFormValidation` hook - Pros: Reuse existing code, consistent behavior

**Decision**: Option B - Use existing `useFormValidation` hook  
**Rationale**: Hook already exists and works well, no need to create new one  
**Trade-offs**: Need to ensure hook supports custom validation for number fields

### Decision 2: Custom Validation for Number Fields
**Context**: Settings page has custom number validation (min/max ranges)  
**Options Considered**:
- Option A: Extend `useFormValidation` to support number validation - Cons: More complexity
- Option B: Use `custom` validation function in schema - Pros: Already supported, flexible

**Decision**: Option B - Use `custom` validation function  
**Rationale**: Hook already supports custom validation via `custom` function in `ValidationRule`  
**Trade-offs**: None - this is the intended way to handle custom validation

## Implementation Phases

### Phase 1: Migrate SaveRequestDialog
**Goal**: Replace manual validation with `useFormValidation` hook  
**Duration**: 15 minutes

**Tasks**:
- [x] Create validation schema for SaveRequestDialog
- [x] Replace manual `validateForm` function with `useFormValidation`
- [x] Replace manual error state with hook's `errors`
- [x] Replace manual error clearing with hook's `clearFieldError`
- [x] Test validation behavior matches existing

**Dependencies**: None  
**Deliverables**: SaveRequestDialog using `useFormValidation`

### Phase 2: Migrate PromoteRequestDialog
**Goal**: Replace manual validation with `useFormValidation` hook  
**Duration**: 15 minutes

**Tasks**:
- [x] Create validation schema for PromoteRequestDialog
- [x] Replace manual `validateForm` function with `useFormValidation`
- [x] Replace manual error state with hook's `errors`
- [x] Replace manual error clearing with hook's `clearFieldError`
- [x] Test validation behavior matches existing

**Dependencies**: None (can be done in parallel with Phase 1)  
**Deliverables**: PromoteRequestDialog using `useFormValidation`

### Phase 3: Migrate Settings Page
**Goal**: Replace manual validation with `useFormValidation` hook (with custom number validation)  
**Duration**: 20 minutes

**Tasks**:
- [x] Create validation schema for Settings with custom number validation
- [x] Replace manual `validateAllSettings` function with `useFormValidation`
- [x] Replace manual error state with hook's `errors`
- [x] Replace manual error clearing with hook's `clearFieldError`
- [x] Test validation behavior matches existing

**Dependencies**: None (can be done in parallel with Phase 1 and 2)  
**Deliverables**: Settings page using `useFormValidation`

## File Structure

### Modified Files
```
src/components/ui/save-request-dialog.tsx
  - Remove: Manual ValidationErrors interface
  - Remove: Manual validateForm function
  - Remove: Manual error state management
  - Add: useFormValidation hook import
  - Add: ValidationSchema definition
  - Replace: Manual validation with hook

src/components/ui/promote-request-dialog.tsx
  - Remove: Manual ValidationErrors interface
  - Remove: Manual validateForm function
  - Remove: Manual error state management
  - Add: useFormValidation hook import
  - Add: ValidationSchema definition
  - Replace: Manual validation with hook

src/pages/Settings.tsx
  - Remove: Manual ValidationErrors interface
  - Remove: Manual validateAllSettings function
  - Remove: Manual validateRequestTimeout and validateMaxHistory functions
  - Remove: Manual error state management
  - Add: useFormValidation hook import
  - Add: ValidationSchema with custom number validation
  - Replace: Manual validation with hook
```

## Implementation Details

### Component 1: SaveRequestDialog
**Location**: `src/components/ui/save-request-dialog.tsx`  
**Changes**:
- Remove `ValidationErrors` interface (use hook's errors)
- Remove `validateForm` function
- Remove manual error state (`validationErrors` state)
- Add `useFormValidation` hook with schema:
  ```typescript
  const validationSchema = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    collection: {
      required: true,
      custom: (value) => !value ? 'Please select a collection' : undefined
    }
  };
  ```
- Replace `validateForm()` calls with `validateForm(formData)`
- Replace `validationErrors.name` with `errors.name`
- Replace manual error clearing with `clearFieldError('name')`

### Component 2: PromoteRequestDialog
**Location**: `src/components/ui/promote-request-dialog.tsx`  
**Changes**: Same as SaveRequestDialog (identical validation logic)

### Component 3: Settings
**Location**: `src/pages/Settings.tsx`  
**Changes**:
- Remove `ValidationErrors` interface
- Remove `validateRequestTimeout` and `validateMaxHistory` functions
- Remove `validateAllSettings` function
- Remove manual error state
- Add `useFormValidation` hook with schema:
  ```typescript
  const validationSchema = {
    requestTimeout: {
      required: true,
      custom: (value) => {
        if (isNaN(value) || value < 1000) return 'Must be at least 1,000ms (1 second)';
        if (value > 300000) return 'Cannot exceed 300,000ms (5 minutes)';
        return undefined;
      }
    },
    maxHistory: {
      required: true,
      custom: (value) => {
        if (isNaN(value) || value < 1) return 'Must be at least 1';
        if (value > 10000) return 'Cannot exceed 10,000';
        return undefined;
      }
    }
  };
  ```
- Replace manual validation with hook

## Data Flow

```
User Input → Component → useFormValidation Hook → Validation Result
                ↓
         Error Display (if invalid)
                ↓
         Form Submit (if valid)
```

## Testing Strategy

### Manual Testing Checklist
- [x] SaveRequestDialog: Name validation (required, minLength, maxLength)
- [x] SaveRequestDialog: Collection validation (required)
- [x] PromoteRequestDialog: Name validation (required, minLength, maxLength)
- [x] PromoteRequestDialog: Collection validation (required)
- [x] Settings: RequestTimeout validation (min: 1000, max: 300000)
- [x] Settings: MaxHistory validation (min: 1, max: 10000)
- [x] All error messages match existing behavior
- [x] All validation triggers match existing behavior

## Migration & Rollout

### Rollout Plan
1. Migrate SaveRequestDialog
2. Test SaveRequestDialog
3. Migrate PromoteRequestDialog
4. Test PromoteRequestDialog
5. Migrate Settings page
6. Test Settings page
7. Verify no regressions

## Performance Considerations

### Performance Targets (PRIMARY GOALS)
- [x] **Memory** (PRIMARY): <1MB (refactoring only) - ✅
- [x] **Load Time** (PRIMARY): <1ms (refactoring only) - ✅
- [x] **Lazy Loading** (REQUIRED): N/A (refactoring only)
- [x] **Cleanup** (REQUIRED): N/A (refactoring only)

**Informational:**
- [x] **Bundle Size**: ~2KB reduction (tracked for awareness)

### Optimization Strategy (Focus: Memory & Speed)
- No optimizations needed - this is refactoring only
- Code reduction improves maintainability

### Performance Monitoring (MANDATORY)
- [x] Memory usage tracked and logged - N/A (refactoring)
- [x] Load time tracked and logged - N/A (refactoring)
- [x] Performance metrics logged to monitoring system - N/A (refactoring)

**Optional/Informational:**
- [x] Bundle size tracked in build (for awareness)

## Security Considerations

- No security changes - refactoring only

## Accessibility Considerations

- No accessibility changes - refactoring only

## Rollback Plan

If issues arise, revert the three modified files to their previous state. The changes are isolated to validation logic only.

## Open Questions

- None - clear implementation path

## References

- [spec.md](./spec.md) - Feature specification
- [common-utils.md](../../ai-context/common-utils.md) - useFormValidation hook documentation
