# Implementation Plan: Reusable Click-Outside Hook

**Feature ID**: `004-reusable-click-outside-hook`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Create a reusable `useClickOutside` hook to eliminate code duplication across multiple components that handle click-outside and escape key events. This refactoring improves code maintainability, consistency, and reduces the risk of bugs from inconsistent implementations.

## Existing Code Analysis

### Similar Features to Reference
- [x] Pattern: `src/components/ui/variable-input.tsx` - Click outside + Escape handling
- [x] Pattern: `src/components/ui/highlighted-variable-input.tsx` - Click outside + Escape handling
- [x] Pattern: `src/components/ui/overlay-variable-input.tsx` - Click outside + Escape handling
- [x] Pattern: `src/components/GlobalSearch.tsx` - Click outside handling

### Components to Update

#### Phase 1: Immediate (Current Scope)
- [x] `src/components/EnvironmentSelector.tsx` - **PRIORITY**: Currently has incomplete implementation (missing escape key)
- [x] `src/components/EnvironmentSwitcher.tsx` - **PRIORITY**: Currently has incomplete implementation (missing escape key)

#### Phase 2: Future Refactoring (Same Pattern)
- [ ] `src/components/ui/variable-input.tsx` - Has both escape + click outside (exact same pattern)
- [ ] `src/components/ui/highlighted-variable-input.tsx` - Has both escape + click outside (exact same pattern)
- [ ] `src/components/ui/overlay-variable-input.tsx` - Has both escape + click outside (exact same pattern)

#### Phase 3: Complex Cases (Needs Analysis)
- [ ] `src/components/GlobalSearch.tsx` - Has click outside, but also complex keyboard navigation (arrow keys, enter). May need custom handling or hook extension.
- [ ] `src/components/ui/variable-autocomplete.tsx` - Has escape key, but also arrow key navigation. Different use case - keyboard navigation component.

#### Phase 4: Different Patterns (Out of Scope)
- [ ] `src/components/ui/input-dialog.tsx` - Dialog component, uses onKeyDown handler (different pattern, not event listeners)
- [ ] `src/components/ApiRequestBuilder.tsx` - Uses keyboard shortcuts for actions, not for closing dropdowns (different use case)

### Hooks to Reference
- [x] `src/hooks/useDebounce.ts` - Example of hook structure and documentation
- [x] `src/hooks/useKeyboardShortcut.ts` - Example of keyboard event handling pattern

### Utilities to Reuse
- [x] None - This is a new utility hook

### Types to Extend
- [x] None - New types will be defined in the hook file

### Integration Points
- **Primary**: `src/components/EnvironmentSelector.tsx` - Replace current implementation
- **Primary**: `src/components/EnvironmentSwitcher.tsx` - Replace current implementation
- **Optional**: Other dropdown components can be migrated later

### New Components Needed
- [x] New Hook: `src/hooks/useClickOutside.ts` - Reusable hook for click-outside and escape handling

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**
- [x] Yes - This refactoring:
  - Reduces code duplication (smaller bundle size)
  - Improves maintainability (easier to optimize in one place)
  - No performance impact (same event listeners, just organized better)
  - Prevents memory leaks through consistent cleanup patterns

**Are there more reusable or cleaner ways to achieve the same?**
- **Consideration 1**: Using a library like `react-use` or `ahooks` - **Rejected**: Adds external dependency, we can implement a lightweight version ourselves
- **Consideration 2**: Creating separate hooks for click-outside and escape - **Rejected**: They're always used together, combining is more convenient
- **Consideration 3**: Making it a component wrapper - **Rejected**: Hook pattern is more flexible and follows React best practices

**Architecture Compliance:**
- [x] Follows architecture.md patterns (cleanup, proper event handling)
- [x] Uses common-utils.md utilities (none needed, but follows hook patterns)
- [x] Matches example-quality.md standards (proper cleanup, typed)
- [x] No architecture violations (no upfront loading, proper cleanup)

## Performance Implementation Plan

