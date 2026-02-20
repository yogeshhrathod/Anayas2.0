# Task Breakdown: ui-design-system-alignment

**Feature ID**: `012-ui-design-system-alignment`  
**Status**: `planned`  
**Related Spec**: `specs/012-ui-design-system-alignment/spec.md`  
**Related Plan**: `specs/012-ui-design-system-alignment/plan.md`

## Task Organization

Tasks are organized by user story and phase. Tasks marked with `[P]` can be executed in parallel after their dependencies are met.

---

## User Story 1: Shell & Layout Alignment

### Phase 1: Shell Structure & Layout Modes

#### Task 1.1: Introduce layout modes in global store

- **File**: `src/store/useStore.ts`
- **Description**: Add layout mode state (`normal` | `write` | `debug`) and response-pane sizing, with actions to update them.
- **Dependencies**: None
- **Acceptance**:
  - `useStore` exposes typed layout mode and pane size fields.
  - No runtime errors; existing consumers of `useStore` remain type-safe.
- **Status**: `pending`

#### Task 1.2: Wire layout mode shortcuts `[P]`

- **File**: `src/hooks/useShortcuts.ts`, `src/lib/keymap.ts`
- **Description**: Add keyboard shortcuts to toggle layout modes (e.g. normal/write/debug) and update `keymap` definitions.
- **Dependencies**: Task 1.1
- **Acceptance**:
  - Shortcuts change layout mode state in `useStore`.
  - BDD-style test describes Given current mode, When shortcut pressed, Then mode changes.
- **Status**: `pending`

#### Task 1.3: Align `App.tsx` shell with design-system layout

- **File**: `src/App.tsx`
- **Description**: Refine main shell structure into clear regions (title bar, navigation/activity, sidebar, main stage, response stage) and hook it up to layout modes and pane sizes.
- **Dependencies**: Task 1.1, Task 1.2
- **Acceptance**:
  - Layout matches `ui-design-system.md` §4 (normal/write/debug panes).
  - Sidebar and main/response panes resize smoothly (150–200ms transitions, `ease-in-out`).
  - Existing navigation and pages still render correctly.
- **Status**: `pending`

### Phase 1 Checkpoint

- **Validation**: Manual + integration test: shell renders correctly, layout modes toggle via shortcuts, and no regressions in basic navigation.

---

## User Story 2: Response Visualization & Large Payloads

### Phase 2: Response Status & Metrics Bar

#### Task 2.1: Standardize response status/metrics header

- **File**: `src/components/request/ResponseTab.tsx`, `src/components/request/ResponseBodyView.tsx`, `src/components/request/ResponseHeadersView.tsx`
- **Description**: Implement a consistent status & metrics bar (status code, text, time, size, content-type, optional progress) per `ui-design-system.md` §8.3.
- **Dependencies**: Task 1.3
- **Acceptance**:
  - Status bar appears across response views with consistent styling and data.
  - Acceptance criteria from spec Story 2 (status/metrics bar) are met.
- **Status**: `pending`

### Phase 3: Virtualized JSON Viewer & Search

#### Task 3.1: Introduce virtualized JSON viewer component

- **File**: `src/components/request/ResponseJsonVirtualizedView.tsx`
- **Description**: Create a new component that uses a stable virtualization library to render large JSON responses with expand/collapse and row virtualization.
- **Dependencies**: Task 2.1
- **Acceptance**:
  - Component renders JSON data via virtualization and supports large datasets.
  - Minimal API surface: accepts parsed JSON and renders without blocking.
- **Status**: `pending`

#### Task 3.2: Wire virtualized viewer into response flow

- **File**: `src/components/request/ResponseBodyView.tsx`, `src/components/request/ResponseTab.tsx`
- **Description**: Use the virtualized viewer when response content-type is JSON and size exceeds thresholds; otherwise keep existing Monaco-based view.
- **Dependencies**: Task 3.1
- **Acceptance**:
  - Large JSON responses automatically use the virtualized viewer.
  - Small/medium responses still use Monaco-only view as today.
- **Status**: `pending`

#### Task 3.3: Add in-pane search for virtualized JSON

