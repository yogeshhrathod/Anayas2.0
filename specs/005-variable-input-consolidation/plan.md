# Implementation Plan: Variable Input Components Consolidation

**Feature ID**: `005-variable-input-consolidation`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Consolidate three duplicate variable input components into a single unified component with a shared hook, eliminating ~400 lines of duplicated code while maintaining all functionality through variant-based rendering.

## Existing Code Analysis

### Current Components

1. **VariableInput** (`src/components/ui/variable-input.tsx`)
   - Basic autocomplete functionality
   - Variable detection: `{{variable}}`
   - Autocomplete dropdown
   - **Usage**: Not used (0 usages)

2. **HighlightedVariableInput** (`src/components/ui/highlighted-variable-input.tsx`)
   - All of VariableInput features
   - Visual highlighting of variables
   - Context menu for variables
   - **Usage**: Not used (0 usages)

3. **OverlayVariableInput** (`src/components/ui/overlay-variable-input.tsx`)
   - All of HighlightedVariableInput features
   - Resolved value overlay display
   - Double-click variable selection
   - **Usage**: Used in 4 files (9 total occurrences)

### Duplicate Logic Analysis

**Shared across all 3 components:**

```typescript
// 1. Variable Detection Regex (43 lines each)
const VARIABLE_REGEX = /\{\{(\$)?[\w.]+\}\}/g;

// 2. Autocomplete Trigger (lines 45-58, 75-95, 120-141)
- Detect "{{" typing
- Extract search term
- Show dropdown

// 3. Dropdown Positioning (lines 29-37, 58-67, 104-112)
- getBoundingClientRect()
- Calculate position
- Handle overflow

// 4. Variable Selection (lines 61-80, 98-123, 144-170)
- Insert variable at cursor
- Update cursor position
- Close dropdown

// 5. Dynamic Variables (lines 80-82, 125-127, 126-127)
- Detect {{$variable}} pattern
- Filter dynamic variables
- Show only dynamic when needed

// 6. Click Outside (lines 88, 156, 211)
- useClickOutside hook
- Close dropdown on outside click

// 7. State Management
- showAutocomplete: boolean
- searchTerm: string
- showOnlyDynamic: boolean
- dropdownPosition: { top, left }
```

### Usage Locations

**OverlayVariableInput** (only actively used component):

1. `src/components/ui/key-value-editor.tsx` (line 78)
2. `src/components/ui/headers-key-value-editor.tsx` (line 76)
3. `src/components/request/RequestHeader.tsx` (line 197)
4. `src/components/request/AuthTab.tsx` (lines 73, 93, 104, 125, 136)

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- [x] Yes - Eliminates duplicate code, reduces bundle size, improves maintainability

**Are there more reusable or cleaner ways to achieve the same?**

- Hook pattern is ideal for shared logic
- Variant-based rendering keeps component simple
- No better alternative identified

**Architecture Compliance:**

- [x] Follows architecture.md patterns (code reusability, DRY principle)
- [x] Uses common-utils.md approach (shared hooks pattern)
- [x] Matches example-quality.md standards (clean abstractions)
- [x] No architecture violations

## Implementation Phases

### Phase 1: Create Shared Hook

**Goal**: Extract all duplicate logic into `useVariableInput` hook  
**Duration**: 0.5 days

**Tasks**:

- [x] Create `src/hooks/useVariableInput.ts`
- [x] Extract variable detection regex
- [x] Extract autocomplete state management
- [x] Extract dropdown positioning logic
- [x] Extract variable selection logic
- [x] Extract dynamic variable handling
- [x] Define clean hook interface
- [x] Add JSDoc documentation

**Dependencies**: None  
**Deliverables**: Working `useVariableInput` hook

### Phase 2: Create Unified Component

**Goal**: Build single component with variant support  
**Duration**: 0.5 days

**Tasks**:

- [x] Create `src/components/ui/variable-input-unified.tsx`
- [x] Implement `variant="basic"` (simple autocomplete)
- [x] Implement `variant="highlighted"` (with highlighting)
- [x] Implement `variant="overlay"` (with resolved values)
- [x] Integrate `useVariableInput` hook
- [x] Add context menu for highlighted/overlay
- [x] Add double-click selection for overlay
- [x] Match exact visual appearance of originals

**Dependencies**: Phase 1  
**Deliverables**: Working unified component

### Phase 3: Migration

**Goal**: Update all usage locations  
**Duration**: 0.5 days

**Tasks**:

- [x] Update `src/components/ui/key-value-editor.tsx`
- [x] Update `src/components/ui/headers-key-value-editor.tsx`
- [x] Update `src/components/request/RequestHeader.tsx`
- [x] Update `src/components/request/AuthTab.tsx` (5 occurrences)
- [x] Test all updated locations
- [x] Verify no visual regressions
- [x] Verify no functional regressions

**Dependencies**: Phase 2  
**Deliverables**: All locations migrated

### Phase 4: Documentation & Cleanup

**Goal**: Document and deprecate old components  
**Duration**: 0.5 days

**Tasks**:

- [x] Add to `ai-context/common-utils.md`
- [x] Add JSDoc to unified component
- [x] Add deprecation warnings to old components
- [x] Update component exports
- [x] Create migration guide (if needed)

**Dependencies**: Phase 3  
**Deliverables**: Complete documentation