### Lazy Loading Strategy (REQUIRED)
- **How feature loads on-demand**: N/A - This is a utility hook, loaded when components using it are loaded
- **Trigger**: Components import and use the hook
- **Loading State**: N/A - Hook is synchronous, no loading state needed
- **Code**: Standard hook import: `import { useClickOutside } from '../hooks/useClickOutside'`

### Code Splitting Plan (Supports Lazy Loading)
- **Separate Bundle**: No - Hook is small and will be tree-shaken if unused
- **Bundle Type**: Utility hook (included in main bundle or feature bundle)
- **Vite Configuration**: No special config needed

### Bundle Size (INFORMATIONAL - Not Primary)
- **Estimated Bundle Size**: ~1-2 KB (minimal, just event listener logic)

### Memory Management Plan
- **Memory Budget**: <1MB (negligible, just event listeners)
- **Cleanup Strategy**: 
  - [x] Event listeners removed on unmount
  - [x] Event listeners removed when `isActive` becomes false
  - [x] Proper cleanup function always returned
- **Cleanup Code Location**: Inside `useEffect` return function in hook

### Performance Tracking Implementation (MANDATORY)
- **Memory Tracking** (PRIMARY): Not needed - Hook has negligible memory impact (<1MB)
- **Load Time Tracking** (PRIMARY): Not needed - Hook is synchronous, no load time
- **Performance Metrics Logging**: Not needed - Utility hook, no performance concerns

**Optional/Informational:**
- **Bundle Size Tracking**: Will be tracked in build (expected ~1-2 KB)

### Performance Budget Verification (PRIMARY GOALS)
- **Memory** (PRIMARY): [Estimated: <1MB] [Target: <50MB] [Status: ✅] - MANDATORY
- **Load Time** (PRIMARY): [Estimated: 0ms] [Target: <200ms] [Status: ✅] - MANDATORY

**Informational:**
- **Bundle Size**: [Estimated: 1-2 KB] [Tracked for awareness, not a blocker]

## Files to Modify/Create (with WHY)

### New Files
- `src/hooks/useClickOutside.ts` - **WHY**: 
  - Centralized, reusable hook for click-outside and escape key handling
  - Eliminates code duplication across 5+ components
  - Ensures consistent behavior and proper cleanup
  - Follows existing hook patterns in codebase
  - Type-safe with TypeScript generics
  - Well-documented with JSDoc examples

### Modified Files
- `src/components/EnvironmentSelector.tsx` - **WHY**: 
  - Replace inline `useEffect` with `useClickOutside` hook
  - Remove duplicate event listener code
  - Ensure escape key handling is added (currently missing)
  - Improve code readability and maintainability

- `src/components/EnvironmentSwitcher.tsx` - **WHY**: 
  - Replace inline `useEffect` with `useClickOutside` hook
  - Remove duplicate event listener code
  - Ensure escape key handling is added (currently missing)
  - Improve code readability and maintainability

### Usage Analysis

#### Immediate Usage (Phase 1-3)
1. **EnvironmentSelector.tsx** - Simple dropdown, needs escape + click outside
2. **EnvironmentSwitcher.tsx** - Simple dropdown, needs escape + click outside

#### Future Refactoring Candidates (Phase 5 - Optional)
3. **variable-input.tsx** - Autocomplete dropdown, exact same pattern
4. **highlighted-variable-input.tsx** - Autocomplete dropdown, exact same pattern  
5. **overlay-variable-input.tsx** - Autocomplete dropdown, exact same pattern

#### Complex Cases (Needs Analysis - Phase 6)
6. **GlobalSearch.tsx** - Has click outside, but also:
   - Arrow key navigation (up/down)
   - Enter key selection
   - Complex keyboard handling
   - **Decision**: May need hook extension or separate keyboard navigation hook

7. **variable-autocomplete.tsx** - Has escape, but also:
   - Arrow key navigation (up/down)
   - Enter key selection
   - Keyboard navigation component
   - **Decision**: Different use case, may not benefit from this hook

