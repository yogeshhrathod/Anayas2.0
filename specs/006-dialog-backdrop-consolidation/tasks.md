# Task Breakdown: Dialog Backdrop/Portal Logic Consolidation

**Status**: `completed`  
**Feature ID**: `006-dialog-backdrop-consolidation`  
**Created**: 2025-01-27  
**Last Updated**: 2025-01-27

## Task Breakdown

### Task 1: Extend Dialog Component to Support Custom Headers

**Status**: `completed`  
**File**: `src/components/ui/dialog.tsx`

- [x] Extend title prop to accept ReactNode
- [x] Extend description prop to accept ReactNode
- [x] Verify Escape key handling (already present)
- [x] Test with custom headers

### Task 2: Migrate InputDialog to Base Dialog

**Status**: `completed`  
**File**: `src/components/ui/input-dialog.tsx`

- [x] Replace backdrop div with base Dialog component
- [x] Remove duplicate backdrop/escape logic
- [x] Update props to match Dialog API
- [x] Test functionality
- [x] Verify no regressions

### Task 3: Migrate SaveRequestDialog to Dialog

**Status**: `completed`  
**File**: `src/components/ui/save-request-dialog.tsx`

- [x] Use Dialog with custom title (ReactNode with icon)
- [x] Remove duplicate backdrop div
- [x] Remove duplicate escape key handler
- [x] Test functionality
- [x] Verify no regressions

### Task 4: Migrate PromoteRequestDialog to Dialog

**Status**: `completed`  
**File**: `src/components/ui/promote-request-dialog.tsx`

- [x] Use Dialog with custom title (ReactNode with icon)
- [x] Remove duplicate backdrop div
- [x] Remove duplicate escape key handler
- [x] Test functionality
- [x] Verify no regressions

### Task 5: Migrate BulkEditModal to Dialog

**Status**: `completed`  
**File**: `src/components/ui/bulk-edit-modal.tsx`

- [x] Use Dialog component
- [x] Remove duplicate backdrop div
- [x] Remove duplicate escape key handler
- [x] Test functionality
- [x] Verify no regressions

### Task 6: Migrate CurlImportDialog to Dialog

**Status**: `completed`  
**File**: `src/components/curl/CurlImportDialog.tsx`

- [x] Use Dialog component
- [x] Remove duplicate backdrop div
- [x] Remove duplicate portal (use Dialog's portal)
- [x] Remove duplicate escape key handler
- [x] Test functionality
- [x] Verify no regressions

### Task 7: Migrate CollectionRunner to Dialog

**Status**: `completed`  
**File**: `src/components/collection/CollectionRunner.tsx`

- [x] Use Dialog component
- [x] Remove duplicate backdrop div
- [x] Escape key handling (via Dialog)
- [x] Test functionality
- [x] Verify no regressions

### Task 8: Migrate RequestPresets to Dialog

**Status**: `completed`  
**File**: `src/components/request/RequestPresets.tsx`

- [x] Use Dialog component
- [x] Remove duplicate backdrop div
- [x] Remove duplicate escape key handler
- [x] Test functionality
- [x] Verify no regressions

### Task 9: Migrate ShortcutHelp to Dialog

**Status**: `completed`  
**File**: `src/components/ShortcutHelp.tsx`

- [x] Use Dialog component
- [x] Remove duplicate backdrop div
- [x] Remove duplicate escape key handler
- [x] Test functionality
- [x] Verify no regressions

### Task 10: Migrate History Dialog to Dialog

**Status**: `completed`  
**File**: `src/pages/History.tsx`

- [x] Use Dialog with custom title (ReactNode with badges)
- [x] Remove duplicate backdrop div
- [x] Remove duplicate escape key handler
- [x] Test functionality
- [x] Verify no regressions

### Task 11: Testing and Verification

**Status**: `completed`

- [x] Test all 10 dialogs open/close correctly
- [x] Test backdrop click closes all dialogs
- [x] Test Escape key closes all dialogs
- [x] Test portal rendering (check DOM)
- [x] Test z-index stacking (multiple dialogs)
- [x] Test in form context (no form submission on backdrop click)
- [x] Verify no TypeScript errors
- [x] Verify no linter errors
- [x] Verify no visual regressions

### Task 12: Documentation Update

**Status**: `completed`

- [x] Update `common-utils.md` with Dialog documentation
- [x] Add examples for Dialog usage with custom headers
- [x] Document ReactNode support for title/description

## Verification Checklist

- [x] Dialog component extended to support ReactNode title/description
- [x] InputDialog uses base Dialog
- [x] SaveRequestDialog uses Dialog (with custom title)
- [x] PromoteRequestDialog uses Dialog (with custom title)
- [x] BulkEditModal uses Dialog
- [x] CurlImportDialog uses Dialog
- [x] CollectionRunner uses Dialog
- [x] RequestPresets uses Dialog
- [x] ShortcutHelp uses Dialog
- [x] History dialog uses Dialog (with custom title)
- [x] All dialogs close on backdrop click
- [x] All dialogs close on Escape key
- [x] All dialogs render in portal
- [x] No duplicated backdrop code remains
- [x] No TypeScript errors
- [x] No linter errors
- [x] No visual regressions
- [x] Documentation updated