## File Structure

### New Files

```
src/hooks/
└── useVariableInput.ts          # Shared hook with all common logic

src/components/ui/
└── variable-input-unified.tsx   # Unified component with variants
```

### Modified Files

```
src/components/ui/key-value-editor.tsx
  - Change: import { OverlayVariableInput } → import { VariableInputUnified }
  - Change: <OverlayVariableInput /> → <VariableInputUnified variant="overlay" />

src/components/ui/headers-key-value-editor.tsx
  - Change: import { OverlayVariableInput } → import { VariableInputUnified }
  - Change: <OverlayVariableInput /> → <VariableInputUnified variant="overlay" />

src/components/request/RequestHeader.tsx
  - Change: import { OverlayVariableInput } → import { VariableInputUnified }
  - Change: <OverlayVariableInput /> → <VariableInputUnified variant="overlay" />

src/components/request/AuthTab.tsx
  - Change: import { OverlayVariableInput } → import { VariableInputUnified }
  - Change: <OverlayVariableInput /> → <VariableInputUnified variant="overlay" /> (5 places)
```

### Deprecated Files (kept for backward compat)

```
src/components/ui/variable-input.tsx
  - Add deprecation warning in JSDoc
  - Point to VariableInputUnified

src/components/ui/highlighted-variable-input.tsx
  - Add deprecation warning in JSDoc
  - Point to VariableInputUnified

src/components/ui/overlay-variable-input.tsx
  - Add deprecation warning in JSDoc
  - Point to VariableInputUnified
```

## Implementation Details

### Component 1: useVariableInput Hook

**Location**: `src/hooks/useVariableInput.ts`  
**Purpose**: Shared logic for all variable input variants

**Exported Interface**:

```typescript
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
  
  // Data
  variables: Array<{ name: string; value: string }>;
}
```

**Key Functions**:

- Detect `{{` typing and show autocomplete
- Extract search term from cursor position
- Calculate dropdown position
- Insert selected variable at cursor
- Handle dynamic variables (`{{$...}}`)

### Component 2: VariableInputUnified

**Location**: `src/components/ui/variable-input-unified.tsx`  
**Purpose**: Single component supporting all variants

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

**Variant Implementations**:

1. **basic**: Input + Autocomplete dropdown
2. **highlighted**: basic + Variable highlighting + Context menu
3. **overlay**: highlighted + Resolved value overlay + Double-click selection

## Data Flow

```
User types in input
        ↓
useVariableInput.handleChange()
        ↓
Detect "{{" → Show autocomplete
        ↓
User selects variable
        ↓
useVariableInput.handleAutocompleteSelect()
        ↓
Insert variable at cursor
        ↓
Update input value
        ↓
Close autocomplete
```

## Testing Strategy

### Unit Tests

- [x] Test hook: `tests/unit/hooks/useVariableInput.spec.ts`
  - Variable detection
  - Autocomplete trigger
  - Variable selection
  - Dropdown positioning
  - Dynamic variables

### Component Tests

- [x] Test each variant rendering
- [x] Test autocomplete functionality
- [x] Test variable highlighting (highlighted variant)
- [x] Test overlay display (overlay variant)
- [x] Test context menu (highlighted/overlay variants)
- [x] Test double-click (overlay variant)

### Integration Tests

- [x] Test in key-value-editor
- [x] Test in headers-key-value-editor
- [x] Test in RequestHeader
- [x] Test in AuthTab
- [x] Verify no regressions

### Manual Testing Checklist

- [x] Autocomplete triggers on `{{` typing
- [x] Variable selection works
- [x] Cursor positioning correct
- [x] Context menu works
- [x] Overlay shows resolved values
- [x] Double-click selects variable
- [x] Visual appearance unchanged
- [x] All keyboard shortcuts work

## Performance Considerations

### Performance Targets

- [x] **Bundle Size**: Reduced by ~5-10KB
- [x] **Memory**: Negligible impact (<1MB)
- [x] **Load Time**: No change or slight improvement
- [x] **Runtime**: No performance regression

### Optimization Strategy

1. **Shared Hook**: Reduces duplicate code execution
2. **Conditional Rendering**: Only render features needed for variant
3. **Memoization**: Use React.memo for expensive computations
4. **Lazy Context Menu**: Only load when needed

## Security Considerations

- [x] No new security concerns (same logic as before)
- [x] Variable resolution uses existing secure methods
- [x] No XSS vulnerabilities (input properly sanitized)

## Accessibility Considerations

- [x] Keyboard navigation maintained
- [x] Screen reader support unchanged
- [x] Focus management correct
- [x] ARIA labels preserved

## Rollback Plan

If consolidation causes issues:

1. Old components still available (deprecated)
2. Revert imports to old components
3. No database or state changes needed
4. Zero data loss risk

## Migration Guide

### For Developers

**Before**:
```typescript
import { OverlayVariableInput } from './overlay-variable-input';

<OverlayVariableInput
  value={value}
  onChange={setValue}
/>
```

**After**:
```typescript
import { VariableInputUnified } from './variable-input-unified';

<VariableInputUnified
  value={value}
  onChange={setValue}
  variant="overlay"  // Add variant prop
/>
```

## References

- [spec.md](./spec.md)
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- [ai-context/common-utils.md](../../ai-context/common-utils.md)

