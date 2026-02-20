# Fix Plan: z-index-fixes

**Bug ID**: `bug-001-z-index-fixes`  
**Status**: `completed`  
**Related Spec**: [spec.md](spec.md)

## Overview

Create a centralized z-index utility and refactor all hardcoded z-index values throughout the application to use a consistent hierarchy. This will fix layering issues, especially in the home page and request builder where dialogs, dropdowns, and overlays conflict.

## Root Cause Analysis

### Primary Issues

1. **Missing Centralized Z-Index System**: No centralized z-index management system exists. While `common-utils.md` references a z-index utility, the better approach is to use Tailwind's config extension for semantic class names.

2. **No Z-Index Hierarchy**: Components use arbitrary z-index values without a proper layering system:
   - Values range from `z-0` to `z-[99999]` with no clear pattern
   - No understanding of which components should appear above others
   - Conflicts when multiple overlays are open simultaneously

3. **Home Page Stacking Context Issue** (CRITICAL):
   - **Homepage.tsx line 8**: `overflow-hidden` creates a stacking context that conflicts with NavigationBar
   - **NavigationBar line 167**: `backdrop-blur-md` creates another stacking context
   - **EnvironmentSelector dropdown**: Uses `absolute` positioning, trapped in NavigationBar's stacking context
   - **Result**: Home page content (in separate stacking context) can appear above the dropdown
   - **Why it works on Collections/Environments**: Those pages don't have `overflow-hidden`, so no conflicting stacking context
   - **Root Cause**: Unnecessary `overflow-hidden` on Homepage wrapper (ApiRequestBuilder already handles overflow internally)

4. **Specific Conflicts**:
   - **ContextMenu** (`z-50`) is too low and gets hidden behind other components
   - **Toast** (`z-[100]`) is too low and may be hidden behind dialogs
   - **SelectContent** (`z-[10000]`) is higher than dialogs (`z-[9999]`), causing dropdowns to appear above dialog overlays
   - **GlobalSearch** (`z-[99999]`) is unnecessarily high
   - **VariableAutocomplete** and **VariableContextMenu** use very high values that conflict with dialogs
   - **EnvironmentSelector dropdown** goes behind home page content due to stacking context conflict

### Affected Components

**Home Page & Request Builder (Primary Focus)**:

- `src/pages/Homepage.tsx` - Status bar with `z-0`
- `src/components/ApiRequestBuilder.tsx` - Contains dialogs and dropdowns
- `src/components/ui/save-request-dialog.tsx` - Dialog with `z-[9999]`
- `src/components/ui/promote-request-dialog.tsx` - Dialog with `z-[9999]`
- `src/components/GlobalSearch.tsx` - Search results with `z-[99999]`

**All UI Components**:

- `src/components/ui/dropdown-menu.tsx` - `z-[9999]`
- `src/components/ui/select.tsx` - `z-[10000]`
- `src/components/ui/context-menu.tsx` - `z-50` (too low)
- `src/components/ui/tooltip.tsx` - `z-[9999]`
- `src/components/ui/toast.tsx` - `z-[100]` (too low)
- `src/components/ui/variable-autocomplete.tsx` - `z-[10000]`
- `src/components/ui/variable-context-menu.tsx` - `z-[10001]`
- `src/components/EnvironmentSwitcher.tsx` - `z-[9998]` and `z-[9999]`
- `src/components/EnvironmentSelector.tsx` - `z-[9998]` and `z-[9999]`
- `src/components/curl/CurlImportDialog.tsx` - `z-[99999]`
- `src/components/request/RequestPresets.tsx` - Dialog with `z-[9999]`
- `src/components/ui/bulk-edit-modal.tsx` - `z-[9999]`
- `src/components/ui/input-dialog.tsx` - `z-[9999]`
- `src/components/ui/monaco-editor.tsx` - Fullscreen with `z-[9999]`
- `src/components/ui/monaco-key-value-editor.tsx` - Fullscreen with `z-[9999]`
- `src/components/ShortcutHelp.tsx` - `z-50` (too low)
- `src/components/ThemeCustomizer.tsx` - `z-[9999]`
- `src/components/collection/CollectionRunner.tsx` - `z-[9999]`
- `src/pages/History.tsx` - Dialog with `z-[9999]`

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- ✅ Yes - This is a code quality and maintainability improvement. Creating a centralized z-index utility is a constant-time operation with zero runtime performance impact. Refactoring hardcoded values improves maintainability without affecting performance.

