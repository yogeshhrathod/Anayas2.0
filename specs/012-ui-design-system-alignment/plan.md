# Implementation Plan: ui-design-system-alignment

**Feature ID**: `012-ui-design-system-alignment`  
**Status**: `planned`  
**Related Spec**: `specs/012-ui-design-system-alignment/spec.md`  
**Primary Design Reference**: `ai-context/ui-design-system.md`

## Overview

Align the live UI with the documented design system by:

- Standardizing the **shell layout** (title bar, navigation, sidebar, main stage, response stage).
- Upgrading **request/response views** to follow the response visualization and request builder patterns.
- Introducing a **command palette** and tightening **keyboard-first** workflows.
- Improving **visual tokens, density, accessibility, and performance instrumentation** without regressing memory/speed targets.

This is an umbrella plan; individual phases can ship incrementally and are heavily constrained by the performance goals in `project-goal.md` and patterns in `architecture.md` / `example-quality.md`.

## Existing Code Analysis

> This section maps the design-system areas to current code we’ll reuse/extend.

### Similar Features to Reference

- [ ] `specs/003-performance-optimization-lazy-loading/` – patterns for lazy loading and performance tracking.
- [ ] `specs/009-response-view-redesign/` and `specs/011-response-tab-redesign/` – response pane & tab patterns we must keep aligned with.
- [ ] `specs/010-vscode-style-sidebar/` – sidebar layout and density that should be reconciled with the design system shell.

### Components to Reuse / Extend

- [ ] `src/App.tsx`
  - **WHY**: Main shell (title bar, navigation bar, sidebar, main content). We’ll adjust layout semantics (shell regions, pane behavior, transitions) to better match §4 of the design system while preserving lazy-loaded pages.
- [ ] `src/components/TitleBar.tsx`
  - **WHY**: Window chrome integration; align with frameless, editor-style header guidance.
- [ ] `src/components/NavigationBar.tsx`
  - **WHY**: Currently serves as top navigation; will either be evolved into an “activity bar” concept or coordinated with a left activity strip.
- [ ] `src/components/CollectionHierarchy.tsx` and related sidebar components
  - **WHY**: Tree/list behavior should be aligned with §5.2 (selection, hover, drag & drop, context menus).
- [ ] `src/components/ApiRequestBuilder.tsx` + `src/components/request/*`
  - **WHY**: Already structured like the request builder described in §7; we’ll refine URL strip, tabs, smart inputs, and density.
- [ ] `src/components/request/ResponseTab.tsx` and `Response*View.tsx`
  - **WHY**: Entry point for response visualization; must be adjusted to match response stage + status/metrics bar + tab patterns, and to plug in a virtualized JSON viewer.
- [ ] `src/components/GlobalSearch.tsx` (if present)
  - **WHY**: Potentially reused or replaced as the base for the command palette.

### Hooks to Reuse

- [ ] `src/hooks/useShortcuts.ts`
  - **WHY**: Centralized shortcut handling; extended to drive command palette and layout modes (normal / write / debug).
- [ ] `src/hooks/useRequestState.ts` and `src/hooks/useRequestActions.ts`
  - **WHY**: State/action orchestration for request builder and response tab, reused when introducing new layout behaviors or response pane positioning.
- [ ] `src/hooks/useSessionRecovery.ts`
  - **WHY**: Ensure any shell/layout changes still preserve recovery behavior on startup.

### Utilities to Reuse

- [ ] `src/lib/utils.ts (cn)` – class merging for new shell/pane/command palette components.
- [ ] `src/lib/keymap.ts` – existing keymap definitions for expanding keyboard-first flows and mapping commands.
- [ ] `src/lib/performance.ts (trackFeatureLoad)` – used for tracking load/memory of new/adjusted features (command palette, response stage, JSON viewer).

### Types / State to Extend

- [ ] `src/types/entities.ts` and `src/types/forms.ts`
  - **WHY**: If response visualization gains additional metadata (e.g., search highlights, virtualized tree nodes) we may add lightweight types without touching persistence.
- [ ] `src/store/useStore.ts`
  - **WHY**: Add shell layout mode (normal/write/debug), pane sizes, and command-palette state in a way that respects existing store patterns and performance constraints.

### Services / IPC to Reuse

- No new IPC is required for the design-system alignment itself; we will:
  - Reuse existing request/response IPC.
  - Potentially log performance metrics via existing logging/performance utilities in the renderer.

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- [x] Yes – core points:
  - Aligning to a **data-forward, dense, keyboard-first shell** reduces UI bloat and encourages workflows that avoid heavy, unnecessary components.
  - Introducing **virtualized viewers** and **lazy-loaded tooling (command palette, heavy response views)** keeps memory under control, especially for large responses.
  - Performance tracking hooks (load time + memory) are wired directly into new/changed surfaces to guard against regressions.

**Architecture Compliance**

- [x] Follows `architecture.md`:
  - Pages remain lazy-loaded (`App.tsx` already uses `lazy` + `Suspense`).
  - New heavy features (e.g., virtualized JSON viewer, command palette) are code-split and only mounted on demand.
  - Cleanup on unmount is mandatory for new components.
