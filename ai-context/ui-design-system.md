<!-- UI Design System for the Desktop API Client -->

# UI Design System

## 1. Introduction

This document defines the visual and interaction design system for the desktop API client built with:

- Electron 28 (desktop shell)
- Vite 5 + React 18 (renderer)
- TypeScript
- Tailwind CSS + shadcn/ui + Radix primitives

It distills the longer 2025 DX/UI paradigms analysis into a **practical, implementation-ready reference**.  
Feature specs and implementation plans should reference this file when making UI decisions.

Design goals:

- Make the app feel like a **crafted, “heirloom-grade” developer tool**, comparable to Linear, Raycast, Zed.
- Prioritize **data visibility, speed, and keyboard-centric workflows**.
- Ensure the UI **recedes behind the work** (requests, responses, collections) instead of competing with it.

---

## 2. Core Principles

1. **Data-forward, chrome-quiet**
   - UI chrome (panels, borders, backgrounds) is visually quiet and monochrome.
   - Requests, responses, status codes, and logs are visually dominant.

2. **Semantic color only**
   - Color is a scarce resource, used almost exclusively for **meaning** (status, selection, alerts, accents).
   - Neutral grays handle structure; semantic palettes handle state.

3. **Density with clarity**
   - Default layout is **high-density**, suitable for professional desktop use.
   - Compact typography, tight spacing, and clear micro-typography keep dense screens readable.

4. **Keyboard-first navigation**
   - Every major action must be reachable via **shortcuts and/or the command palette**.
   - The mouse is optional for experts, not required.

5. **Local-first responsiveness**
   - UI interactions should feel **instant**, backed by local state / DB first, cloud second.
   - Prefer optimistic updates and non-blocking loading indicators.

6. **Stable, purposeful motion**
   - Animations are short, consistent, and functional (pane resizing, state transitions).
   - Avoid decorative motion; use motion as cognitive scaffolding.

7. **Accessible by design**
   - Keyboard navigation, focus rings, and screen reader semantics are first-class concerns.
   - Dark, dense UI still meets contrast and usability standards.

---

## 3. Visual System

### 3.1 Color System

**Base palette**

- Use Tailwind’s **`zinc`** / **`slate`** scales for nearly all structure:
  - App background: deep dark (e.g. `bg-zinc-950` / `bg-zinc-900`).
  - Surfaces: `bg-zinc-900` / `bg-zinc-800`.
  - Borders: `border-zinc-800` / `border-zinc-700`.
  - Primary text: `text-zinc-50` / `text-zinc-100`.
  - Muted text: `text-zinc-400` / `text-zinc-500`.

**Semantic roles**

Define semantic color tokens as CSS variables (theme-level), not hard-coded Tailwind colors:

- `--color-accent` (primary accent / brand, used sparingly)
- `--color-success` (2xx, “OK” states)
- `--color-warning` (4xx, warnings, risky actions)
- `--color-error` (5xx, errors, destructive actions)
- `--color-info` (informational notices)

Usage rules:

- **Status & state**:
  - Response status badges (200/404/500) and history indicators.
  - Test result chips, validation messages.
- **Primary actions**:
  - Key CTA buttons (e.g. “Send”, “Save”) may use `--color-accent` (background or border).
- **Avoid**:
  - Brand color blocks on large structural surfaces (sidebars, headers).
  - Multiple different bright colors in the same region.

**Oklch (future-friendly theming)**

- Consider defining theme colors in **Oklch** (`oklch(L C H)`) to generate consistent hover/active shades.
- For now, treat this as an internal implementation detail; the design system only requires:
  - Stable contrast.
  - Predictable hover/active steps for semantic roles.

### 3.2 Elevation & Surfaces

Hierarchy is expressed with **borders, subtle background shifts, and occasional blur**, not heavy shadows.

- **Base surfaces**
  - Root background: `bg-zinc-950` (or equivalent).
  - Primary content panes: `bg-zinc-900` with `border border-zinc-800`.
  - Secondary/tertiary areas (sidebars, headers): slightly lighter/darker variants to signal hierarchy.

