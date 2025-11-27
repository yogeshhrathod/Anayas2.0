# Task Breakdown: Form Validation Patterns Consolidation

**Feature ID**: `007-form-validation-consolidation`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)  
**Related Plan**: [plan.md](./plan.md)

## Task Organization

Tasks are organized by component migration. Tasks marked with `[P]` can be executed in parallel.

## User Story 1: Migrate SaveRequestDialog to useFormValidation

### Phase 1: Setup Validation Schema

#### Task 1.1: Create Validation Schema for SaveRequestDialog

- **File**: `src/components/ui/save-request-dialog.tsx`
- **Description**: Define validation schema with name (required, minLength: 2, maxLength: 100) and collection (required) rules
- **Dependencies**: None
- **Acceptance**: Validation schema defined matching existing rules
- **Status**: `pending`

#### Task 1.2: Import useFormValidation Hook

- **File**: `src/components/ui/save-request-dialog.tsx`
- **Description**: Add import for `useFormValidation` hook from `../../hooks/useFormValidation`
- **Dependencies**: None
- **Acceptance**: Hook imported correctly
- **Status**: `pending`

### Phase 2: Replace Manual Validation

#### Task 1.3: Replace Manual Validation State

- **File**: `src/components/ui/save-request-dialog.tsx`
- **Description**: Remove `ValidationErrors` interface and `validationErrors` state, use hook's `errors` instead
- **Dependencies**: Task 1.1, Task 1.2
- **Acceptance**: Manual error state removed, hook's errors used
- **Status**: `pending`

#### Task 1.4: Replace Manual validateForm Function

- **File**: `src/components/ui/save-request-dialog.tsx`
- **Description**: Remove manual `validateForm` function, use hook's `validateForm` instead
- **Dependencies**: Task 1.1, Task 1.2
- **Acceptance**: Manual validation function removed, hook's validateForm used
- **Status**: `pending`

#### Task 1.5: Replace Manual Error Clearing

- **File**: `src/components/ui/save-request-dialog.tsx`
- **Description**: Replace manual error clearing logic with hook's `clearFieldError` function
- **Dependencies**: Task 1.3
- **Acceptance**: Manual error clearing removed, hook's clearFieldError used
- **Status**: `pending`

#### Task 1.6: Update Error Display

- **File**: `src/components/ui/save-request-dialog.tsx`
- **Description**: Update error display to use hook's `errors` instead of `validationErrors`
- **Dependencies**: Task 1.3
- **Acceptance**: Error display uses hook's errors, matches existing behavior
- **Status**: `pending`

**Checkpoint**: SaveRequestDialog uses useFormValidation, validation behavior matches existing

---

## User Story 2: Migrate PromoteRequestDialog to useFormValidation

### Phase 1: Setup Validation Schema

#### Task 2.1: Create Validation Schema for PromoteRequestDialog `[P]`

- **File**: `src/components/ui/promote-request-dialog.tsx`
- **Description**: Define validation schema with name (required, minLength: 2, maxLength: 100) and collection (required) rules
- **Dependencies**: None
- **Acceptance**: Validation schema defined matching existing rules
- **Status**: `pending`

#### Task 2.2: Import useFormValidation Hook `[P]`

- **File**: `src/components/ui/promote-request-dialog.tsx`
- **Description**: Add import for `useFormValidation` hook from `../../hooks/useFormValidation`
- **Dependencies**: None
- **Acceptance**: Hook imported correctly
- **Status**: `pending`

### Phase 2: Replace Manual Validation

#### Task 2.3: Replace Manual Validation State `[P]`

- **File**: `src/components/ui/promote-request-dialog.tsx`
- **Description**: Remove `ValidationErrors` interface and `validationErrors` state, use hook's `errors` instead
- **Dependencies**: Task 2.1, Task 2.2
- **Acceptance**: Manual error state removed, hook's errors used
- **Status**: `pending`

#### Task 2.4: Replace Manual validateForm Function `[P]`

- **File**: `src/components/ui/promote-request-dialog.tsx`
- **Description**: Remove manual `validateForm` function, use hook's `validateForm` instead
- **Dependencies**: Task 2.1, Task 2.2
- **Acceptance**: Manual validation function removed, hook's validateForm used
- **Status**: `pending`

#### Task 2.5: Replace Manual Error Clearing `[P]`

