# Implementation Plan: VS Code-Style Sidebar

**Feature ID**: `010-vscode-style-sidebar`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Implement VS Code-style collapsible sections in the sidebar with persistent state. This involves creating a reusable `CollapsibleSection` component, updating the Zustand store to manage section state, adding IPC handlers for persistence, and refactoring the App.tsx sidebar layout to use the new sections.

## Existing Code Analysis

### Similar Features to Reference

- ✅ No similar collapsible section feature exists - this is new
- ✅ Reference: VS Code sidebar sections (EXPLORER, OUTLINE, TIMELINE)

### Components to Reuse

- ✅ Component: `src/components/CollectionHierarchy.tsx` - Will be wrapped in CollapsibleSection
- ✅ Component: `src/components/UnsavedRequestsSection.tsx` - Will be wrapped in CollapsibleSection
- ✅ Component: `src/components/ui/collapsible.tsx` - shadcn/ui Collapsible component (if exists)

### Hooks to Reuse

- ✅ Hook: `src/hooks/useClickOutside.ts` - May be useful for section interactions
- ✅ Hook: `src/store/useStore.ts` - Will be extended with sidebar state

### Utilities to Reuse

- ✅ Utility: `src/lib/cn.ts` - For className merging
- ✅ Utility: `src/lib/utils.ts` - For general utilities

### Types to Extend

- ✅ Type: `src/store/useStore.ts` - Add sidebar section state types

### Services to Reuse

- ✅ Service: `electron/services/logger.ts` - For logging section state changes

### Integration Points

- **Page**: `src/App.tsx` (lines 446-558) - Current sidebar layout will be refactored
- **Existing Component**: `CollectionHierarchy` - Will be wrapped
- **Existing Component**: `UnsavedRequestsSection` - Will be wrapped
- **Existing Store**: `useStore` - Will add section state management

### New Components Needed

- ✅ New Component: `src/components/sidebar/CollapsibleSection.tsx` - No existing collapsible section component
- ✅ New Component: `src/components/sidebar/SidebarSection.tsx` - Wrapper for sidebar sections

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- ✅ Yes - This plan improves performance by:
  - **Reducing DOM nodes**: Collapsed sections don't render children (saves memory)
  - **Better UX**: Familiar VS Code interface improves developer experience
  - **Minimal overhead**: <5MB memory impact, <50ms render time
  - **No lazy loading needed**: Already part of main bundle, very lightweight
  - **Improved space management**: Users can collapse sections they don't need

**Are there more reusable or cleaner ways to achieve the same?**

- ✅ Using shadcn/ui Collapsible as base maintains consistency with existing UI library
- ✅ Storing state in database ensures persistence without complexity
- ✅ Multi-expand mode provides flexibility without sacrificing performance

**Architecture Compliance:**

- ✅ Follows architecture.md patterns: Lightweight UI component, proper state management
- ✅ Uses common-utils.md utilities: `cn()` for classNames
- ✅ Matches example-quality.md standards: Clean component structure, proper cleanup
- ✅ No architecture violations: No heavy dependencies, minimal memory footprint

## Performance Implementation Plan

### Lazy Loading Strategy (REQUIRED)

- **How feature loads on-demand**: Collapsible sections render children only when expanded
- **Trigger**: User clicks section header to expand
- **Loading State**: No spinner needed (synchronous render)
- **Code**: `{isExpanded && <SectionContent />}` - Conditional rendering

### Code Splitting Plan (Supports Lazy Loading)

- **Separate Bundle**: No - Lightweight component (<10KB)
- **Bundle Type**: Part of main bundle
- **Vite Configuration**: No special config needed

### Bundle Size (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: <10KB (simple collapsible component)

### Memory Management Plan

- **Memory Budget**: <5MB (minimal DOM changes)
- **Cleanup Strategy**: Collapsed sections unmount children completely
  - ✅ Event listeners removed: Section header click handler removed on unmount
  - ✅ Subscriptions cancelled: None needed (using Zustand)
  - ✅ Requests aborted: None needed (UI-only component)
  - ✅ Caches cleared: None needed
  - ✅ Workers terminated: None needed
  - ✅ Timers cleared: None needed (CSS animations only)