#### Different Patterns (Out of Scope)
8. **input-dialog.tsx** - Dialog component, uses `onKeyDown` prop (not event listeners)
9. **ApiRequestBuilder.tsx** - Keyboard shortcuts for actions, not closing dropdowns

## Architecture Decisions

### Decision 1: Hook vs Component Wrapper
**Context**: Need to decide between hook pattern and component wrapper pattern  
**Options Considered**:
- Option A: Hook pattern (`useClickOutside`) - Pros: Flexible, follows React patterns, easy to use. Cons: None
- Option B: Component wrapper (`<ClickOutside>`) - Pros: Encapsulates ref. Cons: Less flexible, harder to customize

**Decision**: Hook pattern  
**Rationale**: 
- More flexible - components can control when hook is active
- Follows React best practices
- Consistent with existing hooks in codebase
- Easier to test and reason about
**Trade-offs**: Components need to manage refs themselves (but this is standard React pattern)

### Decision 2: Combined vs Separate Hooks
**Context**: Should click-outside and escape be in one hook or separate?  
**Options Considered**:
- Option A: Combined hook (`useClickOutside` with options) - Pros: Convenient, always used together. Cons: Slightly more complex API
- Option B: Separate hooks (`useClickOutside`, `useEscapeKey`) - Pros: Simpler APIs. Cons: Always need to use both, more boilerplate

**Decision**: Combined hook with options  
**Rationale**: 
- Click-outside and escape are almost always used together
- Options allow disabling one if needed
- Reduces boilerplate in components
- Single cleanup point
**Trade-offs**: Slightly more complex API, but more convenient

### Decision 3: Options Object vs Multiple Parameters
**Context**: How to pass configuration to the hook?  
**Options Considered**:
- Option A: Options object - Pros: Extensible, clear parameter names. Cons: Slightly more verbose
- Option B: Multiple parameters - Pros: Simpler for common case. Cons: Harder to extend, unclear parameter order

**Decision**: Options object with sensible defaults  
**Rationale**: 
- More extensible (can add more options later)
- Clear parameter names
- Follows React hook patterns (like `useState`, `useEffect`)
- Defaults make common case simple
**Trade-offs**: Slightly more verbose, but more maintainable

## Implementation Phases

### Phase 1: Create Hook
**Goal**: Create the reusable `useClickOutside` hook with proper TypeScript types and documentation  
**Duration**: ~30 minutes

**Tasks**:
- [ ] Create `src/hooks/useClickOutside.ts`
- [ ] Define TypeScript interfaces for options
- [ ] Implement hook with escape key and click-outside handling
- [ ] Add JSDoc documentation with examples
- [ ] Ensure proper cleanup in all cases
- [ ] Type-check the hook

**Dependencies**: None  
**Deliverables**: Working, documented hook

### Phase 2: Update EnvironmentSelector
**Goal**: Replace inline implementation with hook in EnvironmentSelector  
**Duration**: ~15 minutes

**Tasks**:
- [ ] Import `useClickOutside` hook
- [ ] Replace `useEffect` with `useClickOutside` call
- [ ] Remove old event listener code
- [ ] Verify escape key works
- [ ] Verify click-outside works
- [ ] Type-check component

**Dependencies**: Phase 1 complete  
**Deliverables**: Updated EnvironmentSelector using hook

### Phase 3: Update EnvironmentSwitcher
**Goal**: Replace inline implementation with hook in EnvironmentSwitcher  
**Duration**: ~15 minutes

**Tasks**:
- [ ] Import `useClickOutside` hook
- [ ] Replace `useEffect` with `useClickOutside` call
- [ ] Remove old event listener code
- [ ] Verify escape key works
- [ ] Verify click-outside works
- [ ] Type-check component

**Dependencies**: Phase 1 complete  
**Deliverables**: Updated EnvironmentSwitcher using hook

### Phase 4: Testing & Verification
**Goal**: Ensure all functionality works correctly  
**Duration**: ~20 minutes

