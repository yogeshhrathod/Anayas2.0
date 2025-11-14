# Task Breakdown: z-index-fixes

**Bug ID**: `bug-001-z-index-fixes`  
**Status**: `planned`  
**Related Spec**: [spec.md](spec.md)  
**Related Plan**: [plan.md](plan.md)

## Task Organization

Tasks are organized by implementation phase. Tasks marked with `[P]` can be executed in parallel.

## Phase 1: Configure Tailwind Z-Index

### Task 1.1: Add z-index to Tailwind config
- **File**: `tailwind.config.js`
- **Description**: Add z-index values to `theme.extend.zIndex` for semantic class names (z-dialog, z-dropdown, etc.)
- **Dependencies**: None
- **Acceptance**: 
  - `tailwind.config.js` includes z-index values in `theme.extend.zIndex`
  - All semantic classes defined: base, content, sticky, dropdown, popover, context-menu, modal-backdrop, modal, dialog, tooltip, global-search, toast
  - Special case `dialog-dropdown` added (value: 3501) for dropdowns in dialogs
  - Tailwind IntelliSense recognizes new classes
- **Status**: `pending`

**Checkpoint**: Tailwind config updated with z-index values. Semantic classes like `z-dialog` are available in all components.

---

## Phase 2: Fix Home Page & Request Builder (Primary Focus)

### Task 2.1: Fix Homepage status bar
- **File**: `src/pages/Homepage.tsx`
- **Description**: Replace `z-0` with appropriate Tailwind class (likely `z-sticky` or `z-base`)
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - Status bar uses semantic Tailwind class (`z-sticky` or `z-base`)
  - No visual regression
  - Status bar appears correctly
- **Status**: `pending`

### Task 2.2: Fix SaveRequestDialog
- **File**: `src/components/ui/save-request-dialog.tsx`
- **Description**: Replace `z-[9999]` with `z-dialog`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - Dialog uses `z-dialog` class
  - Dialog appears above content
  - No visual regression
- **Status**: `pending`

### Task 2.3: Fix PromoteRequestDialog
- **File**: `src/components/ui/promote-request-dialog.tsx`
- **Description**: Replace `z-[9999]` with `z-dialog`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - Dialog uses `z-dialog` class
  - Dialog appears above content
  - No visual regression
- **Status**: `pending`

### Task 2.4: Fix GlobalSearch
- **File**: `src/components/GlobalSearch.tsx`
- **Description**: Replace `z-[99999]` with `z-global-search`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - GlobalSearch uses `z-global-search` class
  - Search results appear above dialogs
  - No visual regression
- **Status**: `pending`

### Task 2.5: Fix SelectContent (used in dialogs)
- **File**: `src/components/ui/select.tsx`
- **Description**: Replace `z-[10000]` with `z-dropdown` (or `z-dialog-dropdown` when explicitly in dialog context)
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - SelectContent uses appropriate Tailwind class (`z-dropdown` or `z-dialog-dropdown`)
  - Dropdowns in dialogs appear above dialog content
  - Dropdowns outside dialogs appear correctly
  - No visual regression
- **Status**: `pending`

### Task 2.6: Fix DropdownMenu (used in request builder)
- **File**: `src/components/ui/dropdown-menu.tsx`
- **Description**: Replace `z-[9999]` with `z-dropdown` in both `DropdownMenuContent` and `DropdownMenuSubContent`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - DropdownMenu uses `z-dropdown` class
  - Dropdowns appear above content
  - No visual regression
- **Status**: `pending`

**Checkpoint**: Home page and request builder z-index issues are fixed. Test by opening dialogs, dropdowns, and GlobalSearch to verify correct layering.

---

## Phase 3: Fix All Other Components

### Task 3.1: Fix ContextMenu
- **File**: `src/components/ui/context-menu.tsx`
- **Description**: Replace `z-50` with `z-context-menu` in both `ContextMenuContent` and `ContextMenuSubContent`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - ContextMenu uses `z-context-menu` class
  - Context menus appear above content
  - No visual regression
- **Status**: `pending`

### Task 3.2: Fix Tooltip
- **File**: `src/components/ui/tooltip.tsx`
- **Description**: Replace `z-[9999]` with `z-tooltip`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - Tooltip uses `z-tooltip` class
  - Tooltips appear correctly
  - No visual regression
- **Status**: `pending`

### Task 3.3: Fix Toast
- **File**: `src/components/ui/toast.tsx`
- **Description**: Replace `z-[100]` with `z-toast`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - Toast uses `z-toast` class
  - Toasts appear above everything
  - No visual regression
- **Status**: `pending`

### Task 3.4: Fix VariableAutocomplete
- **File**: `src/components/ui/variable-autocomplete.tsx`
- **Description**: Replace `z-[10000]` with `z-popover` or `z-dropdown`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - VariableAutocomplete uses appropriate Tailwind class (`z-popover` or `z-dropdown`)
  - Autocomplete appears correctly
  - No visual regression
- **Status**: `pending`

