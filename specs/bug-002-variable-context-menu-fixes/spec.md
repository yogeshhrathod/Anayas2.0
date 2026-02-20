# Bug Report: variable-context-menu-fixes

**Status**: `resolved`  
**Bug ID**: `bug-002-variable-context-menu-fixes`  
**Severity**: `medium`  
**Priority**: `P1`  
**Created**: 2025-01-27  
**Last Updated**: 2025-01-27  
**Reporter**: User  
**Assignee**: Development Team  
**Related Feature**: `specs/005-variable-input-consolidation/` (Variable Input Components Consolidation)

## Summary

Variable context menu in request builder does not close on outside click, and copy value button appears for dynamic variables where it's useless.

## Description

Two issues with the variable context menu in the request builder:

1. **Context menu doesn't close on outside click**: When right-clicking on environment variables in the request builder (using `VariableInputUnified` with `variant="overlay"`), the context menu appears but does not disappear when clicking outside of it. Users must manually close it or click elsewhere, creating a poor UX.

2. **Copy value button shows for dynamic variables**: The context menu shows a "Copy Value" button for dynamic variables (like `{{$timestamp}}`, `{{$randomInt}}`, etc.), but these values are generated at runtime and copying them is useless since they change on each request.

## Reproduction Steps

### Issue 1: Context menu doesn't close

1. Open request builder
2. Navigate to any field that uses variable input (URL, headers, auth fields)
3. Type a variable like `{{base_url}}`
4. Right-click on the variable capsule
5. Context menu appears
6. Click anywhere outside the context menu
7. **Observed**: Context menu remains open
8. **Expected**: Context menu should close

### Issue 2: Copy value for dynamic variables

1. Open request builder
2. Navigate to any field that uses variable input
3. Type a dynamic variable like `{{$timestamp}}` or `{{$randomInt}}`
4. Right-click on the variable capsule
5. Context menu appears
6. **Observed**: "Copy Value" button is visible
7. **Expected**: "Copy Value" button should not appear for dynamic variables

## Expected Behavior

1. Context menu should close when:
   - Clicking outside the menu
   - Pressing Escape key
   - Clicking on the input field

2. "Copy Value" button should only appear for:
   - Non-dynamic variables (not starting with `$`)
   - Variables that have resolved values
   - Should NOT appear for dynamic variables like `{{$timestamp}}`, `{{$randomInt}}`, etc.

## Actual Behavior

1. Context menu stays open after clicking outside
2. "Copy Value" button appears for all resolved variables, including dynamic ones

## Environment

- **OS**: macOS (darwin 24.6.0)
- **App Version**: Development build
- **Component**: `VariableInputUnified` with `variant="overlay"`
- **Related Component**: `VariableContextMenu`

## Impact

- **Users Affected**: All users using variable inputs in request builder
- **Workaround Available**: Yes - users can press Escape or click the input to close menu, but it's not intuitive
- **Business Impact**: Medium - affects UX and creates confusion with useless copy button for dynamic variables

## Root Cause Analysis

1. **Context menu not closing**: The `VariableContextMenu` component was not integrated with the `useClickOutside` hook. The component was rendered but had no mechanism to detect outside clicks.

2. **Copy value for dynamic variables**: The `VariableContextMenu` component only checked if a variable was resolved (`isResolved`), but didn't check if it was a dynamic variable. Dynamic variables always have resolved values (they're generated at runtime), so the copy button appeared even though copying the value is useless.

## Fix Plan

See `plan.md` for detailed fix plan.

## Fix Summary

### Changes Made:

1. **Added click-outside handling**:
   - Added `contextMenuRef` to `VariableInputUnified` component
   - Integrated `useClickOutside` hook to close context menu on outside click
   - Updated `VariableContextMenu` to accept ref using `forwardRef`
   - Applied to both `highlighted` and `overlay` variants

2. **Hide copy value for dynamic variables**:
   - Added `isDynamic` check in `VariableContextMenu` (variables starting with `$`)
   - Changed condition from `isResolved` to `isResolved && !isDynamic`
   - Dynamic variables no longer show "Copy Value" button

### Files Modified:

- `src/components/ui/variable-input-unified.tsx` - Added context menu ref and `useClickOutside` hook
- `src/components/ui/variable-context-menu.tsx` - Added `forwardRef` support and dynamic variable check

## Verification Steps

1. **Context menu closes on outside click**:
   - [x] Right-click on variable in request builder
   - [x] Click outside the context menu
   - [x] Menu closes immediately
   - [x] Press Escape key
   - [x] Menu closes

2. **Copy value hidden for dynamic variables**:
   - [x] Right-click on `{{$timestamp}}`
   - [x] "Copy Value" button is NOT visible
   - [x] Right-click on `{{base_url}}` (non-dynamic, resolved)
   - [x] "Copy Value" button IS visible
   - [x] Right-click on `{{unresolved_var}}` (non-dynamic, unresolved)
   - [x] "Copy Value" button is NOT visible

## Related Issues

- Related to `specs/005-variable-input-consolidation/` - Variable Input Components Consolidation feature

## Notes

- Fix was implemented as part of the variable input consolidation work
- Both issues were discovered during testing of the unified component
- The fix maintains backward compatibility and doesn't break existing functionality