- [x] Uses `common-utils.md`:
  - Reuse `cn`, `keymap`, performance utilities, and existing hooks instead of re-inventing patterns.
- [x] Matches `example-quality.md`:
  - Virtualized lists, debounced operations, and feature-level performance tracking are explicitly part of the plan.

## Performance Implementation Plan

### Lazy Loading Strategy (REQUIRED)

- **Command Palette**
  - Loaded on first invocation via keyboard shortcut (`Cmd/Ctrl+K` / `Cmd/Ctrl+P`) from `useShortcuts`.
  - Implemented as a lazily imported component, e.g. `const CommandPalette = lazy(() => import('../components/CommandPalette'))`.
  - Renders inside a portal with `Suspense` fallback (lightweight skeleton/blurred overlay).
- **Virtualized JSON Viewer**
  - Separated into its own component (e.g. `ResponseJsonVirtualizedView`) under `src/components/request/`.
  - Only loaded when:
    - The response tab is active, **and**
    - Content-Type is JSON **and** payload exceeds a size threshold.
- **Layout Modes**
  - Additional layout “chrome” (debug mode, response expansion) reuses existing components and is purely CSS/layout logic; no extra heavy bundles.

### Code Splitting Plan

- **Route-based**: Keep existing lazy-loaded pages in `App.tsx` as-is.
- **Feature-based**:
  - New `CommandPalette` and `ResponseJsonVirtualizedView` are separate chunks.
  - If a new virtualized JSON library is introduced (e.g. `@tanstack/react-virtual` or `react-window`), it should be imported only from the virtualized viewer file so that the bundle is not pulled into unrelated routes.
- **Bundle size (informational)**:
  - Target: +≤200KB gzipped for virtualization + command palette combined (not a blocker but monitored).

### Memory Management Plan

- **Command Palette**
  - Mount only while open; unmount when closed.
  - Clear search state on close to avoid holding large in-memory command lists longer than necessary (commands can be regenerated cheaply).
- **Virtualized JSON Viewer**
  - Render only visible nodes and keep the backing data immutable (pass by reference from response state).
  - On unmount, drop any search index / derived structures (e.g. computed flattened tree or search map).
- **Shell Layout**
  - Pane sizes and modes are primitive values in Zustand; no additional long-lived objects or caches.
  - Ensure event listeners used for resize/keyboard are cleaned up on unmount (follow patterns from `useShortcuts` and `ResizeHandle`).

### Performance Tracking Implementation (MANDATORY)

- Extend usage of `trackFeatureLoad` for:
  - `Page-ResponseStage` (if we introduce a dedicated response pane view).
  - `Feature-CommandPalette` (first open).
  - `Feature-ResponseJsonVirtualizedView` (first mount with large payload).
- For each:
  - Measure **load time** (start at trigger, end after double-`requestAnimationFrame` as used in `App.tsx`).
  - For the virtualized viewer, capture rough **heap delta** before/after first mount and log warnings if exceeding 20–30MB budget.

## Files to Modify/Create (with WHY)

### Modified Files

- `src/App.tsx`
  - **WHY**: Refine the shell into clearer regions (title bar, navigation/activity, sidebar, main stage, response stage) and introduce layout modes (normal / write / debug) with smooth pane transitions using existing `ResizeHandle`.
  - Integrate any new response stage container while preserving lazy page loading and existing performance tracking.

- `src/components/NavigationBar.tsx`
  - **WHY**: Align navigation with the “activity bar” semantics: clearer modes (Collections, Environments, History, Logs, Settings), keyboard-accessible, and visually minimal according to the design system.
  - Possibly delegate some responsibilities (e.g., environment selection, primary actions) to better reflect the shell guidelines.

- `src/components/CollectionHierarchy.tsx` (and related sidebar sections)
  - **WHY**: Ensure tree view behavior matches design system expectations (selection/hover/focus states, multi-select affordances as feasible, drag/drop cues, context menu triggers), while keeping performance acceptable for large collections.

- `src/components/ApiRequestBuilder.tsx`
  - **WHY**: Fine-tune request builder’s density, tab behaviors, and integration with the response stage (especially in debug mode), without changing core data flow.

- `src/components/request/RequestTabs.tsx`
  - **WHY**: Align tab visuals (compact, integrated strip, status badges) with §7 and §8, and ensure the Response tab clearly signals status/health.

- `src/components/request/ResponseTab.tsx` and `ResponseBodyView.tsx` / `ResponseHeadersView.tsx` / `ResponseBothView.tsx`
  - **WHY**: Introduce a more explicit “status & metrics bar” (status badge, time, size, content-type) and integrate the virtualized JSON view.
  - Wire performance tracking to use shared utilities rather than ad-hoc `console.log`.

- `src/store/useStore.ts`
  - **WHY**: Add layout mode state and response-pane sizing that follow the design system’s modes and pane behavior (including persistence across sessions if appropriate).

### New Files