### Task 3.5: Fix VariableContextMenu
- **File**: `src/components/ui/variable-context-menu.tsx`
- **Description**: Replace `z-[10001]` with `z-context-menu`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - VariableContextMenu uses `z-context-menu` class
  - Context menu appears correctly
  - No visual regression
- **Status**: `pending`

### Task 3.6: Fix EnvironmentSwitcher
- **File**: `src/components/EnvironmentSwitcher.tsx`
- **Description**: Replace `z-[9998]` and `z-[9999]` with appropriate Tailwind classes
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - EnvironmentSwitcher uses appropriate Tailwind classes
  - Switcher appears correctly
  - No visual regression
- **Status**: `pending`

### Task 3.7: Fix EnvironmentSelector
- **File**: `src/components/EnvironmentSelector.tsx`
- **Description**: Replace `z-[9998]` and `z-[9999]` with appropriate Tailwind classes
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - EnvironmentSelector uses appropriate Tailwind classes
  - Selector appears correctly
  - No visual regression
- **Status**: `pending`

### Task 3.8: Fix CurlImportDialog
- **File**: `src/components/curl/CurlImportDialog.tsx`
- **Description**: Replace `z-[99999]` with `z-dialog` (both backdrop and content)
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - CurlImportDialog uses `z-dialog` class
  - Dialog appears above content
  - No visual regression
- **Status**: `pending`

### Task 3.9: Fix RequestPresets dialog
- **File**: `src/components/request/RequestPresets.tsx`
- **Description**: Replace dialog `z-[9999]` with `z-dialog`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - RequestPresets dialog uses `z-dialog` class
  - Dialog appears above content
  - No visual regression
- **Status**: `pending`

### Task 3.10: Fix BulkEditModal
- **File**: `src/components/ui/bulk-edit-modal.tsx`
- **Description**: Replace `z-[9999]` with `z-dialog`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - BulkEditModal uses `z-dialog` class
  - Modal appears above content
  - No visual regression
- **Status**: `pending`

### Task 3.11: Fix InputDialog
- **File**: `src/components/ui/input-dialog.tsx`
- **Description**: Replace `z-[9999]` with `z-dialog`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - InputDialog uses `z-dialog` class
  - Dialog appears above content
  - No visual regression
- **Status**: `pending`

### Task 3.12: Fix MonacoEditor fullscreen
- **File**: `src/components/ui/monaco-editor.tsx`
- **Description**: Replace fullscreen `z-[9999]` with `z-modal`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - MonacoEditor fullscreen uses `z-modal` class
  - Fullscreen editor appears above content
  - No visual regression
- **Status**: `pending`

### Task 3.13: Fix MonacoKeyValueEditor fullscreen
- **File**: `src/components/ui/monaco-key-value-editor.tsx`
- **Description**: Replace fullscreen `z-[9999]` with `z-modal`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - MonacoKeyValueEditor fullscreen uses `z-modal` class
  - Fullscreen editor appears above content
  - No visual regression
- **Status**: `pending`

### Task 3.14: Fix ShortcutHelp
- **File**: `src/components/ShortcutHelp.tsx`
- **Description**: Replace `z-50` with `z-dialog`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - ShortcutHelp uses `z-dialog` class
  - Help dialog appears above content
  - No visual regression
- **Status**: `pending`

### Task 3.15: Fix ThemeCustomizer
- **File**: `src/components/ThemeCustomizer.tsx`
- **Description**: Replace `z-[9999]` with `z-dialog`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - ThemeCustomizer uses `z-dialog` class
  - Customizer appears above content
  - No visual regression
- **Status**: `pending`

### Task 3.16: Fix CollectionRunner
- **File**: `src/components/collection/CollectionRunner.tsx`
- **Description**: Replace `z-[9999]` with `z-dialog`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - CollectionRunner uses `z-dialog` class
  - Runner dialog appears above content
  - No visual regression
- **Status**: `pending`

### Task 3.17: Fix History page dialog
- **File**: `src/pages/History.tsx`
- **Description**: Replace dialog `z-[9999]` with `z-dialog`
- **Dependencies**: Task 1.1
- **Acceptance**: 
  - History dialog uses `z-dialog` class
  - Dialog appears above content
  - No visual regression
- **Status**: `pending`

**Checkpoint**: All components use semantic Tailwind z-index classes. No hardcoded z-index values remain (all values defined in tailwind.config.js).

---

## Phase 4: Verification & Testing

### Task 4.1: Test home page z-index
- **File**: Manual testing
- **Description**: Test z-index on home page:
  - Status bar appears correctly
  - No conflicts with other elements
- **Dependencies**: Tasks 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
- **Acceptance**: 
  - All home page elements appear correctly
  - No z-index conflicts observed
- **Status**: `pending`

### Task 4.2: Test request builder z-index
- **File**: Manual testing
- **Description**: Test z-index in request builder:
  - Dialogs appear above content
  - Dropdowns in dialogs appear correctly
  - No conflicts between overlays
- **Dependencies**: Tasks 2.2, 2.3, 2.5, 2.6
- **Acceptance**: 
  - All request builder elements appear correctly
  - Dialogs are accessible
  - Dropdowns are accessible
