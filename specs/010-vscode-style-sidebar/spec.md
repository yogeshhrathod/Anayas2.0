# Feature Specification: VS Code-Style Sidebar

**Status**: `completed`  
**Feature ID**: `010-vscode-style-sidebar`  
**Created**: 2025-11-18  
**Last Updated**: 2025-11-18  
**Owner**: Development Team  
**Phase**: Phase 1 - Core UI Improvements

## Overview

Redesign the sidebar to work like VS Code's collapsible sections (EXPLORER, OUTLINE, TIMELINE style). The sidebar will have collapsible sections for "Unsaved Requests" and "Collections" with proper space management - only the expanded section takes up space, similar to VS Code's accordion-style interface.

## Goal Alignment Summary

**How this feature supports the performance-first project goal:**

- **Better Memory Management**: Only render expanded sections, reducing DOM nodes and memory usage
- **Improved Developer Experience**: Familiar VS Code-style interface with better space management
- **Lazy Rendering**: Collapsed sections don't render their children, saving memory and render time
- **Cleaner UI**: More organized, focused interface without cluttering the sidebar

**Success Criteria:**

- Memory: <5MB memory impact (minimal DOM changes)
- Load time: <50ms (lightweight UI reorganization)
- Improved UX: Sidebar space is efficiently utilized
- Familiar: Developers instantly recognize VS Code-style interface

**Constraints:**

- Performance budget: Memory <5MB, load <50ms (very lightweight UI change)
- Must maintain existing functionality (collections, unsaved requests)
- Must preserve existing drag-and-drop functionality
- Must be accessible (keyboard navigation, screen readers)

**Decisions (Confirmed):**

- ✅ Multiple sections can be expanded simultaneously (not accordion mode)
- ✅ Section collapse state persists across app restarts
- ✅ Future sections planned (Favorites, Recent) - design for extensibility
- ✅ Default: "Collections" section expanded by default

## Performance Impact Analysis (MANDATORY)

### Memory Impact (PRIMARY)

- **Estimated Memory Footprint**: <5MB (minimal DOM changes)
- **Memory Budget**: Sidebar UI: <5MB additional
- **Memory Cleanup Strategy**:
  - Collapsed sections don't render children (reduces DOM nodes)
  - Unmount collapsed section content completely
  - Only active section maintains its tree in memory

### Load Time Impact (PRIMARY)

- **Estimated Load Time**: <50ms (lightweight UI reorganization)
- **Initialization Strategy**: Synchronous (no async operations needed)
- **Performance Tracking**: Track render time before/after change

### Lazy Loading Strategy (REQUIRED)

- **How feature loads on-demand**: Sections load their content only when expanded
- **Code Splitting Plan**: No separate bundle needed (lightweight UI component)
- **Trigger**: User clicks section header to expand

### Bundle Size Impact (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: <10KB (simple accordion component)

### Performance Monitoring (PRIMARY)

- [x] Memory usage will be tracked (DOM node count before/after)
- [x] Render time will be measured and logged
- [x] Performance metrics will be logged to monitoring system

**Optional/Informational:**

- [x] Bundle size will be tracked in build (for awareness)

## Goals

- [ ] Create VS Code-style collapsible sections for sidebar
- [ ] Implement "Unsaved Requests" collapsible section
- [ ] Implement "Collections" collapsible section
- [ ] Only expanded section takes up space (accordion behavior)
- [ ] Preserve existing functionality (drag-drop, context menus, etc.)
- [ ] Smooth animations for expand/collapse
- [ ] Maintain current performance levels

## User Stories

### As a developer, I want collapsible sidebar sections so that I can manage space efficiently

**Acceptance Criteria:**

- [ ] Sidebar has distinct sections: "Unsaved Requests" and "Collections"
- [ ] Each section has a header with title and expand/collapse icon
- [ ] Clicking section header toggles expand/collapse
- [ ] Only one section can be expanded at a time (or multiple - TBD)
- [ ] Expanded section takes all available space
- [ ] Collapsed section only shows header (minimal height)
- [ ] Smooth transition animations between states

**Priority**: `P0`

---

### As a developer, I want the sidebar to feel like VS Code so that it's immediately familiar

**Acceptance Criteria:**

- [ ] Section headers look like VS Code (same visual style)
- [ ] Section icons match VS Code patterns (chevron right/down)
- [ ] Expand/collapse animations feel smooth and natural
- [ ] Section headers have hover states
- [ ] Keyboard navigation works (arrow keys, Enter to expand/collapse)