- **Cleanup Code Location**: `useEffect` cleanup in CollapsibleSection component

### Performance Tracking Implementation (MANDATORY)

- **Memory Tracking** (PRIMARY): Track DOM node count before/after collapse
  ```typescript
  // In CollapsibleSection component
  useEffect(() => {
    if (isExpanded) {
      const nodesBefore = document.querySelectorAll('*').length;
      // Section expands...
      const nodesAfter = document.querySelectorAll('*').length;
      logger.info('Section expanded', {
        section: id,
        nodesDelta: nodesAfter - nodesBefore,
      });
    }
  }, [isExpanded]);
  ```
- **Load Time Tracking** (PRIMARY): Track render time for expand/collapse
  ```typescript
  const startTime = performance.now();
  // Section renders...
  const renderTime = performance.now() - startTime;
  logger.info('Section render time', { section: id, renderTime });
  ```
- **Performance Metrics Logging**: Log to console and Winston logger

**Optional/Informational:**

- **Bundle Size Tracking**: Tracked in build output (for awareness)

### Performance Budget Verification (PRIMARY GOALS)

- **Memory** (PRIMARY): [Estimated: 2-5MB] [Target: <5MB] [Status: ✅] - MANDATORY
- **Load Time** (PRIMARY): [Estimated: 20-50ms] [Target: <50ms] [Status: ✅] - MANDATORY

**Informational:**

- **Bundle Size**: [Estimated: 8-10KB] [Tracked for awareness, not a blocker]

## Files to Modify/Create (with WHY)

### New Files

1. `src/components/sidebar/CollapsibleSection.tsx` - **WHY**: Core collapsible section component. No existing component provides VS Code-style collapsible sections with header, content, and animations. Performance: <1KB, minimal memory impact.

2. `src/components/sidebar/SidebarSection.tsx` - **WHY**: Wrapper component for consistent section styling. Provides common layout, spacing, and styling for all sidebar sections. Performance: <500B, minimal memory impact.

3. `src/types/sidebar.ts` - **WHY**: TypeScript types for sidebar state and section configuration. Keeps types organized and reusable. Performance: 0 runtime impact (compile-time only).

### Modified Files

1. `src/App.tsx` (lines 446-558) - **WHY**: Refactor sidebar layout to use CollapsibleSection components. Current layout uses manual vertical resize; new layout uses collapsible sections. Performance impact: <1ms (simplified layout logic).

2. `src/store/useStore.ts` - **WHY**: Add sidebar section state management (`expandedSidebarSections: Set<string>`). Needed to track which sections are expanded. Also add functions to load/save state from database. Performance impact: <1KB memory for Set.

3. `electron/ipc/handlers.ts` - **WHY**: Add IPC handlers for getting/setting sidebar state (`settings:getSidebarState`, `settings:setSidebarState`). Needed for persistence. Performance impact: <1ms per call (simple database read/write).

4. `electron/preload.ts` - **WHY**: Expose sidebar state IPC handlers to renderer process. Needed for type-safe IPC communication. Performance impact: 0 (just type definitions).

5. `electron/database/json-db.ts` (optional) - **WHY**: Add helper methods for sidebar state if needed. May use existing `getSetting`/`setSetting` methods. Performance impact: 0 (reusing existing methods).

## Architecture Decisions

### Decision 1: Multi-Expand vs Single-Expand (Accordion)

**Context**: Need to decide if multiple sections can be expanded simultaneously  
**Options Considered**:

- **Option A**: Single-expand (accordion mode) - Only one section open at a time
  - Pros: Cleaner space management, simpler logic
  - Cons: Less flexible, forces users to close one section to open another
- **Option B**: Multi-expand (collapsible mode) - Multiple sections can be open
  - Pros: More flexible, allows viewing both sections, familiar to VS Code users
  - Cons: Slightly more complex state management

**Decision**: Multi-expand mode (Option B)  
**Rationale**: User confirmed preference for multiple sections. Better for power users, more flexible.  
**Trade-offs**: Slightly more complex state management (using `Set<string>` instead of single string).

### Decision 2: State Persistence Strategy