- **Status**: `pending`

### Task 4.3: Test GlobalSearch z-index
- **File**: Manual testing
- **Description**: Test GlobalSearch appears above dialogs:
  - Open a dialog
  - Open GlobalSearch (⌘K)
  - Verify GlobalSearch appears above dialog
- **Dependencies**: Tasks 2.2, 2.3, 2.4
- **Acceptance**: 
  - GlobalSearch appears above dialogs
  - No z-index conflicts
- **Status**: `pending`

### Task 4.4: Test all dialogs
- **File**: Manual testing
- **Description**: Test all dialog components appear correctly:
  - SaveRequestDialog
  - PromoteRequestDialog
  - CurlImportDialog
  - RequestPresets dialog
  - BulkEditModal
  - InputDialog
  - ShortcutHelp
  - ThemeCustomizer
  - CollectionRunner
  - History dialog
- **Dependencies**: All Phase 2 and Phase 3 dialog tasks
- **Acceptance**: 
  - All dialogs appear above content
  - All dialogs are accessible
  - No visual regressions
- **Status**: `pending`

### Task 4.5: Test dropdowns and popovers
- **File**: Manual testing
- **Description**: Test dropdowns and popovers appear correctly:
  - DropdownMenu
  - SelectContent
  - VariableAutocomplete
  - EnvironmentSwitcher
  - EnvironmentSelector
- **Dependencies**: All Phase 2 and Phase 3 dropdown/popover tasks
- **Acceptance**: 
  - All dropdowns/popovers appear correctly
  - Dropdowns in dialogs appear above dialog content
  - No visual regressions
- **Status**: `pending`

### Task 4.6: Test context menus
- **File**: Manual testing
- **Description**: Test context menus appear correctly:
  - ContextMenu
  - VariableContextMenu
- **Dependencies**: Tasks 3.1, 3.5
- **Acceptance**: 
  - Context menus appear above content
  - No visual regressions
- **Status**: `pending`

### Task 4.7: Test tooltips
- **File**: Manual testing
- **Description**: Test tooltips appear correctly:
  - Hover over elements with tooltips
  - Verify tooltips appear above content
- **Dependencies**: Task 3.2
- **Acceptance**: 
  - Tooltips appear correctly
  - No visual regressions
- **Status**: `pending`

### Task 4.8: Test toast notifications
- **File**: Manual testing
- **Description**: Test toast notifications appear above everything:
  - Trigger a toast notification
  - Open a dialog while toast is visible
  - Verify toast appears above dialog
- **Dependencies**: Tasks 3.3, 2.2, 2.3
- **Acceptance**: 
  - Toasts appear above everything
  - No visual regressions
- **Status**: `pending`

### Task 4.9: Test fullscreen editors
- **File**: Manual testing
- **Description**: Test fullscreen editors appear correctly:
  - MonacoEditor fullscreen
  - MonacoKeyValueEditor fullscreen
- **Dependencies**: Tasks 3.12, 3.13
- **Acceptance**: 
  - Fullscreen editors appear above content
  - No visual regressions
- **Status**: `pending`

### Task 4.10: Test multiple overlays simultaneously
- **File**: Manual testing
- **Description**: Test multiple overlays open at once:
  - Open a dialog
  - Open a dropdown in the dialog
  - Open GlobalSearch
  - Verify correct layering
- **Dependencies**: All Phase 2 and Phase 3 tasks
- **Acceptance**: 
  - All overlays appear in correct order
  - No conflicts
  - All elements are accessible
- **Status**: `pending`

**Checkpoint**: All z-index fixes verified. No visual regressions. All UI elements appear in correct order.

---

## Task Execution Order

### Sequential Tasks
1. Task 1.1 (Create z-index utility) - Must complete first
2. All Phase 2 tasks (can be done in parallel after Task 1.1)
3. All Phase 3 tasks (can be done in parallel after Task 1.1)
4. All Phase 4 tasks (verification, must complete after all fixes)

### Parallel Tasks
- Tasks 2.1-2.6 can run in parallel after Task 1.1
- Tasks 3.1-3.17 can run in parallel after Task 1.1
- Tasks 4.1-4.10 can run in parallel after all fixes are complete

---

## Progress Tracking

**Total Tasks**: 27  
**Completed**: 0  
**In Progress**: 0  
**Pending**: 27  
**Blocked**: 0

### Phase Breakdown
- **Phase 1**: 1 task
- **Phase 2**: 6 tasks (home page & request builder focus)
- **Phase 3**: 17 tasks (all other components)
- **Phase 4**: 10 tasks (verification & testing)

---

## Notes

- All tasks should use semantic Tailwind classes: `z-dialog`, `z-dropdown`, `z-tooltip`, etc.
- No imports needed - classes are available globally via Tailwind config
- Use `z-dialog-dropdown` for dropdowns that appear inside dialogs
- Test each component after fixing to catch issues early
- Focus on Phase 2 (home page & request builder) first as these are the primary areas mentioned in the bug report
- Tailwind IntelliSense should autocomplete the new z-index classes