- **File**: `src/components/request/ResponseJsonVirtualizedView.tsx`
- **Description**: Add a search box with next/previous navigation and highlighting for matches within the virtualized JSON view.
- **Dependencies**: Task 3.1
- **Acceptance**:
  - Given a large JSON response, When user searches, Then matches are highlighted and navigation jumps smoothly.
  - Search UI is consistent with `ui-design-system.md` §8.2.
- **Status**: `pending`

### Phase 3 Checkpoint

- **Validation**: Integration + performance tests demonstrate smooth scrolling and search on large JSON payloads.

---

## User Story 3: Command Palette & Keyboard-First Workflows

### Phase 4: Command Palette Implementation

#### Task 4.1: Implement command palette component

- **File**: `src/components/command/CommandPalette.tsx`
- **Description**: Build a lazily-loaded command palette component using shadcn/cmdk primitives, with sections for Navigation, Actions, View/Layout, Utilities.
- **Dependencies**: Task 1.3
- **Acceptance**:
  - Component supports fuzzy search and keyboard navigation.
  - Commands can be selected via keyboard, and the palette closes on execution.
- **Status**: `pending`

#### Task 4.2: Wire command palette into `useShortcuts`

- **File**: `src/hooks/useShortcuts.ts`, `src/lib/keymap.ts`
- **Description**: Add shortcuts (e.g. `Cmd/Ctrl+K`) to open/close the command palette, with focus management on open/close.
- **Dependencies**: Task 4.1
- **Acceptance**:
  - Given the app is focused, When shortcut pressed, Then palette opens and input is focused.
  - Palette can be closed via Escape and click-outside.
- **Status**: `pending`

#### Task 4.3: Define initial command set

- **File**: `src/components/command/CommandPalette.tsx`, `src/App.tsx`, `src/components/NavigationBar.tsx`, `src/components/ApiRequestBuilder.tsx`
- **Description**: Add core commands for navigation (pages/tabs), request actions (Send, Save, New Request, Import JSON/cURL), layout toggles, and environment switching.
- **Dependencies**: Task 4.1, Task 4.2
- **Acceptance**:
  - Commands behave correctly and are context-aware (e.g. request actions available when a request is active).
  - Each command displays its associated shortcut where applicable.
- **Status**: `pending`

### Phase 4 Checkpoint

- **Validation**: BDD-style integration tests cover at least one navigation command, one request action, and one layout toggle via the palette.

---

## User Story 4: Navigation & Sidebar Tree Behavior

### Phase 5: Sidebar & Navigation Alignment

#### Task 5.1: Align `NavigationBar` with activity bar patterns

- **File**: `src/components/NavigationBar.tsx`
- **Description**: Ensure NavigationBar semantics match `ui-design-system.md` §5.1 (activity bar), including icon labels, hover/active styles, and keyboard behavior.
- **Dependencies**: Task 1.3
- **Acceptance**:
  - Navigation items map clearly to Collections, Environments, History, Logs, Settings.
  - Active, hover, and focus states match design tokens and are accessible.
- **Status**: `pending`

#### Task 5.2: Align `CollectionHierarchy` tree behavior

- **File**: `src/components/CollectionHierarchy.tsx`
- **Description**: Ensure selection, hover, focus, drag & drop, and context menu behavior match `ui-design-system.md` §5.2.
- **Dependencies**: Task 5.1
- **Acceptance**:
  - Single-click select, double-click/Enter open.
  - Clear visual differentiation between hover/selected/focused items.
  - Existing drag/drop and context menu behaviors remain functional and visually aligned.
- **Status**: `pending`

---

## User Story 5: Accessibility & Visual Polish

### Phase 6: A11y & Visual System Alignment

#### Task 6.1: Audit and improve focus & ARIA attributes

- **File**:
  - `src/App.tsx`
  - `src/components/NavigationBar.tsx`
  - `src/components/CollectionHierarchy.tsx`
  - `src/components/ApiRequestBuilder.tsx`
  - `src/components/request/ResponseTab.tsx`
  - `src/components/command/CommandPalette.tsx`