- `src/components/command/CommandPalette.tsx` (or similar path)
  - **WHY**: Implement the design system’s command palette using shadcn `Command` / `cmdk` (or existing primitives), wired to `useShortcuts` and `KEYMAP`, lazy-loaded and focused on navigation/actions/layout controls.

- `src/components/request/ResponseJsonVirtualizedView.tsx`
  - **WHY**: Virtualized viewer for large JSON responses using a stable library (e.g. `@tanstack/react-virtual` or `react-window`) instead of bespoke code, providing in-pane search and match navigation per §8.2.

## Implementation Phases

### Phase 1: Shell & Layout Alignment

**Goal**: Bring the overall shell (title bar, navigation, sidebar, main stage) into closer alignment with `ui-design-system.md` §§4–5 without changing core behavior.  
**Key Files**: `src/App.tsx`, `TitleBar`, `NavigationBar`, `CollectionHierarchy`, `ResizeHandle`.

**Tasks (high level)**:

- Define/confirm layout modes in `useStore` (`normal`, `write`, `debug`) and wire basic toggles (shortcuts only; no UI yet).
- Adjust `App.tsx` structure and Tailwind classes to clearly separate panes and apply consistent density, borders, and transitions.
- Ensure pane resize animations and state persistence follow design guidance (e.g., 150–200ms, `ease-in-out`).

### Phase 2: Request Builder & Response Stage Alignment

**Goal**: Align request builder and response visualization with §§7–8, including a clearer metrics bar and staged response view.  
**Key Files**: `ApiRequestBuilder`, `RequestTabs`, `ResponseTab`, `Response*View` components, `useRequestState`, `useRequestActions`.

**Tasks**:

- Tighten URL bar + method selector layout, ensuring keyboard focus and validation states match the design system.
- Introduce/standardize status bar in the response area (status badge, time, size, content-type, progress indicator).
- If needed, refactor where the response is rendered so that “debug mode” visibly emphasizes the response pane (width/height changes, not new logic).

### Phase 3: Virtualized JSON Viewer & Search

**Goal**: Handle large JSON responses efficiently and add in-pane search/navigation.  
**Key Files**: new `ResponseJsonVirtualizedView`, wiring inside `ResponseBodyView` / `ResponseTab`.

**Tasks**:

- Choose a stable virtualization library already used or recommended (`example-quality.md` uses `@tanstack/react-virtual` as an example) to avoid custom heavy code.
- Implement a minimal JSON tree/line viewer that:
  - Virtualizes rows.
  - Supports expand/collapse where feasible.
  - Embeds an in-pane search box with next/previous navigation.
- Guard activation by payload size and content type, falling back to existing Monaco-only view for small responses.

### Phase 4: Command Palette & Keyboard-First Workflows

**Goal**: Implement the command palette described in §6 and solidify keyboard-first navigation.  
**Key Files**: new `CommandPalette`, `useShortcuts`, `keymap`, `NavigationBar`, `ApiRequestBuilder`.

**Tasks**:

- Implement a lazily loaded command palette component, using `shadcn/ui` + `cmdk` style patterns if available.
- Wire shortcuts (`Cmd/Ctrl+K` / `Cmd/Ctrl+P`) to open it and focus the search input.
- Add core command sets:
  - Navigation (switch tabs/pages).
  - Request actions (Send, Save, New Request, Import cURL/JSON).
  - Layout toggles (show/hide sidebar, switch layout modes).
- Display per-command shortcuts inline to help users learn them.

### Phase 5: Accessibility & Visual Polish

**Goal**: Ensure the aligned UI respects accessibility and visual system details.  
**Key Files**: Shell components, request/response components, command palette.

**Tasks**:

- Audit focus order and ARIA attributes for:
  - NavigationBar buttons.
  - Sidebar tree items.
  - Tabs and tabpanels.
  - Command palette items.
- Standardize focus ring styles and ensure adequate contrast across dark theme surfaces.
- Verify semantic color usage for statuses, warnings, errors, and primary actions matches §3.

## Testing Strategy (High-Level)

> Detailed test breakdown will live in `tasks.md` and specific test files, but this plan defines **what categories** we must cover.

### Integration / Component Tests

- Extend or add tests under:
  - `tests/integration/components/` for:
    - Shell layout behaviors (sidebar toggle + resize + persistence).
    - Request builder + response tab interactions in all layout modes.
    - Command palette open/search/execute flows.

### Data-Flow & Performance Tests

- Add or extend tests in:
  - `tests/integration/data-flow/` to ensure no regressions in request → response → visualization flow after layout changes.
  - `tests/integration/performance/` for:
    - Large-response rendering with the virtualized viewer.
    - Memory usage and interaction latency under heavy payloads (1000+ nodes).

### BDD / Given-When-Then Structure

- For each major user-facing behavior (e.g., “Open command palette and send request”, “Inspect large JSON response with search”), define tests using Given-When-Then in line with `test-suite-guide.md` and existing examples (`collection-hierarchy.spec.ts`, `env-handlers.spec.ts`, etc.).

All new tests must be written **before** implementation of their corresponding behavior and must be included in the `tests/integration/` suite so that `npm run test:electron -- tests/integration/` covers this feature end-to-end.