**Are there more reusable or cleaner ways to achieve the same?**

- ✅ Creating a centralized utility is the standard approach for managing z-index values
- ✅ Using a TypeScript enum/object ensures type safety and prevents typos
- ✅ Uses Tailwind's native configuration system (more idiomatic than separate utility file)

**Architecture Compliance:**

- ✅ No performance impact (constants only)
- ✅ Centralizes z-index values in Tailwind config (standard Tailwind pattern)
- ✅ Improves code maintainability and consistency
- ✅ No architecture violations

## Z-Index Hierarchy Design

### Proposed Hierarchy (Tailwind Config Extension)

Add z-index values to `tailwind.config.js` in `theme.extend.zIndex`:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      zIndex: {
        // Base content layers (0-100)
        base: '0',
        content: '10',
        sticky: '100',

        // Interactive elements (1000-2000)
        dropdown: '1000',
        popover: '1500',
        'context-menu': '2000',

        // Overlays (3000-4000)
        'modal-backdrop': '3000',
        modal: '3500',
        dialog: '3500',

        // Floating UI (5000-6000)
        tooltip: '5000',

        // Global features (7000-8000)
        'global-search': '7000',

        // Notifications (9000-10000)
        toast: '9000',
      },
    },
  },
};
```

### Usage in Components

Use semantic Tailwind classes instead of hardcoded values:

```tsx
// Before: z-[9999]
// After: z-dialog
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-dialog">

// Before: z-[99999]
// After: z-global-search
<div className="fixed z-global-search">

