# Implementation Plan: Performance Optimization - Lazy Loading & Tracking

**Feature ID**: `003-performance-optimization-lazy-loading`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Convert all page imports to lazy loading, integrate performance tracking, and audit heavy components. This reduces initial memory footprint and improves startup time, directly supporting the performance-first project goal.

## Existing Code Analysis

### Similar Features to Reference

- None - this is the first lazy loading implementation

### Components to Reuse

- [x] `src/lib/performance.ts` - Use `trackFeatureLoad()` for tracking
- [x] `src/App.tsx` - Modify to use lazy loading
- [x] `src/store/useStore.ts` - Use `currentPage` for navigation tracking

### Hooks to Reuse

- None needed

### Utilities to Reuse

- [x] `src/lib/performance.ts` - `trackFeatureLoad()`, `getPerformanceSnapshot()`

### Types to Extend

- None needed

### Services to Reuse

- None needed

### Integration Points

- **Page**: `src/App.tsx` - Main integration point
- **Existing Pattern**: Direct imports (lines 7-12) need to be converted to lazy imports
- **Rendering**: `renderPage()` function (line 377) needs Suspense wrapper

### New Components Needed

- [x] `src/components/ui/PageLoadingSpinner.tsx` - Loading fallback for Suspense

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- [x] Yes - Lazy loading directly reduces initial memory and improves startup time, which are PRIMARY goals

**Are there more reusable or cleaner ways to achieve the same?**

- React.lazy() is the standard approach - no better alternatives
- Performance tracking utility already exists - reuse it
- Suspense is the standard React pattern - use it

**Architecture Compliance:**

- [x] Follows architecture.md patterns (lazy loading, code splitting, memory management)
- [x] Uses common-utils.md utilities (performance.ts)
- [x] Matches example-quality.md standards (lazy loading examples)
- [x] No architecture violations (proper lazy loading, cleanup handled by React)

## Performance Implementation Plan

### Lazy Loading Strategy (REQUIRED)

- **How feature loads on-demand**:
  - Convert direct imports to `lazy(() => import('./pages/PageName'))`
  - Each page loads only when `currentPage` matches
  - React handles code splitting automatically
- **Trigger**: User navigates (changes `currentPage` in store)
- **Loading State**: `PageLoadingSpinner` component shows while loading
- **Code**:
  ```typescript
  const Homepage = lazy(() => import('./pages/Homepage'));
  const Collections = lazy(() => import('./pages/Collections'));
  // ... etc
  ```

### Code Splitting Plan (Supports Lazy Loading)

- **Separate Bundle**: Yes - Each page becomes a separate bundle automatically
- **Bundle Type**: Route-based (each page is a route)
- **Vite Configuration**: No changes needed - Vite handles React.lazy() automatically

### Bundle Size (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: Main bundle reduces by ~500KB-1MB (pages split out)
- **Note**: Tracked for awareness, but memory and speed are PRIMARY goals

### Memory Management Plan

- **Memory Budget**:
  - Core App: <50MB (no pages loaded)
  - Per Page: <30MB average when active
- **Cleanup Strategy**:
  - React automatically unmounts pages when navigating away
  - Components should clean up in useEffect return (already handled in existing code)
  - No additional cleanup needed for pages themselves
- **Cleanup Code Location**:
  - Existing components already have cleanup
  - Verify cleanup in heavy components during audit

### Performance Tracking Implementation (MANDATORY)

- **Memory Tracking** (PRIMARY):
  ```typescript
  // In renderPage() or navigation handler
  const tracker = trackFeatureLoad(`Page-${currentPage}`);
  // Page loads via lazy import
  const memoryBefore = getPerformanceSnapshot();
  // After page renders
  tracker.end();
  ```
- **Load Time Tracking** (PRIMARY):
  ```typescript
  // trackFeatureLoad() automatically tracks load time
  const tracker = trackFeatureLoad('Page-Homepage');
  // React.lazy() resolves
  tracker.end(); // Logs load time
  ```
- **Performance Metrics Logging**:
  - Console in development
  - Winston logger in production (via IPC if needed)
  - Track in App.tsx navigation handler