**Tasks**:
- [ ] Test EnvironmentSelector: click outside closes dropdown
- [ ] Test EnvironmentSelector: escape key closes dropdown
- [ ] Test EnvironmentSelector: clicking inside doesn't close
- [ ] Test EnvironmentSwitcher: click outside closes dropdown
- [ ] Test EnvironmentSwitcher: escape key closes dropdown
- [ ] Test EnvironmentSwitcher: clicking inside doesn't close
- [ ] Run type-check: `npm run type-check`
- [ ] Verify no console errors
- [ ] Check for memory leaks (dev tools)

**Dependencies**: Phases 1, 2, 3 complete  
**Deliverables**: Fully tested and verified implementation

## File Structure

### New Files
```
src/hooks/useClickOutside.ts
```

### Modified Files
```
src/components/EnvironmentSelector.tsx
  - Remove: useEffect for click-outside handling
  - Add: useClickOutside hook import and usage
  - Change: Add escape key support (currently missing)

src/components/EnvironmentSwitcher.tsx
  - Remove: useEffect for click-outside handling
  - Add: useClickOutside hook import and usage
  - Change: Add escape key support (currently missing)
```

## Implementation Details

### Hook: useClickOutside
**Location**: `src/hooks/useClickOutside.ts`  
**Purpose**: Handle click-outside and escape key events for dropdowns/modals  
**Key Functions**:
- `useClickOutside(ref, onClose, isActive, options)`: Main hook function
  - `ref`: RefObject to element that should not trigger close
  - `onClose`: Callback when close is triggered
  - `isActive`: Whether hook should be active
  - `options`: Configuration object (handleEscape, handleClickOutside, shouldClose)

**Dependencies**:
- Internal: React (useEffect, RefObject)
- External: None

**TypeScript Interface**:
```typescript
export interface UseClickOutsideOptions {
  handleEscape?: boolean;        // Default: true
  handleClickOutside?: boolean;   // Default: true
  shouldClose?: (event: MouseEvent | KeyboardEvent) => boolean; // Default: () => true
}

export function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T>,
  onClose: () => void,
  isActive?: boolean,
  options?: UseClickOutsideOptions
): void
```

## Data Flow

```
Component State (isOpen)
    ↓
useClickOutside Hook
    ↓
Event Listeners (mousedown, keydown)
    ↓
Event Detection (click outside or Escape)
    ↓
onClose Callback
    ↓
Component State Update (setIsOpen(false))
```

## Testing Strategy

### Unit Tests
- [ ] Test file: `src/hooks/__tests__/useClickOutside.test.ts` (if test setup exists)
  - Test: Hook calls onClose when clicking outside
  - Test: Hook calls onClose when pressing Escape
  - Test: Hook doesn't call onClose when clicking inside
  - Test: Hook doesn't call onClose when isActive is false
  - Test: Cleanup removes event listeners
  - Test: shouldClose callback works correctly

### Integration Tests
- [ ] Test: EnvironmentSelector closes on click outside
- [ ] Test: EnvironmentSelector closes on Escape key
- [ ] Test: EnvironmentSwitcher closes on click outside
- [ ] Test: EnvironmentSwitcher closes on Escape key

### Manual Testing Checklist
- [ ] Open EnvironmentSelector dropdown, click outside → closes
- [ ] Open EnvironmentSelector dropdown, press Escape → closes
- [ ] Open EnvironmentSelector dropdown, click inside → stays open
- [ ] Open EnvironmentSwitcher dropdown, click outside → closes
- [ ] Open EnvironmentSwitcher dropdown, press Escape → closes
- [ ] Open EnvironmentSwitcher dropdown, click inside → stays open
- [ ] Multiple dropdowns don't interfere with each other
- [ ] No console errors or warnings
- [ ] No memory leaks (check dev tools)

## Performance Considerations

### Performance Targets (PRIMARY GOALS)
- [x] **Memory** (PRIMARY): <1MB (negligible, just event listeners) - MANDATORY
- [x] **Load Time** (PRIMARY): 0ms (synchronous hook) - MANDATORY
- [x] **Lazy Loading** (REQUIRED): Hook loads with components (on-demand) - MANDATORY
- [x] **Cleanup** (REQUIRED): Full cleanup on unmount and when inactive - MANDATORY