- **Cards vs structural panes**
  - **Structural panes** (sidebar, main editor, response view):
    - Full-height containers, `border-zinc-800`, minimal or no shadow.
  - **Cards** (modals, inline panels, detail popovers):
    - `bg-zinc-900/95` or `bg-zinc-900`, `border border-zinc-700`, very soft shadow if necessary.

- **Overlays & glass**
  - Overlays (command palette, modals) may use:
    - Backdrop: `bg-black/60` + `backdrop-blur-sm` or `backdrop-blur-md`.
    - Panel: `bg-zinc-900/90` + `border-zinc-700`.
  - Sidebars may optionally use subtle vibrancy/translucency on macOS; main content should remain solid for readability.

### 3.3 Typography & Density

**Font**

- Primary font: **Inter** (variable if available).
- Fallbacks: system UI stack where Inter is unavailable.

**Base sizes**

- App body text (UI labels, inputs, rows): **13–14px**.
- Code / editor text (Monaco): 13–14px, depending on readability and density trade-offs.
- Heading hierarchy (approximate):
  - H1 (rare in-app): 20–22px.
  - H2: 18px.
  - H3: 16px.
  - Section labels / pane titles: 13–14px, uppercase or semi-bold.

**Control sizes & spacing**

- Buttons, inputs, tree rows:
  - **Compact**: 28px height.
  - **Default**: 32px height.
  - Padding: `px-2`–`px-3`, `py-1`–`py-1.5`.
- Tables & lists:
  - Row height target: 24–28px.
  - Minimal vertical whitespace between rows (`space-y-0.5` at most).

**Micro-typography**

- Use **monospace** only where alignment is important (status codes, byte sizes, timings, code/editor content).
- Metadata (timestamps, header keys, status code labels) should use **muted color** and smaller size (11–12px).

---

## 4. Layout & Shell

### 4.1 App Shell Layout

The app shell follows an **editor-centric, three-pane mental model**:

1. **Activity Bar** (far left)
   - Narrow, icon-only strip for mode switching (Collections, Environments, History, Logs, Settings, etc.).

2. **Navigation Sidebar** (left)
   - Tree views and lists for the active activity:
     - Collections / folders / requests.
     - Environments.
     - History, mock servers, etc.

3. **Main Stage** (center)
   - Request builder: URL bar, method selector, tabs (Params, Headers, Auth, Body, Tests).
   - Multiple requests may be opened as tabs and split views (future-friendly).

4. **Response Stage** (right or bottom)
   - Response viewer: status, metrics bar, JSON/raw/preview tabs, logs.

The shell should feel similar to a modern code editor: **stable regions, resizable panes** with clear handles.

### 4.2 Modes & Pane Behavior

Define three high-level modes:

1. **Normal Mode**
   - Activity bar, navigation sidebar, main stage, and response stage all visible.
   - Default for most usage.

2. **Command Center / Write Mode**
   - Sidebars and (optionally) response pane hidden or collapsed.
   - Focus on the **request builder** (URL, body, tests).
   - Triggered via keyboard shortcut(s) and command palette.

3. **Debug Mode**
   - Response pane expanded (e.g., 60–70% width) for deep inspection.
   - Request builder remains visible but secondary.

Pane behavior guidelines:

- **Resizable panes** with visible handles and hit targets.
- **Animated size changes**:
  - Duration: ~200ms.
  - Easing: `ease-in-out` or similar.
  - No layout “jumps”; smooth width/height transitions.
- **State persistence**:
  - Remember pane sizes per mode.
  - When toggling a pane on/off, restore the last-used size instead of a fixed default.

### 4.3 Window Chrome

- Favor a **frameless window** with integrated title bar:
  - Draggable area in top bar (excluding interactive elements).
  - Window controls integrated into the left/right side of the header.
- Maintain visual continuity:
  - Activity bar and sidebar extend to full window height.
  - Top bar visually merges with tab row and URL bar for a cohesive look.

---

## 5. Navigation System

### 5.1 Activity Bar

Purpose:

- Provide **stable, always-visible mode switching**.

Content:

- Icon-only buttons (with tooltips) for:
  - Collections.
  - Environments.
  - History.
  - Logs.
  - Settings / Preferences.
  - (Future) Monitors, Mock Servers, Workspaces, etc.

Behavior:

- Clicking an icon:
  - Activates that mode.
  - Updates the navigation sidebar content accordingly.
- Badges:
  - Small, colored dots or counts for alerts (e.g., failed monitors, unread logs).
A

### 5.2 Tree Views & Lists

Tree/list views (e.g., collections, folders, requests) behave like a **file explorer**:

- **Selection**
  - Single-click to select.
  - Double-click (or Enter) to open in the main stage.
  - Clear visual differentiation between selected vs hovered vs focused item.

- **Multi-select**
  - Shift-click for ranges.
  - Cmd/Ctrl-click for discontiguous selection.

- **Drag & Drop**
  - Reordering within a list and dragging into folders/collections.
  - Clear drop indicators:
    - Line between items for reordering.
    - Highlighted folder row for nesting.
  - Optional hover-to-expand: hovering over a closed folder for a short delay expands it.

- **Context menus**
  - Right-click opens a context menu with actions appropriate to the node type:
    - Request: Send, Duplicate, Rename, Move, Generate Code, Mock, Delete.
    - Folder: New Request, New Folder, Run Folder, Edit Auth, Delete.
    - Collection: New Folder, New Request, Run Collection, Edit, Export, Delete.

### 5.3 Workspace Switching

Workspaces represent **isolated contexts** (different projects, teams, environments).

- Placement:
  - Top of the navigation sidebar or at the top of the activity bar.
- Behavior:
  - Switching workspaces swaps all workspace-specific data:
    - Collections, environments, history, logs.
  - Optional visual cue:
    - Slight accent color shift (e.g., `--color-accent`) or workspace avatar.
- Keyboard:
  - Provide shortcuts (e.g., Cmd/Ctrl+Shift+Number) for fast workspace switching.

---

## 6. Command Palette

The command palette is a **primary control surface**, not an accessory.

### 6.1 Scope

Everything that can be done via the UI should be accessible via the command palette:

- **Navigation**
  - Go to request by name.
  - Open collection / environment / history / logs / settings.

- **State mutation**
  - Send current request.
  - Save request.
  - Duplicate / rename / delete entities.
  - Toggle favorites, change environment, etc.

- **View & layout**
  - Toggle sidebar / response pane.
  - Switch layout mode (normal, write, debug).
  - Zoom in/out editors.

- **Utilities**
  - Generate UUID, timestamp helpers.
  - Format JSON / XML.

### 6.2 UX Expectations

- **Trigger**
  - Standard shortcut: `Cmd/Ctrl+K` or `Cmd/Ctrl+P` (and/or via a visible button).

- **Search**
  - **Fuzzy search** (e.g., `auth head` → “Add Authorization Header”).
  - Results grouped by category (Navigation, Actions, Utilities).

- **Context awareness**
  - Prioritize commands relevant to the current context:
    - If a request tab is active: `Send`, `Save`, `Duplicate`, `Copy cURL`.
    - If sidebar has a collection selected: `New Request`, `New Folder`, `Run Collection`.

- **Shortcuts display**
  - Each command lists its dedicated shortcut on the right (e.g., `⌘ S`).
  - Helps users learn and migrate to direct shortcuts over time.

### 6.3 Chained Commands & Forms (Future)

- Some commands can become **inline workflows**:
  - “Create new request” → name input + method selector inside the palette.
  - “Switch environment” → list of environments with inline search.
- Palette remains open for multi-step flows whenever it improves keyboard-driven efficiency.

---

## 7. Request Builder Patterns

### 7.1 URL & “Smart” Inputs

URL bar:

- Method selector + URL input in a single, compact strip.
- Method selector:
  - Small, high-contrast control (e.g., pill button or compact select).
  - Clear color-coded hint per method (GET, POST, PUT, DELETE, etc.) if color budget allows.

Smart input behavior:

- **Environment variables**
  - Typing `{{` opens a small autocomplete menu listing available variables.
  - Inserted variables are visually distinct tokens (color/weight).
  - Hovering a token shows a tooltip with the resolved value for the active environment.