**Context**: Should section expand/collapse state persist across app restarts?  
**Options Considered**:

- **Option A**: Store in Zustand only (no persistence)
  - Pros: Simpler implementation, no database calls
  - Cons: State lost on app restart, poor UX
- **Option B**: Persist to database settings table
  - Pros: Better UX, state survives restart
  - Cons: Requires IPC handlers, database schema update

**Decision**: Persist to database (Option B)  
**Rationale**: User confirmed preference for persistence. Better UX, state survives restart.  
**Trade-offs**: Requires IPC handlers and database calls (minimal performance impact <1ms).

### Decision 3: Component Library - shadcn/ui vs Custom

**Context**: Should we use shadcn/ui Collapsible or build custom?  
**Options Considered**:

- **Option A**: Use shadcn/ui Collapsible component
  - Pros: Consistent with existing UI, accessible, battle-tested
  - Cons: Less control over implementation details
- **Option B**: Build custom collapsible component
  - Pros: Full control, no dependencies
  - Cons: More code, potential accessibility issues, reinventing wheel

**Decision**: Use shadcn/ui Collapsible (Option A)  
**Rationale**: Maintains consistency with existing UI library, accessible, well-tested.  
**Trade-offs**: Less control but better consistency and accessibility.

## Implementation Phases

### Phase 1: Setup and Types

**Goal**: Create types, IPC handlers, and database schema  
**Duration**: 30 minutes

**Tasks**:

- [ ] Create `src/types/sidebar.ts` with sidebar state types
- [ ] Add IPC handlers to `electron/ipc/handlers.ts`
- [ ] Add IPC types to `electron/preload.ts`
- [ ] Update database schema to support sidebar state

**Dependencies**: None  
**Deliverables**: Types defined, IPC handlers implemented, database ready

### Phase 2: Zustand Store Update

**Goal**: Add sidebar state management to Zustand store  
**Duration**: 30 minutes

**Tasks**:

- [ ] Add `expandedSidebarSections: Set<string>` to store
- [ ] Add `toggleSidebarSection(section: string)` function
- [ ] Add `loadSidebarState()` function (loads from database on startup)
- [ ] Add `saveSidebarState()` function (saves to database on change)
- [ ] Initialize with default state: `Set(['collections'])`

**Dependencies**: Phase 1 complete  
**Deliverables**: Store manages sidebar section state with persistence

### Phase 3: Create CollapsibleSection Component

**Goal**: Build reusable collapsible section component  
**Duration**: 1 hour

**Tasks**:

- [ ] Create `src/components/sidebar/CollapsibleSection.tsx`
- [ ] Use shadcn/ui Collapsible as base
- [ ] Add section header with title and chevron icon
- [ ] Add smooth animations (200ms transition)
- [ ] Add keyboard navigation support
- [ ] Add ARIA labels for accessibility
- [ ] Test expand/collapse functionality

**Dependencies**: Phase 1 complete  
**Deliverables**: Working CollapsibleSection component

### Phase 4: Refactor App.tsx Sidebar Layout

**Goal**: Replace current sidebar layout with collapsible sections  
**Duration**: 1 hour

**Tasks**:

- [ ] Remove vertical resize handle logic (no longer needed)
- [ ] Wrap `UnsavedRequestsSection` in `CollapsibleSection`
- [ ] Wrap `CollectionHierarchy` in `CollapsibleSection`
- [ ] Connect sections to Zustand store state
- [ ] Set default expanded state (`collections`)
- [ ] Test sidebar functionality (expand/collapse, drag-drop, context menus)
- [ ] Remove old `unsavedSectionHeight` state (no longer needed)

**Dependencies**: Phase 2 and 3 complete  
**Deliverables**: Sidebar uses collapsible sections

### Phase 5: Testing and Polish

**Goal**: Test thoroughly and add polish  
**Duration**: 1 hour

**Tasks**:

- [ ] Test expand/collapse animations
- [ ] Test state persistence (close/reopen app)
- [ ] Test drag-drop within sections
- [ ] Test context menus within sections
- [ ] Test keyboard navigation
- [ ] Test accessibility (screen reader)
- [ ] Verify no memory leaks (collapsed sections unmount children)
- [ ] Add performance logging
- [ ] Polish animations and transitions