- **Description**: Add or refine ARIA roles, labels, focus order, and focus rings according to `ui-design-system.md` §10.
- **Dependencies**: Tasks 1.3, 2.1, 4.1, 5.2
- **Acceptance**:
  - All interactive elements are reachable via keyboard with logical tab order.
  - Icon-only buttons have accessible names.
  - Tabs and tabpanels use appropriate roles and relationships.
- **Status**: `pending`

#### Task 6.2: Verify semantic color usage & density

- **File**: Shell and key components (same as above)
- **Description**: Ensure use of semantic colors (`--color-accent`, `--color-success`, etc.) and density guidelines (compact controls, tight spacing) from `ui-design-system.md` §§3, 7, 8.
- **Dependencies**: Task 6.1
- **Acceptance**:
  - Status, warning, and error colors use semantic tokens.
  - Controls and rows meet the documented height/spacing targets.
- **Status**: `pending`

---

## Testing Tasks

### Integration Tests

#### Test Task 1: Shell layout & layout modes

- **File**: `tests/integration/components/shell-layout.spec.ts`
- **Description**:  
  **Given** the app is on the home page,  
  **When** the user toggles layout modes via shortcuts and resizes panes,  
  **Then** panes behave as expected (normal/write/debug), sizes persist, and no errors occur.
- **Dependencies**: Task 1.1, Task 1.2, Task 1.3
- **Status**: `pending`

#### Test Task 2: Response visualization with large JSON

- **File**: `tests/integration/components/response-virtualized-view.spec.ts`
- **Description**:  
  **Given** a request that returns a large JSON payload,  
  **When** the user opens the response tab and searches within the body,  
  **Then** the virtualized viewer renders smoothly and search navigates between matches without freezing.
- **Dependencies**: Task 2.1, Task 3.1, Task 3.2, Task 3.3
- **Status**: `pending`

#### Test Task 3: Command palette flows

- **File**: `tests/integration/components/command-palette.spec.ts`
- **Description**:  
  **Given** the app is running,  
  **When** the user opens the command palette, searches for a command (e.g. “New Request”), and executes it,  
  **Then** the expected action occurs and the palette closes.
- **Dependencies**: Task 4.1, Task 4.2, Task 4.3
- **Status**: `pending`

### Data Flow & Performance Tests

#### Test Task 4: Full request→response flow with new UI

- **File**: `tests/integration/data-flow/request-response-ui-alignment.spec.ts`
- **Description**:  
  **Given** a saved collection and request,  
  **When** the user opens it via sidebar, sends it, and inspects the response,  
  **Then** the end-to-end flow works with the new shell/response/palette behavior, and existing DB state is consistent.
- **Dependencies**: All core implementation tasks (1.x–5.x)
- **Status**: `pending`

#### Test Task 5: Large dataset performance

- **File**: `tests/integration/performance/large-json-response-ui.spec.ts`
- **Description**:  
  **Given** a test that generates a very large JSON response,  
  **When** the response viewer loads and the user scrolls/searches,  
  **Then** measured memory delta and interaction latency stay within budgets.
- **Dependencies**: Task 3.1, Task 3.2, Task 3.3
- **Status**: `pending`

---

## Task Execution Order

### Sequential Tasks (high-level)

1. Task 1.1 → 1.2 → 1.3
2. Task 2.1
3. Task 3.1 → 3.2 → 3.3
4. Task 4.1 → 4.2 → 4.3
5. Task 5.1 → 5.2
6. Task 6.1 → 6.2
7. Test Tasks 1–5 (as dependencies are satisfied)

### Parallel Tasks

- Task 1.2 `[P]` can run in parallel with 1.3 once 1.1 is complete (shortcuts vs layout markup).
- Test tasks can be started as soon as their dependent implementation tasks are in place (TDD/BDD).

---

## Progress Tracking

**Total Tasks**: 10 (high-level; plus subtasks inside)  
**Completed**: 0  
**In Progress**: 0  
**Pending**: 10  
**Blocked**: 0

**Completion**: 0%

---

## Notes

- Per project rules, no task should be marked `completed` until all relevant tests under `tests/integration/` have been written and are passing (`npm run test:electron -- tests/integration/`).