**Priority**: `P1`

---

### As a developer, I want the collapsed sections to save space so that I can focus on what matters

**Acceptance Criteria:**

- [ ] Collapsed sections only show header (≈32px height)
- [ ] Expanded section takes remaining space (flex-1)
- [ ] No wasted space in sidebar
- [ ] Content scrolls within expanded section
- [ ] Resize handles work correctly with new layout

**Priority**: `P0`

---

## Technical Requirements

### Existing Code to Leverage

- [ ] Component: `src/components/CollectionHierarchy.tsx` - Will be wrapped in collapsible section
- [ ] Component: `src/components/UnsavedRequestsSection.tsx` - Will be wrapped in collapsible section
- [ ] Component: `src/App.tsx` - Current sidebar layout (lines 446-558) will be refactored
- [ ] Hook: `src/hooks/useClickOutside.ts` - May be useful for section interactions
- [ ] Store: `src/store/useStore.ts` - Will store section expand/collapse state

### Integration Points

- **Where to add**: `src/App.tsx` sidebar section (lines 494-554)
- **How to integrate**:
  - Create new `CollapsibleSection` component
  - Wrap existing `UnsavedRequestsSection` and `CollectionHierarchy` in sections
  - Replace current vertical resize logic with accordion logic
- **Existing patterns to follow**: shadcn/ui Collapsible component, accordion patterns

### Architecture Decisions

- **Decision 1**: Use shadcn/ui Collapsible/Accordion components as base
  - Rationale: Maintains consistency with existing UI library
  - Alternative: Custom implementation (more control but more code)
- **Decision 2**: Multi-expand mode (multiple sections can be expanded)
  - Rationale: More flexible, allows viewing both sections simultaneously
  - User can collapse sections to save space when needed
- **Decision 3**: Persist expand state to settings/database
  - Rationale: Better UX, state survives app restarts
  - Store in settings table as JSON: `{ "sidebar": { "expandedSections": ["collections"] } }`

### Dependencies

- Internal:
  - `src/components/CollectionHierarchy.tsx`
  - `src/components/UnsavedRequestsSection.tsx`
  - `src/store/useStore.ts`
- External:
  - `@radix-ui/react-collapsible` (if not already included in shadcn/ui)
  - `lucide-react` (icons)

### File Structure Changes

```
src/
├── components/
│   ├── sidebar/                    # NEW: Sidebar-specific components
│   │   ├── CollapsibleSection.tsx  # NEW: Reusable collapsible section
│   │   └── SidebarSection.tsx      # NEW: Sidebar section wrapper
│   ├── CollectionHierarchy.tsx     # MODIFIED: Wrapped in section
│   └── UnsavedRequestsSection.tsx  # MODIFIED: Wrapped in section
├── store/
│   └── useStore.ts                 # MODIFIED: Add sidebar section state
└── App.tsx                         # MODIFIED: New sidebar layout
```

### Data Model Changes

**Zustand Store (`useStore.ts`):**

```typescript
// Add to store
interface AppState {
  // ... existing state

  // NEW: Sidebar section state (synced with database)
  expandedSidebarSections: Set<string>; // e.g., Set(['unsaved', 'collections'])
  toggleSidebarSection: (section: string) => void;
  loadSidebarState: () => void; // Load from database on startup
  saveSidebarState: () => void; // Save to database on change
}
```

**Database Schema Changes:**
Add to settings table or create new sidebar_state entry:

```json
{
  "sidebar": {
    "expandedSections": ["collections"], // Default: Collections expanded
    "sectionOrder": ["unsaved", "collections"] // Future: Custom ordering
  }
}
```

### API Changes

**IPC Handlers (Settings):**

```typescript
// Add to electron/ipc/handlers.ts
ipcMain.handle('settings:getSidebarState', async () => {
  return db.getSetting('sidebar') || { expandedSections: ['collections'] };
});

ipcMain.handle('settings:setSidebarState', async (event, state) => {
  return db.setSetting('sidebar', state);
});
```

**Preload API:**

```typescript
// Add to electron/preload.ts
sidebar: {
  getState: () => ipcRenderer.invoke('settings:getSidebarState'),
  setState: (state: SidebarState) => ipcRenderer.invoke('settings:setSidebarState', state),
}
```

## Acceptance Criteria

### Functional Requirements