// Before: z-50
// After: z-context-menu
<div className="z-context-menu">
```

### Rationale

1. **Base (0-100)**: Normal document flow, sticky headers/footers
2. **Interactive (1000-2000)**: Dropdowns, popovers, context menus that appear above content
3. **Overlays (3000-4000)**: Modals and dialogs that should appear above everything except global features
4. **Floating UI (5000-6000)**: Tooltips that should appear above most things
5. **Global Features (7000-8000)**: Global search that should appear above dialogs
6. **Notifications (9000-10000)**: Toasts that should appear above everything

### Benefits of Tailwind Config Approach

- **Type Safety**: Tailwind IntelliSense autocompletes `z-dialog`, `z-modal`, etc.
- **No Runtime Interpolation**: No string interpolation like `z-[${Z_INDEX.DIALOG}]`
- **Better Purging**: Tailwind can optimize unused z-index classes
- **Consistent Pattern**: Matches how colors, spacing, etc. are handled in Tailwind
- **Cleaner Code**: `z-dialog` is more readable than `z-[3500]` or `z-[${Z_INDEX.DIALOG}]`

### Special Cases

- **SelectContent in Dialogs**: Should use `z-dialog-dropdown` (add to config as `'dialog-dropdown': '3501'`) to appear above dialog backdrop but within dialog context
- **VariableAutocomplete**: Should use `z-popover` or `z-dropdown`
- **VariableContextMenu**: Should use `z-context-menu`
- **Fullscreen Editors**: Should use `z-modal` or `z-dialog`

## Files to Modify/Create (with WHY)

### New Files

- `tailwind.config.js` (modify) - **WHY**: Add z-index values to `theme.extend.zIndex` for centralized, semantic z-index classes

### Modified Files

- `src/pages/Homepage.tsx` - **WHY**:
  - Remove `overflow-hidden` from line 8 (creates conflicting stacking context)
  - ApiRequestBuilder already handles overflow internally (line 294)
  - This aligns home page structure with Collections/Environments pages
  - Fix status bar z-index (currently `z-sticky`, already fixed)
- `src/components/NavigationBar.tsx` - **WHY**: Add explicit z-index (`z-sticky` or `z-navigation`) to ensure NavigationBar stays above page content
- `src/components/ApiRequestBuilder.tsx` - **WHY**: No direct z-index, but contains components that need fixes
- `src/components/ui/save-request-dialog.tsx` - **WHY**: Replace `z-[9999]` with `z-dialog`
- `src/components/ui/promote-request-dialog.tsx` - **WHY**: Replace `z-[9999]` with `z-dialog`
- `src/components/GlobalSearch.tsx` - **WHY**: Replace `z-[99999]` with `z-global-search`
- `src/components/ui/dropdown-menu.tsx` - **WHY**: Replace `z-[9999]` with `z-dropdown`
- `src/components/ui/select.tsx` - **WHY**: Replace `z-[10000]` with `z-dropdown` (or `z-dialog-dropdown` when in dialog)
- `src/components/ui/context-menu.tsx` - **WHY**: Replace `z-50` with `z-context-menu`
- `src/components/ui/tooltip.tsx` - **WHY**: Replace `z-[9999]` with `z-tooltip`
- `src/components/ui/toast.tsx` - **WHY**: Replace `z-[100]` with `z-toast`
- `src/components/ui/variable-autocomplete.tsx` - **WHY**: Replace `z-[10000]` with `z-popover` or `z-dropdown`
- `src/components/ui/variable-context-menu.tsx` - **WHY**: Replace `z-[10001]` with `z-context-menu`
- `src/components/EnvironmentSwitcher.tsx` - **WHY**: Replace `z-[9998]` and `z-[9999]` with appropriate Tailwind classes
- `src/components/EnvironmentSelector.tsx` - **WHY**: Replace `z-[9998]` and `z-[9999]` with appropriate Tailwind classes
- `src/components/curl/CurlImportDialog.tsx` - **WHY**: Replace `z-[99999]` with `z-dialog`
- `src/components/request/RequestPresets.tsx` - **WHY**: Replace dialog `z-[9999]` with `z-dialog`
- `src/components/ui/bulk-edit-modal.tsx` - **WHY**: Replace `z-[9999]` with `z-dialog`
- `src/components/ui/input-dialog.tsx` - **WHY**: Replace `z-[9999]` with `z-dialog`
- `src/components/ui/monaco-editor.tsx` - **WHY**: Replace fullscreen `z-[9999]` with `z-modal`
- `src/components/ui/monaco-key-value-editor.tsx` - **WHY**: Replace fullscreen `z-[9999]` with `z-modal`
- `src/components/ShortcutHelp.tsx` - **WHY**: Replace `z-50` with `z-dialog`
- `src/components/ThemeCustomizer.tsx` - **WHY**: Replace `z-[9999]` with `z-dialog`
- `src/components/collection/CollectionRunner.tsx` - **WHY**: Replace `z-[9999]` with `z-dialog`
- `src/pages/History.tsx` - **WHY**: Replace dialog `z-[9999]` with `z-dialog`

## Architecture Decisions

### Decision 1: Z-Index Hierarchy Design

**Context**: Need to establish a clear hierarchy for all UI elements  
**Options Considered**:

- Option A: Use increments of 100 (100, 200, 300, etc.) - Simple but may be too granular
- Option B: Use semantic ranges (0-100 base, 1000-2000 interactive, etc.) - More maintainable, allows for future additions
- Option C: Use very high values (10000+) - Current approach, causes conflicts

**Decision**: Option B - Semantic ranges  
**Rationale**:

- More maintainable and self-documenting
- Allows for future additions within ranges
- Prevents conflicts by using distinct ranges
- Easier to understand component relationships

**Trade-offs**: Slightly more complex than simple increments, but much clearer

### Decision 2: SelectContent in Dialogs

**Context**: Select dropdowns need to appear above dialog content but within dialog context  
**Options Considered**:

- Option A: Use `z-dialog-dropdown` (value: 3501) - Appears above dialog, clear relationship, semantic name
- Option B: Use `z-dropdown` - May conflict if dropdown is higher than dialog
- Option C: Use arbitrary value `z-[3501]` - Works but not semantic

**Decision**: Option A - `z-dialog-dropdown`  
**Rationale**:

- Clear semantic relationship to dialog z-index
- Ensures dropdown appears above dialog content
- Semantic class name makes intent clear
- Consistent with Tailwind pattern

**Trade-offs**: Requires adding one extra class to Tailwind config, but provides better clarity

## Implementation Phases

### Phase 1: Configure Tailwind Z-Index

**Goal**: Add z-index values to Tailwind config for semantic class names  
**Duration**: 15 minutes

**Tasks**:

- [ ] Update `tailwind.config.js` to add z-index values to `theme.extend.zIndex`
- [ ] Add all semantic z-index classes (base, content, sticky, dropdown, popover, context-menu, modal-backdrop, modal, dialog, tooltip, global-search, toast)
- [ ] Add special case: `dialog-dropdown` for dropdowns in dialogs (value: 3501)
- [ ] Verify Tailwind IntelliSense recognizes new classes

**Dependencies**: None  
**Deliverables**: Updated `tailwind.config.js` with z-index extension

### Phase 2: Fix Home Page & Request Builder (Primary Focus)

**Goal**: Fix z-index issues in home page and request builder components  
**Duration**: 30 minutes

**Tasks**:

- [ ] Fix `src/pages/Homepage.tsx` status bar
- [ ] Fix `src/components/ui/save-request-dialog.tsx`
- [ ] Fix `src/components/ui/promote-request-dialog.tsx`
- [ ] Fix `src/components/GlobalSearch.tsx`
- [ ] Fix `src/components/ui/select.tsx` (used in dialogs)
- [ ] Fix `src/components/ui/dropdown-menu.tsx` (used in request builder)

**Dependencies**: Phase 1  
**Deliverables**: Fixed z-index in home page and request builder

### Phase 3: Fix All Other Components

**Goal**: Fix z-index in all remaining components  
**Duration**: 45 minutes

**Tasks**:

- [ ] Fix all dialog components
- [ ] Fix all dropdown/popover components
- [ ] Fix context menu components
- [ ] Fix tooltip components
- [ ] Fix toast component
- [ ] Fix variable autocomplete/context menu
- [ ] Fix environment switcher/selector
- [ ] Fix fullscreen editor components
- [ ] Fix all other components with hardcoded z-index

**Dependencies**: Phase 1  
**Deliverables**: All components using centralized z-index

### Phase 4: Verification & Testing

**Goal**: Verify all z-index fixes work correctly  
**Duration**: 30 minutes

**Tasks**:

- [ ] Test dialogs appear above content
- [ ] Test dropdowns in dialogs appear correctly
- [ ] Test GlobalSearch appears above dialogs
- [ ] Test tooltips appear correctly
- [ ] Test context menus appear correctly
- [ ] Test toast notifications appear above everything
- [ ] Verify no visual regressions

**Dependencies**: Phases 2 and 3  
**Deliverables**: Verified z-index fixes

## File Structure

### Modified Config Files

```
tailwind.config.js
  - Add zIndex to theme.extend
  - Optionally add 'navigation': '200' for NavigationBar