### Performance Budget Verification (PRIMARY GOALS)

- **Memory** (PRIMARY): [Estimated: -100MB to -120MB] [Target: <50MB initial] [Status: ✅ Expected]
- **Load Time** (PRIMARY): [Estimated: <200ms] [Target: <200ms] [Status: ✅ Expected]

**Informational:**

- **Bundle Size**: [Estimated: -500KB to -1MB] [Tracked for awareness, not a blocker]

## Files to Modify/Create (with WHY)

### New Files

- `src/components/ui/PageLoadingSpinner.tsx` - **WHY**: Loading fallback for Suspense boundaries, provides better UX than no loading state

### Modified Files

- `src/App.tsx` - **WHY**:
  - Convert direct page imports (lines 7-12) to lazy imports
  - Add Suspense wrapper in renderPage() (line 377)
  - Add performance tracking to page navigation
  - This is the main integration point

## Architecture Decisions

### Decision 1: Use React.lazy() for All Pages

**Context**: Need to lazy load all pages to reduce initial memory  
**Options Considered**:

- Option A: React.lazy() - Standard React pattern, automatic code splitting
- Option B: Manual dynamic imports - More control but more code

**Decision**: React.lazy()  
**Rationale**:

- Standard React 18 pattern
- Automatic code splitting by Vite
- Simple implementation
- Well-documented and maintainable

**Trade-offs**:

- Requires Suspense boundaries (but this is good UX)
- Slight overhead for lazy loading (but minimal)

### Decision 2: Track Performance in App.tsx

**Context**: Need to track memory and load time for pages  
**Options Considered**:

- Option A: Track in App.tsx renderPage() - Centralized, easy
- Option B: Track in each page component - More granular but more code

**Decision**: Track in App.tsx  
**Rationale**:

- Centralized tracking
- Easy to measure page load time
- Consistent across all pages
- Less code duplication

**Trade-offs**:

- Slight overhead, but minimal and provides valuable metrics

### Decision 3: Use Suspense with Loading Spinner

**Context**: Need loading state while pages load  
**Options Considered**:

- Option A: Suspense with custom spinner - Better UX
- Option B: No loading state - Faster but poor UX

**Decision**: Suspense with custom spinner  
**Rationale**:

- Better user experience
- Shows app is responsive
- Standard React pattern

**Trade-offs**:

- Need to create loading component (minimal work)

## Implementation Phases

### Phase 1: Setup & Foundation

**Goal**: Create loading component and set up lazy imports  
**Duration**: 30 minutes

**Tasks**:

- Create PageLoadingSpinner component
- Convert page imports to lazy imports in App.tsx
- Add Suspense wrapper

**Dependencies**: None  
**Deliverables**:

- PageLoadingSpinner component
- Lazy imports set up
- Suspense boundaries added

### Phase 2: Performance Tracking Integration

**Goal**: Add performance tracking to page navigation  
**Duration**: 30 minutes

**Tasks**:

- Import performance tracking utility
- Add tracking to page navigation
- Test tracking output

**Dependencies**: Phase 1  
**Deliverables**:

- Performance tracking integrated
- Metrics logging working

### Phase 3: Testing & Verification

**Goal**: Verify lazy loading works and metrics are correct  
**Duration**: 30 minutes

**Tasks**:

- Test all page navigations
- Verify loading states
- Check performance metrics
- Measure memory reduction

**Dependencies**: Phase 1, Phase 2  
**Deliverables**:

- All pages lazy-loaded and working
- Performance metrics verified
- Memory reduction confirmed

### Phase 4: Heavy Components Audit (Optional)

**Goal**: Identify components that need optimization  
**Duration**: 1 hour

**Tasks**:

- Audit components for memory usage
- Identify components >30MB
- Create optimization plan

**Dependencies**: None (can be done in parallel)  
**Deliverables**:

- Audit report
- Optimization plan

## File Structure

### New Files

```
src/components/ui/PageLoadingSpinner.tsx
```

### Modified Files

