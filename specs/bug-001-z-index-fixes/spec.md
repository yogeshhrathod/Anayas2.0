# Bug Report: z-index-fixes

**Status**: `testing`  
**Bug ID**: `bug-001-z-index-fixes`  
**Severity**: `high`  
**Priority**: `P1`  
**Created**: 2025-11-14  
**Last Updated**: 2025-01-27  
**Reporter**: Development Team  
**Assignee**: Development Team  
**Related Feature**: N/A (Infrastructure/UI Fix)

## Summary

Z-index values are inconsistent and hardcoded throughout the application, causing layering issues especially in the home page and request builder where dialogs, dropdowns, and overlays conflict with each other.

## Description

The application has multiple z-index issues:

1. **No centralized z-index utility**: The `src/lib/z-index.ts` file referenced in `common-utils.md` does not exist, leading to hardcoded values throughout the codebase.

2. **Inconsistent z-index hierarchy**: Components use arbitrary z-index values without a proper layering system:
   - GlobalSearch: `z-[99999]` (extremely high)
   - CurlImportDialog: `z-[99999]` (extremely high)
   - VariableContextMenu: `z-[10001]` (very high)
   - VariableAutocomplete: `z-[10000]` (very high)
   - SelectContent: `z-[10000]` (very high)
   - Dialogs (SaveRequestDialog, PromoteRequestDialog, etc.): `z-[9999]`
   - DropdownMenu: `z-[9999]`
   - Tooltip: `z-[9999]`
   - EnvironmentSwitcher/Selector: `z-[9998]` and `z-[9999]`
   - ContextMenu: `z-50` (too low, conflicts with other components)
   - Toast: `z-[100]` (too low, may be hidden behind dialogs)
   - ShortcutHelp: `z-50` (too low)
   - Homepage status bar: `z-0` (may cause issues with overlays)
   - Resize handles: `z-50` (may conflict)

3. **Specific issues in home page and request builder**:
   - **CRITICAL**: Environment dropdown on home page goes behind content (root cause: `overflow-hidden` on Homepage wrapper creates conflicting stacking context)
   - Dialogs (SaveRequestDialog, PromoteRequestDialog) may be hidden behind other overlays
   - Select dropdowns in dialogs may appear behind dialog overlays
   - GlobalSearch results may appear behind dialogs
   - Context menus may be hidden behind other UI elements
   - Tooltips may be hidden behind dialogs or dropdowns

## Reproduction Steps

1. **CRITICAL - Home Page Environment Dropdown Issue**:
   - Open the application and navigate to the home page
   - Click on the environment selector dropdown in the navigation bar
   - Observe that the dropdown goes behind the page content (should appear above)
   - Note: This issue does NOT occur on Collections or Environments pages

2. Open the request builder
3. Try opening a dialog (e.g., Save Request dialog)
4. While the dialog is open, try opening a dropdown menu or select component
5. Observe that some UI elements appear behind others incorrectly
6. Try opening GlobalSearch (⌘K) while a dialog is open
7. Observe z-index conflicts

## Expected Behavior

- All UI elements should have a proper z-index hierarchy:
  - Base content: 0-100
  - Sticky headers/footers: 100-500
  - Dropdowns/Popovers: 1000-2000
  - Modals/Dialogs: 3000-4000
  - Tooltips: 5000-6000
  - Global Search: 7000-8000
  - Toast/Notifications: 9000-10000
- Dialogs should always appear above other UI elements
- Dropdowns in dialogs should appear above the dialog content
- GlobalSearch should appear above dialogs
- Tooltips should appear above most elements but below dialogs
- All z-index values should use a centralized utility

## Actual Behavior

- **CRITICAL**: Environment dropdown on home page goes behind content (root cause: `overflow-hidden` on Homepage wrapper creates conflicting stacking context with NavigationBar's `backdrop-blur-md`)
- Z-index values are hardcoded inconsistently
- Some components (ContextMenu, Toast) have too low z-index values
- Some components (GlobalSearch, CurlImportDialog) have extremely high z-index values
- No centralized z-index management
- Components conflict with each other, especially in the home page and request builder

## Environment

- **OS**: All platforms (macOS, Windows, Linux)
- **App Version**: Current development version
- **Electron Version**: 28
- **React Version**: 18

## Screenshots/Logs

N/A - Visual layering issues that need to be observed in the UI

## Impact

- **Users Affected**: All users
- **Workaround Available**: No - this is a fundamental UI layering issue
- **Business Impact**: 
  - Poor user experience due to UI elements appearing in wrong order
  - Dialogs may be unusable if overlays appear on top
  - Dropdowns in dialogs may not be accessible
  - Professional appearance is compromised

## Additional Context

- The `common-utils.md` file references a `z-index.ts` utility that should exist but doesn't
- This is a foundational fix that will improve maintainability
- All future components should use the centralized z-index utility
- **Home Page Fix**: The root cause of the environment dropdown issue was identified as a stacking context conflict. The `overflow-hidden` on Homepage.tsx line 8 was unnecessary (ApiRequestBuilder already handles overflow internally) and created a conflicting stacking context with NavigationBar's `backdrop-blur-md`. The fix removes `overflow-hidden` and adds `z-sticky` to NavigationBar.

## Root Cause Analysis

[See plan.md for detailed root cause analysis]

## Fix Plan

[See plan.md for detailed fix plan]

## Verification Steps

[See tasks.md for verification steps]

## Related Issues

- Related to UI/UX improvements
- Affects all pages but especially home page and request builder

## Notes

- This fix should be done before adding new UI components to prevent further z-index conflicts
- The centralized z-index utility will make future development easier and more consistent