```

### Modified Files

```
src/pages/Homepage.tsx
  - Remove overflow-hidden from line 8 (fixes stacking context conflict)
  - Status bar already uses z-sticky
src/components/NavigationBar.tsx
  - Add z-sticky or z-navigation to ensure it stays above content
src/components/ApiRequestBuilder.tsx (indirect - contains fixed components)
src/components/ui/save-request-dialog.tsx
src/components/ui/promote-request-dialog.tsx
src/components/GlobalSearch.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/select.tsx
src/components/ui/context-menu.tsx
src/components/ui/tooltip.tsx
src/components/ui/toast.tsx
src/components/ui/variable-autocomplete.tsx
src/components/ui/variable-context-menu.tsx
src/components/EnvironmentSwitcher.tsx
src/components/EnvironmentSelector.tsx
src/components/curl/CurlImportDialog.tsx
src/components/request/RequestPresets.tsx
src/components/ui/bulk-edit-modal.tsx
src/components/ui/input-dialog.tsx
src/components/ui/monaco-editor.tsx
src/components/ui/monaco-key-value-editor.tsx
src/components/ShortcutHelp.tsx
src/components/ThemeCustomizer.tsx
src/components/collection/CollectionRunner.tsx
src/pages/History.tsx
```

## Implementation Details

### Tailwind Config: `tailwind.config.js`

**Purpose**: Centralized z-index values in Tailwind theme  
**Key Features**:

- Semantic class names (e.g., `z-dialog`, `z-dropdown`)
- Type-safe via Tailwind IntelliSense
- No runtime overhead
- Consistent with Tailwind patterns

**Usage Example**:

```tsx
// In component - use semantic Tailwind classes
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-dialog">
  {/* Dialog content */}
</div>

// Dropdown
<div className="z-dropdown">
  {/* Dropdown content */}
</div>

// Global search
<div className="fixed z-global-search">
  {/* Search results */}