- [ ] Sidebar displays two sections: "Unsaved Requests" and "Collections"
- [ ] Each section has a clickable header with title and chevron icon
- [ ] Clicking header toggles section expand/collapse
- [ ] Chevron rotates: right (collapsed) → down (expanded)
- [ ] Multiple sections can be expanded at once (collapsible mode)
- [ ] Expanded section takes all available space (flex-1)
- [ ] Collapsed section shows only header (~32px height)
- [ ] Smooth expand/collapse animations (200ms)
- [ ] Section content scrolls independently within section
- [ ] Drag-drop still works within expanded section
- [ ] Context menus still work within expanded section
- [ ] Keyboard shortcuts still work (Ctrl/Cmd + N, etc.)
- [ ] Sidebar collapse/expand still works
- [ ] Sidebar resize still works

### Non-Functional Requirements

- [ ] **Performance (PRIMARY)**:
  - Memory: <5MB impact (fewer DOM nodes with collapsed sections)
  - Render time: <50ms for expand/collapse
  - No lazy loading needed (already part of App.tsx)
  - Cleanup: Collapsed sections unmount children
  - Bundle size: <10KB additional (tracked for awareness)
- [ ] **Accessibility**:
  - Keyboard navigation (Tab, Enter, Arrow keys)
  - ARIA labels for sections
  - Screen reader friendly
- [ ] **Usability**:
  - Smooth animations (not jarring)
  - Clear visual feedback (hover, active states)
  - Familiar VS Code-style appearance
- [ ] **Testing**:
  - Unit tests for CollapsibleSection component
  - Integration tests for sidebar interactions
  - Accessibility tests (keyboard navigation)

## Success Metrics

- **Memory Reduction**: 20-30% fewer DOM nodes when section collapsed
- **User Feedback**: Developers recognize VS Code-style interface
- **Space Efficiency**: No wasted space in sidebar
- **Performance**: <50ms expand/collapse time

## Out of Scope

- Additional sections (Favorites, Recent, etc.) - future enhancement
- Customizable section order - future enhancement
- Persistent section state (survives app restart) - future enhancement
- Multi-select expand mode - using single-expand (accordion) mode
- Vertical resize between sections - using accordion mode instead

## Risks & Mitigation

| Risk                                    | Impact | Probability | Mitigation                                           |
| --------------------------------------- | ------ | ----------- | ---------------------------------------------------- |
| Breaking existing drag-drop             | High   | Low         | Test thoroughly, maintain existing structure         |
| Animation performance issues            | Medium | Low         | Use CSS transitions, hardware acceleration           |
| Accessibility problems                  | Medium | Medium      | Follow ARIA best practices, test with screen readers |
| User confusion (different from current) | Low    | Medium      | Make it look like VS Code (familiar)                 |

## References

- VS Code Sidebar: [VS Code UI Reference](https://code.visualstudio.com/)
- shadcn/ui Collapsible: [Collapsible Component](https://ui.shadcn.com/docs/components/collapsible)
- Radix UI Collapsible: [Radix Collapsible](https://www.radix-ui.com/primitives/docs/components/collapsible)
- Radix UI Accordion: [Radix Accordion](https://www.radix-ui.com/primitives/docs/components/accordion)

## Notes

### Design Decisions

**Multi-Expand Mode:**

- ✅ Multiple sections can be expanded (user confirmed)
- More flexible than accordion mode
- Users can collapse sections when they need space
- Better for power users who want to see everything

**Section State Persistence:**

- ✅ State persists across app restarts (user confirmed)
- Stored in database settings table
- Default: "Collections" section expanded
- Future: Can add section ordering, custom sections

**Animation Strategy:**

- CSS transitions for smooth animations
- 200ms duration (feels natural, not too slow)
- Hardware accelerated (transform, opacity)

### Implementation Notes

**Component Structure:**

```tsx
<SidebarSections>
  <CollapsibleSection
    id="unsaved"
    title="Unsaved Requests"
    isExpanded={expandedSections.has('unsaved')}
    onToggle={() => toggleSection('unsaved')}
  >
    <UnsavedRequestsSection />
  </CollapsibleSection>

  <CollapsibleSection
    id="collections"
    title="Collections"
    isExpanded={expandedSections.has('collections')} // Default: true
    onToggle={() => toggleSection('collections')}
  >
    <CollectionHierarchy />
  </CollapsibleSection>
</SidebarSections>
```

**Key CSS:**

- Use flexbox for layout
- Collapsed: `height: auto` (just header ~32px)
- Expanded: `flex: 1` (shares remaining space with other expanded sections)
- Multiple expanded: Space distributed evenly or with custom ratios
- Transitions: `transition: all 200ms ease-in-out`
- Overflow: Each section scrolls independently
