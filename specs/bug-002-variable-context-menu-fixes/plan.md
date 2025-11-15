# Fix Plan: variable-context-menu-fixes

**Status**: `resolved`  
**Bug ID**: `bug-002-variable-context-menu-fixes`  
**Created**: 2025-01-27  
**Last Updated**: 2025-01-27

## Root Cause Analysis

### Issue 1: Context Menu Not Closing on Outside Click

**Root Cause**: 
The `VariableContextMenu` component was rendered without any mechanism to detect outside clicks. The `VariableInputUnified` component (which replaced `OverlayVariableInput`) did not integrate the context menu with the `useClickOutside` hook that was already available in the codebase.

**Why it happened**:
- During the consolidation of variable input components, the context menu was ported but the click-outside handling was not properly integrated
- The original `HighlightedVariableInput` had `useClickOutside` for both autocomplete and context menu, but this was not carried over to the unified component

### Issue 2: Copy Value Button for Dynamic Variables

**Root Cause**:
The `VariableContextMenu` component only checked if a variable was resolved (`isResolved`), but didn't distinguish between static and dynamic variables. Dynamic variables (starting with `$`) always have resolved values since they're generated at runtime, but copying these values is useless since they change on each request.

**Why it happened**:
- The component logic was: "Show copy value if variable is resolved"
- Dynamic variables are always resolved (they generate values immediately)
- No check was made to exclude dynamic variables from showing the copy button

## Fix Strategy

### Fix 1: Add Click-Outside Handling

**Approach**:
1. Add a ref (`contextMenuRef`) to track the context menu element
2. Use the existing `useClickOutside` hook to detect outside clicks
3. Update `VariableContextMenu` to accept a ref using React's `forwardRef`
4. Apply the hook to close the menu when clicking outside

**Files to Modify**:
- `src/components/ui/variable-input-unified.tsx`
- `src/components/ui/variable-context-menu.tsx`

**Implementation Details**:
- Import `useClickOutside` hook
- Create `contextMenuRef` using `useRef<HTMLDivElement>(null)`
- Call `useClickOutside(contextMenuRef, () => setShowContextMenu(false), showContextMenu)`
- Update `VariableContextMenu` to use `forwardRef` and attach ref to root div
- Apply to both `highlighted` and `overlay` variants

### Fix 2: Hide Copy Value for Dynamic Variables

**Approach**:
1. Detect if variable is dynamic (starts with `$`)
2. Update the condition to exclude dynamic variables from showing copy value button
3. Change from `isResolved` to `isResolved && !isDynamic`

**Files to Modify**:
- `src/components/ui/variable-context-menu.tsx`

**Implementation Details**:
- Add `const isDynamic = variableName.startsWith('$');`
- Change condition from `{isResolved && (` to `{isResolved && !isDynamic && (`

## Implementation Steps

1. ✅ Add `useClickOutside` import to `variable-input-unified.tsx`
2. ✅ Create `contextMenuRef` in `VariableInputUnified`
3. ✅ Add `useClickOutside` hook call for context menu
4. ✅ Update `VariableContextMenu` to use `forwardRef`
5. ✅ Attach ref to context menu root div
6. ✅ Add `isDynamic` check in `VariableContextMenu`
7. ✅ Update copy value button condition
8. ✅ Test both fixes

## Testing Plan

### Test Case 1: Context Menu Closes on Outside Click
- [x] Right-click on variable in overlay variant
- [x] Click outside menu → Menu closes
- [x] Press Escape → Menu closes
- [x] Click on input → Menu closes
- [x] Test in highlighted variant → Same behavior

### Test Case 2: Copy Value Hidden for Dynamic Variables
- [x] Right-click `{{$timestamp}}` → No copy value button
- [x] Right-click `{{$randomInt}}` → No copy value button
- [x] Right-click `{{$guid}}` → No copy value button
- [x] Right-click `{{base_url}}` (resolved) → Copy value button visible
- [x] Right-click `{{unresolved}}` (unresolved) → No copy value button

## Risk Assessment

**Low Risk**: 
- Changes are isolated to context menu component
- No breaking changes to API
- Backward compatible
- Uses existing, tested `useClickOutside` hook

## Performance Impact

- **Memory**: No impact (<1MB)
- **Load Time**: No impact (<1ms)
- **Bundle Size**: No impact (uses existing hook)

## Success Criteria

- [x] Context menu closes on outside click
- [x] Context menu closes on Escape key
- [x] Copy value button hidden for dynamic variables
- [x] Copy value button visible for resolved non-dynamic variables
- [x] No regressions in existing functionality