- **Secrets**
  - Sensitive fields (e.g. API keys, Authorization headers) default to **masked**.
  - Provide a “reveal” toggle per field; avoid permanent global reveals.

- **Validation**
  - Basic URL validation (missing scheme, spaces) with inline hints.
  - Clearly distinguish warnings from errors (icon + semantic color).

### 7.2 Tabs & Sections

Standard tab set (can evolve over time):

- **Params** (query params)
- **Headers**
- **Auth**
- **Body**
- **Tests** (if/when scripting is introduced)

Tab behavior:

- Compact tabs integrated into the request builder surface.
- Clear active tab indicator (underline or background).
- Tabs should not cause vertical layout jumps when switching.

Section content:

- Use **table-like rows**:
  - Key | Value | Enabled | Description columns where relevant.
  - Add-row affordance at the bottom; plus icons or empty-row prompts.
- Keep per-row controls small and aligned: enable/disable toggles, delete icons, drag handles for reordering.

### 7.3 Body Editors

Body editor requirements:

- Use **Monaco editor** (or equivalent) for JSON, XML, GraphQL, etc.
- Provide:
  - Syntax highlighting.
  - Basic linting/validation (e.g., malformed JSON).
  - “Prettify” (`{}`) action to format JSON.

Visual integration:

- Match the global monochrome palette:
  - Disable or stylize the minimap for small areas.
  - Subtle gutter/line numbers (muted colors).
  - Custom scrollbars matching app styling.

### 7.4 Auth UX

Auth tab:

- Clearly indicate **source of auth settings**:
  - “Inheriting from Collection X”.
  - “Overridden at Request level”.
- Visual design:
  - Small badges / labels for inheritance status.
  - Simple forms per auth type (API key, Bearer, OAuth2, etc.).

Token state:

- Status indicator (valid, expired, unknown).
- Expiration info (time left) and scope summary for OAuth tokens.
- Clear “Refresh token” / “Get new token” actions where applicable.

---

## 8. Response Visualization Patterns

### 8.1 Tabs & Views

Standard response tabs:

- **Body**
  - Sub-tabs: Raw, Pretty (syntax-highlighted), Preview (HTML/image/PDF), AI (future).
- **Headers**
- **Timeline / Network** (future)
- **Tests / Assertions** (future)

Guidelines:

- Keep tab bar compact and consistent with request tabs.
- Avoid vertical header repetition; share structure where possible.

### 8.2 Virtualized JSON Viewer

Large responses must use a **virtualized viewer**:

- Only render visible nodes in the DOM (react-window, react-virtualized, or equivalent).
- Preserve:
  - Smooth scrolling.
  - Expand/collapse behavior for nested objects/arrays.

Search:

- Cannot rely on browser `Cmd/Ctrl+F` for virtualized content.
- Provide an **in-app search**:
  - Search field within the response pane.
  - Result navigation (next/previous).
  - Highlight current match; auto-scroll to it.

### 8.3 Status & Metrics Bar

At the top of the response pane, show a compact **status bar**:

- **Status code & text**
  - Color-coded badge using semantic colors:
    - Success (2xx): `--color-success`.
    - Redirect / warning (3xx/4xx): `--color-warning`.
    - Error (5xx): `--color-error`.

- **Timing**
  - Total time (ms).
  - (Future) Hover to reveal breakdown: DNS, TCP, TLS, TTFB, download, etc.

- **Size & metadata**
  - Response size (KB/MB).
  - Content-Type.

- **Request progress**
  - A thin **top progress bar** during request execution.
  - Non-blocking: user can still navigate, scroll, and edit.

---

## 9. Motion & Feedback

### 9.1 Motion Guidelines

- Duration:
  - **Short**: 150–200ms for most UI transitions.
- Easing:
  - Use consistent easing curves (`ease-in-out`).
- Where to animate:
  - Pane resize (sidebar, response pane).
  - Tab selection indicator.
  - Button state changes (idle → loading, loading → success/error).
  - Opening/closing overlays (command palette, modals).