- **File**: `src/components/ui/promote-request-dialog.tsx`
- **Description**: Replace manual error clearing logic with hook's `clearFieldError` function
- **Dependencies**: Task 2.3
- **Acceptance**: Manual error clearing removed, hook's clearFieldError used
- **Status**: `pending`

#### Task 2.6: Update Error Display `[P]`

- **File**: `src/components/ui/promote-request-dialog.tsx`
- **Description**: Update error display to use hook's `errors` instead of `validationErrors`
- **Dependencies**: Task 2.3
- **Acceptance**: Error display uses hook's errors, matches existing behavior
- **Status**: `pending`

**Checkpoint**: PromoteRequestDialog uses useFormValidation, validation behavior matches existing

---

## User Story 3: Migrate Settings Page to useFormValidation

### Phase 1: Setup Validation Schema

#### Task 3.1: Create Validation Schema for Settings `[P]`

- **File**: `src/pages/Settings.tsx`
- **Description**: Define validation schema with requestTimeout and maxHistory using custom validation functions
- **Dependencies**: None
- **Acceptance**: Validation schema defined with custom number validation matching existing rules
- **Status**: `pending`

#### Task 3.2: Import useFormValidation Hook `[P]`

- **File**: `src/pages/Settings.tsx`
- **Description**: Add import for `useFormValidation` hook from `../hooks/useFormValidation`
- **Dependencies**: None
- **Acceptance**: Hook imported correctly
- **Status**: `pending`

### Phase 2: Replace Manual Validation

#### Task 3.3: Replace Manual Validation State `[P]`

- **File**: `src/pages/Settings.tsx`
- **Description**: Remove `ValidationErrors` interface and `validationErrors` state, remove `validateRequestTimeout` and `validateMaxHistory` functions, use hook's `errors` instead
- **Dependencies**: Task 3.1, Task 3.2
- **Acceptance**: Manual error state and validation functions removed, hook's errors used
- **Status**: `pending`

#### Task 3.4: Replace Manual validateAllSettings Function `[P]`

- **File**: `src/pages/Settings.tsx`
- **Description**: Remove manual `validateAllSettings` function, use hook's `validateForm` instead
- **Dependencies**: Task 3.1, Task 3.2
- **Acceptance**: Manual validation function removed, hook's validateForm used
- **Status**: `pending`

#### Task 3.5: Replace Manual Error Clearing `[P]`

- **File**: `src/pages/Settings.tsx`
- **Description**: Replace manual error clearing logic with hook's `clearFieldError` function
- **Dependencies**: Task 3.3
- **Acceptance**: Manual error clearing removed, hook's clearFieldError used
- **Status**: `pending`

#### Task 3.6: Update Error Display `[P]`

- **File**: `src/pages/Settings.tsx`
- **Description**: Update error display to use hook's `errors` instead of `validationErrors`
- **Dependencies**: Task 3.3
- **Acceptance**: Error display uses hook's errors, matches existing behavior
- **Status**: `pending`

**Checkpoint**: Settings page uses useFormValidation, validation behavior matches existing

---

## Testing Tasks

### Manual Testing

#### Test Task 1: Test SaveRequestDialog Validation

- **File**: Manual testing
- **Description**: Test SaveRequestDialog validation: name (required, minLength, maxLength), collection (required)
- **Dependencies**: All Task 1.x tasks
- **Status**: `pending`

#### Test Task 2: Test PromoteRequestDialog Validation

- **File**: Manual testing
- **Description**: Test PromoteRequestDialog validation: name (required, minLength, maxLength), collection (required)
- **Dependencies**: All Task 2.x tasks
- **Status**: `pending`

#### Test Task 3: Test Settings Page Validation

- **File**: Manual testing
- **Description**: Test Settings page validation: requestTimeout (min: 1000, max: 300000), maxHistory (min: 1, max: 10000)
- **Dependencies**: All Task 3.x tasks
- **Status**: `pending`

---

## Completion Checklist

- [ ] All Task 1.x tasks completed (SaveRequestDialog)
- [ ] All Task 2.x tasks completed (PromoteRequestDialog)
- [ ] All Task 3.x tasks completed (Settings)
- [ ] All test tasks completed
- [ ] No validation regressions
- [ ] ~80 lines of code eliminated
- [ ] Documentation updated
- [ ] Feature status updated to `completed`
