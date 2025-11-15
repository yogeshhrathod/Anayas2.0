# Phase 1.1: Variable Input Components Consolidation

## Overview
Consolidate three variable input components (`VariableInput`, `HighlightedVariableInput`, `OverlayVariableInput`) into a unified component with a shared hook, eliminating ~400 lines of duplicated code.

## Current State Analysis

### Component Usage
- **VariableInput**: Not currently used (0 usages found)
- **HighlightedVariableInput**: Not currently used (0 usages found)  
- **OverlayVariableInput**: Used in 4 places:
  - `src/components/ui/key-value-editor.tsx` (line 78)
  - `src/components/ui/headers-key-value-editor.tsx` (line 76)
  - `src/components/request/RequestHeader.tsx` (line 197)
  - `src/components/request/AuthTab.tsx` (lines 73, 93, 104, 125, 136)

### Shared Logic (Duplicated in All 3)
1. **Variable Detection**: `/\{\{(\$)?[\w.]+\}\}/g` regex (lines 43, 43, 39)
2. **Autocomplete Trigger**: Detect `{{` typing (lines 45-58, 75-95, 120-141)
3. **Dropdown Positioning**: `getBoundingClientRect()` (lines 29-37, 58-67, 104-112)
4. **Variable Selection**: Cursor positioning after selection (lines 61-80, 98-123, 144-170)
5. **Dynamic Variable Support**: `{{$variable}}` handling (lines 80-82, 125-127, 126-127)
6. **Click Outside**: `useClickOutside` integration (lines 88, 156, 211)
7. **State Management**: `showAutocomplete`, `searchTerm`, `showOnlyDynamic`

### Unique Features
- **VariableInput**: Basic autocomplete only
- **HighlightedVariableInput**: Variable highlighting + context menu
- **OverlayVariableInput**: Resolved value overlay + context menu + double-click selection

## Implementation Plan

### Step 1: Create Shared Hook
**File**: `src/hooks/useVariableInput.ts`

**Extract shared logic**:
- Variable regex constant
- Autocomplete state management
- Dropdown positioning logic
- Variable selection and cursor positioning
- Dynamic variable detection
- Search term extraction

**Interface**:
```typescript
interface UseVariableInputOptions {
  value: string;
  onChange: (value: string) => void;
  enableHighlighting?: boolean;
  enableOverlay?: boolean;
  enableContextMenu?: boolean;
}

interface UseVariableInputReturn {
  // State
  showAutocomplete: boolean;
  searchTerm: string;
  showOnlyDynamic: boolean;
  dropdownPosition: { top: number; left: number };
  
  // Refs
  inputRef: RefObject<HTMLInputElement>;
  wrapperRef: RefObject<HTMLDivElement>;
  
  // Handlers
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleAutocompleteSelect: (variableName: string) => void;
  handleClose: () => void;
  
  // Utilities
  updateDropdownPosition: () => void;
}
```

### Step 2: Create Unified Component
**File**: `src/components/ui/variable-input-unified.tsx`

**Variants**:
- `variant="basic"` - Simple input with autocomplete (replaces VariableInput)
- `variant="highlighted"` - Shows variable highlights (replaces HighlightedVariableInput)
- `variant="overlay"` - Shows resolved values overlay (replaces OverlayVariableInput)

**Props**:
```typescript
interface VariableInputUnifiedProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'basic' | 'highlighted' | 'overlay';
}
```

### Step 3: Migration Strategy
1. Create new hook and component
2. Update all `OverlayVariableInput` usages to `VariableInputUnified variant="overlay"`
3. Keep old components temporarily with deprecation warnings
4. Remove old components after verification

## Files to Create
- `src/hooks/useVariableInput.ts` - Shared variable input logic hook
- `src/components/ui/variable-input-unified.tsx` - Unified component with variants

## Files to Modify
- `src/components/ui/key-value-editor.tsx` - Replace `OverlayVariableInput` import
- `src/components/ui/headers-key-value-editor.tsx` - Replace `OverlayVariableInput` import
- `src/components/request/RequestHeader.tsx` - Replace `OverlayVariableInput` import
- `src/components/request/AuthTab.tsx` - Replace `OverlayVariableInput` import (5 occurrences)

## Files to Deprecate (After Migration)
- `src/components/ui/variable-input.tsx` - Replace with `variant="basic"`
- `src/components/ui/highlighted-variable-input.tsx` - Replace with `variant="highlighted"`
- `src/components/ui/overlay-variable-input.tsx` - Replace with `variant="overlay"`

## Testing Requirements
1. Autocomplete triggers on `{{` typing
2. Variable selection works correctly
3. Cursor positioning after selection
4. Dynamic variables (`{{$variable}}`) work
5. Context menu works (highlighted/overlay variants)
6. Double-click selection works (overlay variant)
7. Resolved value display works (overlay variant)
8. Click outside closes autocomplete
9. Escape key closes autocomplete

## Performance Impact
- **Memory**: Minimal (<1MB) - shared hook reduces duplicate state
- **Load Time**: No impact - same functionality
- **Bundle Size**: Slight reduction (~5-10KB) from removing duplicate code

## Risk Assessment
- **Low Risk**: Components are only used in 4 files, all using OverlayVariableInput
- **Migration**: Simple find/replace for imports
- **Breaking Changes**: None if API matches existing props

## Success Criteria
- [ ] All 4 usage locations updated
- [ ] All tests pass
- [ ] No visual/functional regressions
- [ ] ~400 lines of code eliminated
- [ ] Documentation updated in `common-utils.md`