- Where **not** to animate:
  - Primary text content reflow (avoid distracting shifts).
  - Critical feedback (errors) that must be seen immediately.

### 9.2 Loading & Feedback

- Prefer **skeletons over spinners** for content loading:
  - Lists of requests, history, logs.
  - Sidebar trees (collections, environments).
- Use spinners only where:
  - There is no known or inferable layout.
  - The operation is very short-lived and inline.

- For the main “Send” action:
  - Use an inline indicator:
    - Button enters a “Sending…” state.
    - Top progress bar or subtle in-button progress.
  - Avoid blocking modals.

---

## 10. Performance, Accessibility, and AI

### 10.1 Performance UX

- Assume a **local-first architecture**:
  - Reads and writes go to local DB/state first.
  - Cloud sync (if present) is background and non-blocking.

- Favor **optimistic updates**:
  - Renaming requests/collections updates immediately.
  - Moving items in trees updates ordering instantly.
  - On sync failure, show a toast and revert state if necessary.

- Perceived performance:
  - Use skeletons and progress bars to make waits feel predictable.
  - Avoid full-screen loading blockers where possible.

### 10.2 Accessibility

- **Keyboard navigation**
  - Every interactive element reachable via Tab/Shift+Tab.
  - Logical tab order within and between panes.

- **Focus indicators**
  - Always visible focus outline:
    - E.g. double-ring or strong single-ring that works on dark backgrounds.
  - Consistent focus styling across buttons, list items, and custom controls.

- **Screen readers**
  - Use ARIA roles and labels on:
    - Icon-only buttons (e.g., send, delete, expand/collapse).
    - Tabs and tabpanels.
    - Tree items and lists.
  - `aria-live` regions for:
    - Request lifecycle (“Sending request…”, “Response received: 200 OK”).
    - Long-running background operations (sync, imports).

### 10.3 AI Integration UX

Treat AI as a **contextual assistant**, not a generic chat window.

Patterns:

- **AI in command palette**
  - Commands like “Generate request from description” or “Explain this response”.
  - Flow: palette input → AI configuration → automatically fill request fields.

- **AI in response debugging**
  - An “AI Debug” affordance when responses fail (4xx/5xx).
  - AI suggestions rendered inline in the response pane:
    - Likely root cause.
    - Proposed header/body/auth changes.

- **AI in visualization**
  - Optional “Visualize data” actions:
    - AI generates chart/table configs from JSON payloads.
  - Keep this behind explicit user intent to avoid noise and cost.

UX constraints:

- AI actions must be **clearly labeled** and **reversible** (no silent side effects).
- Avoid blocking workflows while AI runs; show progress and allow the user to continue.

---

## 11. Implementation Notes & Alignment

### 11.1 How to Use This Document

- **Feature specs (`specs/XXX-.../spec.md`)** should:
  - Reference relevant sections here, e.g.:
    - “Follows the response visualization patterns in `ui-design-system.md` §8.”
    - “Uses navigation and layout conventions from `ui-design-system.md` §§4–5.”

- **Implementation plans (`plan.md`)** should:
  - Call out which existing components are being aligned or extended.
  - Note any deliberate deviations from this design system and why.

### 11.2 Mapping to Existing Components

Non-exhaustive mapping between this design system and current/future code:

- **App shell & layout**
  - `App.tsx` (shell, panes, sidebar widths, layout modes).
  - `TitleBar`, `NavigationBar`, and any resize handle components.

- **Navigation**
  - `CollectionHierarchy` and other sidebar components for collections/history/environments.

- **Request builder**
  - Homepage / main request page components.
  - Hooks like `useRequestState` managing request input state.

- **Response visualization**
  - Response tab components and any JSON viewer/preview components.

- **Command palette & shortcuts**
  - `useShortcuts` and any command palette implementation (likely based on shadcn `Command` / `cmdk`).

As the app evolves, update this document when:

- New UX patterns become common (e.g., collaboration, realtime cursors).
- Existing patterns are refined (new layout modes, better navigation).
- Major architectural changes occur (new persistence, sync models).