**Dependencies**: Phase 4 complete  
**Deliverables**: Fully tested and polished sidebar

## File Structure

### New Files

```
src/
├── components/
│   └── sidebar/
│       ├── CollapsibleSection.tsx  # Core collapsible section component
│       └── SidebarSection.tsx      # Wrapper for consistent styling
└── types/
    └── sidebar.ts                  # Sidebar state types
```

### Modified Files

```
src/
├── App.tsx
│   - Remove: Vertical resize handle logic (lines 500-518)
│   - Add: CollapsibleSection wrappers for UnsavedRequestsSection and CollectionHierarchy
│   - Change: Sidebar layout from manual resize to collapsible sections
├── store/useStore.ts
│   - Add: expandedSidebarSections: Set<string>
│   - Add: toggleSidebarSection(section: string)
│   - Add: loadSidebarState() and saveSidebarState()

electron/
├── ipc/handlers.ts
│   - Add: settings:getSidebarState handler
│   - Add: settings:setSidebarState handler
└── preload.ts
    - Add: sidebar.getState() and sidebar.setState() IPC methods
```

### Deleted Files

None

## Implementation Details

### Component 1: CollapsibleSection

**Location**: `src/components/sidebar/CollapsibleSection.tsx`  
**Purpose**: Reusable collapsible section with VS Code-style appearance  
**Key Functions**:

- `onToggle()`: Toggles section expand/collapse state
- Renders section header with title and chevron icon
- Conditionally renders children only when expanded
- Smooth animations using CSS transitions

**Props**:

```typescript
interface CollapsibleSectionProps {
  id: string; // Unique section ID
  title: string; // Section title
  isExpanded: boolean; // Is section expanded?
  onToggle: () => void; // Toggle handler
  children: React.ReactNode; // Section content
  className?: string; // Additional classes
  defaultHeight?: string; // Default height when expanded
}
```

**Dependencies**:

- Internal: shadcn/ui Collapsible, lucide-react icons
- External: React

### Component 2: Zustand Store Extension

**Location**: `src/store/useStore.ts`  
**Purpose**: Manage sidebar section state with persistence  
**Key Functions**:

- `toggleSidebarSection(section: string)`: Toggle section in Set
- `loadSidebarState()`: Load state from database on startup
- `saveSidebarState()`: Save state to database on change

**State**:

```typescript
interface AppState {
  // ... existing state

  // NEW: Sidebar section state
  expandedSidebarSections: Set<string>; // e.g., Set(['collections'])
  toggleSidebarSection: (section: string) => void;
  loadSidebarState: () => Promise<void>;
  saveSidebarState: () => Promise<void>;
}
```

## Data Flow

```
User clicks section header
       ↓
CollapsibleSection.onToggle()
       ↓
useStore.toggleSidebarSection(sectionId)
       ↓
Update expandedSidebarSections Set
       ↓
useStore.saveSidebarState()
       ↓
IPC: settings:setSidebarState
       ↓
Database: Save to settings table
       ↓
CollapsibleSection re-renders (isExpanded changes)
       ↓
Children mount/unmount based on isExpanded
```

**On App Startup:**

```
App.tsx useEffect
       ↓
useStore.loadSidebarState()
       ↓
IPC: settings:getSidebarState
       ↓
Database: Read from settings table
       ↓
Update expandedSidebarSections Set
       ↓
CollapsibleSections render with correct state
```

## Testing Strategy

### Unit Tests

- [ ] Test file: `tests/components/sidebar/CollapsibleSection.spec.tsx`
  - Test expand/collapse functionality
  - Test keyboard navigation
  - Test accessibility (ARIA labels)
  - Test children mount/unmount

- [ ] Test file: `tests/store/useStore.spec.ts`
  - Test toggleSidebarSection()
  - Test loadSidebarState()
  - Test saveSidebarState()

### Integration Tests

- [ ] Test sidebar section expand/collapse
- [ ] Test state persistence (save and load from database)
- [ ] Test drag-drop within expanded sections
- [ ] Test context menus within expanded sections

### E2E Tests