```
src/App.tsx
  - Convert imports (lines 7-12) to lazy imports
  - Add Suspense in renderPage() (line 377)
  - Add performance tracking
```

## Implementation Details

### Component 1: PageLoadingSpinner

**Location**: `src/components/ui/PageLoadingSpinner.tsx`  
**Purpose**: Loading fallback for Suspense boundaries  
**Key Functions**:

- Simple spinner component
- Accessible (aria-live)
- Matches app theme

**Dependencies**:

- Internal: shadcn/ui components (if available)
- External: None

### Component 2: App.tsx (Modified)

**Location**: `src/App.tsx`  
**Purpose**: Main app component with lazy loading  
**Key Changes**:

- Convert imports to lazy
- Add Suspense wrapper
- Add performance tracking

**Dependencies**:

- Internal: `src/lib/performance.ts`, `src/store/useStore.ts`
- External: React (lazy, Suspense)

## Data Flow

```
User Navigation → currentPage changes → renderPage() called
  ↓
Performance tracking starts (trackFeatureLoad)
  ↓
React.lazy() resolves page import
  ↓
Suspense shows PageLoadingSpinner
  ↓
Page component renders
  ↓
Performance tracking ends (tracker.end())
  ↓
Metrics logged
```

## Testing Strategy

### Unit Tests

- [ ] Test PageLoadingSpinner renders correctly
- [ ] Test lazy imports resolve correctly

### Integration Tests

- [ ] Test page navigation works with lazy loading
- [ ] Test performance tracking logs metrics
- [ ] Test Suspense boundaries show loading states

### Manual Testing Checklist

- [ ] Navigate to each page (Homepage, Collections, Environments, History, Settings, Logs)
- [ ] Verify loading states appear briefly
- [ ] Check console for performance metrics
- [ ] Measure memory usage before/after
- [ ] Verify no functionality broken

## Migration & Rollout

### Database Migrations

None needed

### Feature Flags

Not needed - this is a performance optimization, not a feature

### Rollout Plan

1. Implement lazy loading
2. Test thoroughly
3. Deploy
4. Monitor performance metrics

## Performance Considerations

### Performance Targets (PRIMARY GOALS)

- [x] **Memory** (PRIMARY): <50MB initial (measured on app startup) - MANDATORY
- [x] **Load Time** (PRIMARY): <200ms per page (measured per navigation) - MANDATORY
- [x] **Lazy Loading** (REQUIRED): All pages load on-demand - MANDATORY
- [x] **Cleanup** (REQUIRED): React handles cleanup automatically - MANDATORY

**Informational:**

- [ ] **Bundle Size**: Tracked in build (for awareness, not a blocker)

### Optimization Strategy (Focus: Memory & Speed)

- **Memory**: Lazy loading reduces initial memory by not loading pages upfront
- **Speed**: Faster startup by loading only core app initially
- **Memory Management**: React automatically unmounts pages, components handle cleanup
- **Code Splitting**: Automatic via React.lazy() and Vite

### Performance Monitoring (MANDATORY)

- [x] Memory usage tracked and logged - MANDATORY
- [x] Load time tracked and logged - MANDATORY
- [x] Performance metrics logged to monitoring system - MANDATORY
- [x] Alerts on memory/load time budget violations - MANDATORY

**Optional/Informational:**

- [ ] Bundle size tracked in build (for awareness)

## Security Considerations

- [x] No security impact - lazy loading is a React feature, no external dependencies

## Accessibility Considerations

- [x] Loading spinner is accessible (aria-live region)
- [x] Page navigation remains keyboard accessible

## Rollback Plan

If issues arise:

1. Revert App.tsx changes
2. Restore direct imports
3. Remove Suspense wrappers
4. Performance tracking can remain (no breaking changes)

## Open Questions

- None - clear implementation path

## References

- [spec.md](./spec.md)
- `/ai-context/project-goal.md` - Performance targets
- `/ai-context/architecture.md` - Lazy loading patterns
- `/ai-context/example-quality.md` - Code examples
- `/src/lib/performance.ts` - Performance tracking utility