**Informational:**
- [x] **Bundle Size**: ~1-2 KB (tracked for awareness, not a blocker)

### Optimization Strategy (Focus: Memory & Speed)
- **Memory**: Event listeners are lightweight, properly cleaned up
- **Speed**: No performance impact, same event listeners as before, just organized better
- **Memory Management**: Proper cleanup ensures no memory leaks
- **Code Splitting**: Hook is small, included in bundle, tree-shaken if unused

### Performance Monitoring (MANDATORY)
- [x] Memory usage: Negligible (<1MB), no tracking needed
- [x] Load time: 0ms (synchronous), no tracking needed
- [x] Performance metrics: Not needed for utility hook
- [x] Alerts: Not needed (no performance concerns)

**Optional/Informational:**
- [x] Bundle size: ~1-2 KB (tracked in build)

## Security Considerations

- [x] No security concerns - Hook only handles UI events
- [x] Event listeners are properly cleaned up (prevents potential issues)

## Accessibility Considerations

- [x] Escape key support improves keyboard accessibility
- [x] Click-outside behavior is standard UX pattern
- [x] No accessibility regressions

## Rollback Plan

If issues arise:
1. Revert changes to `EnvironmentSelector.tsx` and `EnvironmentSwitcher.tsx`
2. Keep the hook file for future use
3. Components can continue using inline `useEffect` if needed

## Usage Locations Summary

### Total Components with Click-Outside/Escape Pattern: 7

1. ✅ **EnvironmentSelector.tsx** - Phase 1 (immediate)
2. ✅ **EnvironmentSwitcher.tsx** - Phase 1 (immediate)
3. 📋 **variable-input.tsx** - Phase 2 (future refactoring)
4. 📋 **highlighted-variable-input.tsx** - Phase 2 (future refactoring)
5. 📋 **overlay-variable-input.tsx** - Phase 2 (future refactoring)
6. 🔍 **GlobalSearch.tsx** - Phase 3 (needs analysis - complex keyboard nav)
7. 🔍 **variable-autocomplete.tsx** - Phase 3 (needs analysis - keyboard nav component)

### Hook Applicability

| Component | Click Outside | Escape Key | Keyboard Nav | Use Hook? | Phase |
|-----------|---------------|------------|--------------|-----------|-------|
| EnvironmentSelector | ✅ | ❌ (missing) | ❌ | ✅ Yes | 1 |
| EnvironmentSwitcher | ✅ | ❌ (missing) | ❌ | ✅ Yes | 1 |
| variable-input | ✅ | ✅ | ❌ | ✅ Yes | 2 |
| highlighted-variable-input | ✅ | ✅ | ❌ | ✅ Yes | 2 |
| overlay-variable-input | ✅ | ✅ | ❌ | ✅ Yes | 2 |
| GlobalSearch | ✅ | ✅ | ✅ (arrows/enter) | ⚠️ Maybe | 3 |
| variable-autocomplete | ❌ | ✅ | ✅ (arrows/enter) | ❌ No | 3 |

## Open Questions

- [x] Should we migrate other components (variable-input, etc.) in this PR? **Answer**: No, focus on EnvironmentSelector and EnvironmentSwitcher first (Phase 1)
- [x] Should the hook support multiple refs? **Answer**: No, single ref is sufficient for current use cases
- [x] Should we add a delay option for click-outside? **Answer**: No, not needed for current use cases
- [ ] Should hook support keyboard navigation (arrows/enter)? **Answer**: No, keep it focused on close behavior. Complex navigation needs separate hook.
- [ ] Should GlobalSearch use this hook? **Answer**: Needs analysis - it has complex keyboard navigation that may conflict

## References

- [spec.md](./spec.md)
- Existing patterns: `src/hooks/useDebounce.ts`, `src/hooks/useKeyboardShortcut.ts`
- Components to update: `src/components/EnvironmentSelector.tsx`, `src/components/EnvironmentSwitcher.tsx`