- [ ] E2E: Expand/collapse sections and verify state persists on app restart
- [ ] E2E: Drag-drop requests within sections
- [ ] E2E: Context menus work within sections

### Manual Testing Checklist

- [ ] Expand "Unsaved Requests" section - should expand smoothly
- [ ] Collapse "Unsaved Requests" section - should collapse smoothly
- [ ] Expand "Collections" section - should expand smoothly
- [ ] Collapse "Collections" section - should collapse smoothly
- [ ] Both sections expanded - should share space evenly
- [ ] Close and reopen app - state should persist
- [ ] Drag-drop request within section - should work
- [ ] Right-click request in section - context menu should appear
- [ ] Keyboard navigation (Tab, Enter, Arrow keys) - should work
- [ ] Screen reader - should announce section state

## Migration & Rollout

### Database Migrations

Add default sidebar state to settings table:

```typescript
// electron/database/json-db.ts
const defaultSettings = {
  // ... existing settings
  sidebar: {
    expandedSections: ['collections'], // Default: Collections expanded
  },
};
```

### Feature Flags

None needed - straightforward UI change with no risk

### Rollout Plan

1. **Deploy to development**: Test locally first
2. **Deploy to staging**: Test with team
3. **Deploy to production**: Release to users
4. **Monitor**: Watch for issues, gather feedback

## Performance Considerations

### Performance Targets (PRIMARY GOALS)

- ✅ **Memory** (PRIMARY): <5MB when sections expanded (minimal DOM changes) - MANDATORY
- ✅ **Load Time** (PRIMARY): <50ms for expand/collapse (CSS transitions only) - MANDATORY
- ✅ **Lazy Loading** (REQUIRED): Collapsed sections don't render children - MANDATORY
- ✅ **Cleanup** (REQUIRED): Children unmounted when section collapses - MANDATORY

**Informational:**

- ✅ **Bundle Size**: ~10KB additional (tracked for awareness, not a blocker)

### Optimization Strategy (Focus: Memory & Speed)

- **Memory**: Collapsed sections don't render children (reduces DOM nodes by 50-70%)
- **Speed**: CSS transitions (hardware accelerated, 60fps)
- **Lazy Rendering**: Conditional rendering `{isExpanded && <Children />}`
- **Cleanup**: Children unmount on collapse (frees memory)

### Performance Monitoring (MANDATORY)

- ✅ Memory usage tracked: DOM node count before/after collapse - MANDATORY
- ✅ Render time tracked: Expand/collapse timing logged - MANDATORY
- ✅ Performance metrics logged to console and Winston logger - MANDATORY
- ✅ No alerts needed: Performance impact is minimal - MANDATORY

**Optional/Informational:**

- ✅ Bundle size tracked in build output (for awareness)

## Security Considerations

- ✅ No security concerns: UI-only change, no external data
- ✅ IPC handlers use existing settings methods (already secure)

## Accessibility Considerations

- ✅ ARIA labels: `aria-expanded`, `aria-controls`, `aria-labelledby`
- ✅ Keyboard navigation: Tab, Enter, Arrow keys
- ✅ Screen reader friendly: Announces section state changes
- ✅ Focus management: Focus stays on section header after toggle

## Rollback Plan

If issues arise:

1. **Quick rollback**: Revert App.tsx changes, restore old sidebar layout
2. **Database**: Sidebar state in settings won't break anything if unused
3. **Components**: New components can be safely removed (not used elsewhere)
4. **Low risk**: UI-only change, no data model changes

## Open Questions

- ✅ Resolved: Multiple sections can be expanded (user confirmed)
- ✅ Resolved: State persists across restarts (user confirmed)
- ✅ Resolved: Default expanded section is "Collections" (user confirmed)
- Future: Add more sections (Favorites, Recent)? - Not in this phase
- Future: Custom section ordering? - Not in this phase

## References

- [spec.md](./spec.md) - Feature specification
- [shadcn/ui Collapsible](https://ui.shadcn.com/docs/components/collapsible)
- [Radix UI Collapsible](https://www.radix-ui.com/primitives/docs/components/collapsible)
- VS Code Sidebar - Reference implementation