</div>
```

### Home Page Structure Fix: `src/pages/Homepage.tsx`

**Purpose**: Remove conflicting stacking context  
**Key Changes**:

- Remove `overflow-hidden` from wrapper div (line 8)
- ApiRequestBuilder already handles overflow internally (line 294)
- Aligns structure with Collections/Environments pages

**Before**:

```tsx
<div className="flex-1 overflow-hidden">
  {' '}
  {/* Creates stacking context */}
  <ApiRequestBuilder />
</div>
```

**After**:

```tsx
<div className="flex-1">
  {' '}
  {/* No stacking context conflict */}
  <ApiRequestBuilder />
</div>
```

**Why This Works**:

- ApiRequestBuilder has `overflow-hidden` internally (line 294), so wrapper is redundant
- Removes conflicting stacking context that was causing dropdown to go behind content
- Matches pattern used in Collections/Environments pages (no overflow at page level)

### NavigationBar Fix: `src/components/NavigationBar.tsx`

**Purpose**: Ensure NavigationBar stays above page content  
**Key Changes**:

- Add `z-sticky` or `z-navigation` class to NavigationBar container
- Ensures NavigationBar and its dropdowns stay above page content

**Before**:

```tsx
<div className="flex h-11 items-center border-b border-border/50 bg-card/80 backdrop-blur-md px-4 select-none">
```

**After**:

```tsx
<div className="flex h-11 items-center border-b border-border/50 bg-card/80 backdrop-blur-md px-4 select-none z-sticky">
```

### Component Updates

All components will:

1. Replace hardcoded z-index values with semantic Tailwind classes
2. Use classes like `z-dialog`, `z-dropdown`, `z-tooltip`, etc.
3. No imports needed - classes are available globally via Tailwind
4. For special cases (e.g., dropdowns in dialogs), use `z-dialog-dropdown`

## Testing Strategy

### Manual Testing Checklist

- [ ] **CRITICAL**: Open home page - verify environment dropdown appears above content (not behind)
- [ ] Open home page - verify status bar appears correctly
- [ ] Open request builder - verify no z-index conflicts
- [ ] Open Save Request dialog - verify it appears above content
- [ ] Open dropdown in Save Request dialog - verify it appears above dialog content
- [ ] Open GlobalSearch (⌘K) - verify it appears above dialogs
- [ ] Open context menu - verify it appears above content
- [ ] Hover over tooltip - verify it appears correctly
- [ ] Trigger toast notification - verify it appears above everything
- [ ] Open CurlImportDialog - verify it appears correctly
- [ ] Open fullscreen editor - verify it appears correctly
- [ ] Test multiple overlays simultaneously - verify correct layering
- [ ] **CRITICAL**: Compare home page vs Collections/Environments - verify environment dropdown works consistently

### Visual Regression Testing

- [ ] Compare screenshots before/after fix
- [ ] Verify no UI elements are hidden incorrectly
- [ ] Verify all dialogs are accessible
- [ ] Verify all dropdowns are accessible

## Performance Considerations

### Performance Impact

- **Memory**: No impact (constants only)
- **Load Time**: No impact (constants only)
- **Bundle Size**: Minimal increase (~1KB for utility file)
- **Runtime Performance**: Zero impact

### Performance Monitoring

- No performance monitoring needed (constants only)
- No memory tracking needed
- No load time tracking needed

## Security Considerations

- No security implications

## Accessibility Considerations

- Z-index fixes improve accessibility by ensuring all UI elements are properly accessible
- Dialogs and overlays will be properly layered, making them accessible to screen readers
- No negative accessibility impact

## Rollback Plan

If issues arise:

1. Revert changes to specific components
2. Keep Tailwind config z-index values (they don't affect existing code)
3. Gradually re-apply fixes after identifying issues
4. If needed, can temporarily revert Tailwind config changes

## Open Questions

- [x] Should we use Tailwind config extension or TypeScript object? (Decision: Use Tailwind config extension - more idiomatic, better IntelliSense, no runtime overhead)
- [x] Should SelectContent in dialogs use a special class? (Decision: Use `z-dialog-dropdown` class for dropdowns inside dialogs)

## References

- [spec.md](spec.md)
- `ai-context/common-utils.md` - Mentions z-index utility (we're using Tailwind config instead, which is more idiomatic)
- All affected component files listed above
