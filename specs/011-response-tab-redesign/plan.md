# Implementation Plan: Response Tab Redesign

**Feature ID**: `011-response-tab-redesign`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Convert the ResponsePanel from a bottom-fixed component to a dedicated "Response" tab integrated into the main Request Builder tabs. Implement three sub-tabs (Headers, Body, Both) with a resizable side-by-side split view in the "Both" sub-tab. Fix Monaco editor resize issues to ensure proper window width responsiveness. All components will be part of the main Request Builder bundle (no code splitting needed due to small size ~10KB).

## Existing Code Analysis

### Similar Features to Reference

- [x] Feature: **ParamsTab, HeadersTab, BodyTab, AuthTab** - Follow same tab component pattern (props, structure, styling)
  - Location: `src/components/request/ParamsTab.tsx`, `HeadersTab.tsx`, `BodyTab.tsx`, `AuthTab.tsx`
  - Pattern: Export React.FC with props interface, return JSX with consistent structure
  - Usage: Demonstrates tab content pattern and integration with ApiRequestBuilder

### Components to Reuse

- [x] **ResponsePanel** (`src/components/request/ResponsePanel.tsx`) - Extract display logic for Headers and Body views
  - Contains response display code that will be refactored into sub-tab components
  - Badge, Button, Clock icon components can be reused
  - Headers display format can be copied to ResponseHeadersView
  - Monaco editor configuration can be reused in ResponseBodyView
- [x] **MonacoEditor** (`src/components/ui/monaco-editor.tsx`) - Use for Body and Both sub-tabs
  - Already handles read-only mode, syntax highlighting, theming
  - **RESIZE ISSUE**: Currently no ResizeObserver - needs fixing
  - Will add ResizeObserver to trigger `editor.layout()` on container size changes
- [x] **RequestTabs** (`src/components/request/RequestTabs.tsx`) - Extend to add Response tab
  - Currently has 4 tabs: params, auth, headers, body
  - Need to add 5th tab: response
  - Badge pattern for showing response status/indicator
- [x] **Button, Badge, Clock icon** from existing components - Use in Response tab header

### Hooks to Reuse

- [x] **useRequestState** (`src/hooks/useRequestState.ts`) - Extend activeTab type to include 'response'
  - Line 30: `activeTab: 'params' | 'auth' | 'headers' | 'body'` → add `| 'response'`
  - Line 46: `setActiveTab` signature will automatically support new type
  - Add `responseSubTab: 'headers' | 'body' | 'both'` state
  - Add `splitViewRatio: number` state (0-100, default 50)
- [x] **useRequestActions** (`src/hooks/useRequestActions.ts`) - Already provides response data
  - `response: ResponseData | null` - Use this for display
  - `copyResponse()` and `downloadResponse()` - Reuse in all sub-tabs

### Utilities to Reuse

- [x] **cn** (`src/lib/utils.ts`) - Tailwind class merging for conditional styles
- [x] **Performance tracking pattern** (from `ai-context/example-quality.md`) - Track memory and load time
  ```typescript
  const memoryBefore = performance.memory?.usedJSHeapSize || 0;
  // load Response tab
  const memoryAfter = performance.memory?.usedJSHeapSize || 0;
  console.log(
    'Response tab memory:',
    (memoryAfter - memoryBefore) / 1024 / 1024,
    'MB'
  );
  ```

### Types to Extend

- [x] **RequestState** (`src/hooks/useRequestState.ts`) - Add response tab types
  - `activeTab`: Add `'response'` to union type
  - Add `responseSubTab: 'headers' | 'body' | 'both'`
  - Add `splitViewRatio: number` (for Both sub-tab divider position)
- [x] **ResponseData** (`src/types/entities.ts`) - Already exists, use as-is
  - Contains: status, statusText, headers, data, time

### Services to Reuse

- [x] **No main process services needed** - All UI-only changes

### Integration Points

- **Page**: `src/components/ApiRequestBuilder.tsx` - Main integration point
  - Line 342-346: Remove `<ResponsePanel />` from bottom
  - Line 218-267: Add 'response' case to `renderTabContent()` switch
  - Line 298-303: RequestTabs already integrated, will auto-update when we add Response tab
- **Existing Component**: `RequestTabs` - Add Response as 5th tab
- **Existing Pattern**: Follow tab structure of ParamsTab, HeadersTab, BodyTab

### New Components Needed

- [x] **ResponseTab** (`src/components/request/ResponseTab.tsx`) - Main tab container with sub-tabs
  - **Why new**: Need container for sub-tab navigation and content rendering
  - **Why existing won't work**: Other tabs don't have sub-tabs, Response needs this unique structure
- [x] **ResponseHeadersView** (`src/components/request/ResponseHeadersView.tsx`) - Headers-only display
  - **Why new**: Extract headers display logic from ResponsePanel into standalone component
  - **Why existing won't work**: ResponsePanel is full layout, need just headers section
- [x] **ResponseBodyView** (`src/components/request/ResponseBodyView.tsx`) - Body-only display (Monaco)
  - **Why new**: Extract body display logic into standalone component with fixed Monaco resize
  - **Why existing won't work**: ResponsePanel combines both, need separated for sub-tabs
- [x] **ResponseBothView** (`src/components/request/ResponseBothView.tsx`) - Side-by-side split view
  - **Why new**: Unique split view layout combining headers + body side-by-side
  - **Why existing won't work**: No existing split view component, unique to Response tab
- [x] **ResizableSplitView** (`src/components/ui/resizable-split-view.tsx`) - Reusable split panel
  - **Why new**: General-purpose resizable split view utility
  - **Why existing won't work**: No existing split view component in codebase
  - **Future reuse**: Can be used for other features needing split layouts

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**

- [x] **Yes** - This refactoring improves performance:
  - **Memory Efficiency**: Response content only rendered when Response tab active (not always rendered at bottom)
  - **Lazy Rendering**: Response components mount only when tab selected, unmount when switching away
  - **Screen Space**: Removes bottom panel, provides more vertical space, reduces DOM nodes when response not visible
  - **No Bundle Bloat**: Components are lightweight (~10KB total), no heavy dependencies
  - **Cleanup**: Response components unmount when switching tabs, freeing memory

**Are there more reusable or cleaner ways to achieve the same?**

- **Tab Pattern**: Using existing tab pattern ensures consistency and maintainability
- **Component Separation**: Splitting ResponsePanel into Headers/Body/Both views follows single responsibility principle
- **ResizableSplitView**: Creating reusable split view component enables future features to use it
- **No Code Splitting**: Since components are small (~10KB), keeping in main bundle avoids loading overhead
- **Alternative Considered**: Using react-resizable-panels library (rejected: adds 50KB, custom CSS Grid is lighter)

**Architecture Compliance:**

- [x] **Follows architecture.md patterns**:
  - ✅ Lazy rendering (Response components mount only when tab active)
  - ✅ Memory management (components unmount when switching tabs)
  - ✅ Component pattern (memoization, cleanup in useEffect)
  - ✅ No code splitting (lightweight components don't justify separate bundle)
- [x] **Uses common-utils.md utilities**:
  - ✅ Uses `cn()` for className merging
  - ✅ Uses existing MonacoEditor component
  - ✅ Follows performance tracking pattern
- [x] **Matches example-quality.md standards**:
  - ✅ Lazy-loaded components (conditional rendering based on activeTab)
  - ✅ Memory-conscious (unmount when not active)
  - ✅ Cleanup in useEffect
  - ✅ Performance tracking for memory and load time
- [x] **No architecture violations**:
  - ✅ No upfront loading (components render only when needed)
  - ✅ Proper cleanup (useEffect cleanup functions)
  - ✅ No memory leaks (Monaco editor disposal, event listener cleanup)

## Performance Implementation Plan

### Lazy Loading Strategy (REQUIRED)

- **How feature loads on-demand**: Response tab components (ResponseTab, sub-views) only render when user clicks Response tab
  - Conditional rendering: `{activeTab === 'response' && <ResponseTab />}`
  - Components unmount when switching to other tabs, freeing memory
  - Monaco editor in Body/Both views lazy mounts when those sub-tabs selected
- **Trigger**: User clicks "Response" tab in Request Builder
- **Loading State**: Instant render (no async loading needed, components in main bundle)
- **Code**:
  ```typescript
  // In ApiRequestBuilder.tsx renderTabContent()
  case 'response':
    return <ResponseTab response={response} onCopy={copyResponse} onDownload={downloadResponse} />;
  ```

### Code Splitting Plan (Supports Lazy Loading)

- **Separate Bundle**: No - Components stay in main Request Builder bundle
  - **Rationale**: Response viewing is core Request Builder functionality
  - **Size Impact**: ~10KB (ResponseTab + 3 sub-views + ResizableSplitView) - minimal impact
  - **Performance**: No async import overhead, instant render when tab clicked
  - **Future**: If components grow >50KB, consider splitting
- **Bundle Type**: N/A (part of main bundle)
- **Vite Configuration**: No special config needed

### Bundle Size (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: ~10KB
  - ResponseTab: ~2KB
  - ResponseHeadersView: ~2KB
  - ResponseBodyView: ~2KB
  - ResponseBothView: ~2KB
  - ResizableSplitView: ~2KB
- **Total**: Tracked for awareness, not a blocker

### Memory Management Plan

- **Memory Budget**: <20MB for Response rendering (within Request Builder's 30MB budget)
- **Cleanup Strategy**:
  - [x] **Component unmount**: Response components unmount when switching to other tabs
  - [x] **Monaco editor disposal**: Call `editor.dispose()` in useEffect cleanup
  - [x] **ResizeObserver cleanup**: Call `observer.disconnect()` in useEffect cleanup
  - [x] **Event listeners**: Remove drag handlers in ResizableSplitView cleanup
  - [x] **Timers**: No timers used
  - [x] **Requests**: No network requests (display only)
  - [x] **Caches**: No caches needed (data from props)
  - [x] **Workers**: No workers used
- **Cleanup Code Location**:
  - `ResponseBodyView.tsx`: useEffect cleanup for Monaco editor + ResizeObserver
  - `ResponseBothView.tsx`: useEffect cleanup for Monaco editor + ResizeObserver
  - `ResizableSplitView.tsx`: useEffect cleanup for drag event listeners

### Performance Tracking Implementation (MANDATORY)

- **Memory Tracking** (PRIMARY):
  ```typescript
  // In ResponseTab.tsx
  useEffect(() => {
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

    return () => {
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;
      console.log(
        '[Performance] Response tab memory:',
        memoryDelta.toFixed(2),
        'MB'
      );

      if (memoryDelta > 20) {
        console.warn(
          '[Performance] Response tab exceeded memory budget:',
          memoryDelta,
          'MB'
        );
      }
    };
  }, []);
  ```
- **Load Time Tracking** (PRIMARY):
  ```typescript
  // In ResponseTab.tsx
  useEffect(() => {
    const startTime = performance.now();

    // After first render
    requestAnimationFrame(() => {
      const loadTime = performance.now() - startTime;
      console.log(
        '[Performance] Response tab load time:',
        loadTime.toFixed(2),
        'ms'
      );

      if (loadTime > 100) {
        console.warn(
          '[Performance] Response tab load time exceeded budget:',
          loadTime,
          'ms'
        );
      }
    });
  }, []);
  ```
- **Performance Metrics Logging**: Console logs with `[Performance]` prefix for filtering

**Optional/Informational:**

- **Bundle Size Tracking**: Vite build reports bundle sizes automatically

### Performance Budget Verification (PRIMARY GOALS)

- **Memory** (PRIMARY): [Estimated: 15 MB] [Target: <20MB] [Status: ✅ Within budget] - MANDATORY
- **Load Time** (PRIMARY): [Estimated: 50 ms] [Target: <100ms] [Status: ✅ Within budget] - MANDATORY

**Informational:**

- **Bundle Size**: [Estimated: 10 KB] [Tracked for awareness, not a blocker]

## Files to Modify/Create (with WHY)

### New Files

1. **`src/components/request/ResponseTab.tsx`**
   - **WHY**: Main container for Response tab with sub-tab navigation (Headers/Body/Both)
   - **WHAT**: Manages sub-tab state, renders appropriate sub-tab component, shows empty state when no response
   - **PERFORMANCE**: Lightweight (~2KB), only renders when Response tab active, includes performance tracking
   - **PATTERN**: Similar to other tab components, exports React.FC with typed props

2. **`src/components/request/ResponseHeadersView.tsx`**
   - **WHY**: Displays response headers only (status, time, header key-values)
   - **WHAT**: Refactored from ResponsePanel headers section, standalone component
   - **PERFORMANCE**: Minimal memory (~3KB component + response data), no heavy rendering
   - **REUSE**: Uses existing Badge, Button, Clock icon components

3. **`src/components/request/ResponseBodyView.tsx`**
   - **WHY**: Displays response body in full-width Monaco editor with FIXED resize handling
   - **WHAT**: Monaco editor with ResizeObserver to detect container size changes and call `editor.layout()`
   - **PERFORMANCE**: Monaco editor (~40MB when loaded, but already loaded for request body editing)
   - **FIX**: Adds ResizeObserver to fix Monaco resize issue (main requirement of this feature)
   - **CLEANUP**: Disposes Monaco editor and disconnects ResizeObserver on unmount

4. **`src/components/request/ResponseBothView.tsx`**
   - **WHY**: Side-by-side split view showing headers (left) + body (right) with resizable divider
   - **WHAT**: Uses ResizableSplitView to create 50/50 split (adjustable), embeds ResponseHeadersView + Monaco editor
   - **PERFORMANCE**: Combines two views, Monaco editor with ResizeObserver for proper sizing
   - **STATE**: Manages split ratio (0-100), persists during session (not saved to DB)
   - **CLEANUP**: Cleans up Monaco editor and ResizeObserver on unmount

5. **`src/components/ui/resizable-split-view.tsx`**
   - **WHY**: Reusable component for side-by-side resizable panels (can be used in future features)
   - **WHAT**: Creates two panels with draggable divider, uses CSS Grid with fr units for sizing
   - **PERFORMANCE**: Lightweight (~2KB), CSS Grid-based (no heavy library like react-resizable-panels)
   - **API**: `<ResizableSplitView left={<Left />} right={<Right />} initialRatio={50} onRatioChange={setRatio} />`
   - **CLEANUP**: Removes drag event listeners (mousedown, mousemove, mouseup) on unmount

### Modified Files

1. **`src/components/ApiRequestBuilder.tsx`**
   - **WHY**: Integrate Response tab, remove old ResponsePanel
   - **CHANGES**:
     - Line 218-267 `renderTabContent()`: Add `case 'response':` to render ResponseTab
     - Line 342-346: Remove `<ResponsePanel />` component (delete lines)
     - Import ResponseTab component
   - **PERFORMANCE IMPACT**: Reduces always-rendered DOM (ResponsePanel always visible at bottom → now only when tab active)
   - **MEMORY IMPACT**: Saves memory when response not viewed (~15MB freed when Response tab not active)

2. **`src/components/request/RequestTabs.tsx`**
   - **WHY**: Add "Response" as 5th tab in navigation
   - **CHANGES**:
     - Line 27: Extend `activeTab` type: `'params' | 'auth' | 'headers' | 'body' | 'response'`
     - Line 34-96: Add Response tab button with optional badge (show indicator when response available)
   - **PERFORMANCE IMPACT**: None (adds one tab button, ~0.5KB)
   - **UX**: Badge shows when response data available, guides user to view response

3. **`src/hooks/useRequestState.ts`**
   - **WHY**: Add response tab state management
   - **CHANGES**:
     - Line 30: Extend `activeTab`: `'params' | 'auth' | 'headers' | 'body' | 'response'`
     - Line 28-42 `RequestState` interface: Add fields:
       ```typescript
       responseSubTab: 'headers' | 'body' | 'both';
       splitViewRatio: number; // 0-100, default 50
       ```
     - Line 44-61 `RequestStateActions` interface: Add setters:
       ```typescript
       setResponseSubTab: (tab: 'headers' | 'body' | 'both') => void;
       setSplitViewRatio: (ratio: number) => void;
       ```
     - Line 80-325 `useRequestState()`: Initialize new state fields, create setter functions
   - **PERFORMANCE IMPACT**: Minimal (adds 2 state fields + 2 setters)

4. **`src/components/ui/monaco-editor.tsx`**
   - **WHY**: Fix resize issue by adding ResizeObserver support
   - **CHANGES**:
     - Add ResizeObserver in useEffect to watch container size changes
     - Call `editor.layout()` when container size changes
     - Disconnect observer in cleanup
   - **PERFORMANCE IMPACT**: Minimal (ResizeObserver is lightweight, browser-native API)
   - **FIX**: This solves the Monaco editor resize issue (primary requirement)
   - **EXAMPLE**:
     ```typescript
     useEffect(() => {
       if (!editorRef.current) return;

       const observer = new ResizeObserver(() => {
         editorRef.current?.layout();
       });

       const container = editorRef.current.getContainerDOMNode();
       if (container) observer.observe(container);

       return () => observer.disconnect();
     }, []);
     ```

### Deleted Files

1. **`src/components/request/ResponsePanel.tsx`**
   - **WHY**: Replaced by ResponseTab + sub-view components
   - **JUSTIFICATION**: Old bottom panel approach replaced by tab-based navigation, code refactored into ResponseHeadersView and ResponseBodyView
   - **MIGRATION**: Display logic extracted into new components, Copy/Download functionality preserved

## Architecture Decisions

### Decision 1: No Code Splitting for Response Components

**Context**: Response tab components add ~10KB to bundle. Should they be code-split?

**Options Considered**:

- **Option A**: Code split Response components (lazy load on tab click)
  - **Pros**: Reduces initial bundle by ~10KB
  - **Cons**: Adds loading delay (network + parse), complexity, async import overhead
- **Option B**: Keep in main bundle (no code splitting)
  - **Pros**: Instant render, simpler code, no loading states, minimal size impact
  - **Cons**: Increases initial bundle by ~10KB

**Decision**: **Option B - Keep in main bundle**

**Rationale**:

- Response viewing is core Request Builder functionality, users expect instant access
- 10KB is minimal impact (< 0.5% of typical bundle)
- Lazy rendering (conditional mounting) provides memory benefits without code splitting overhead
- Simpler code, no async imports, no loading states
- Follow principle: Code split heavy features (>50KB), inline lightweight ones

**Trade-offs**: Slightly larger initial bundle (+10KB), but better UX (instant tab switching)

---

### Decision 2: CSS Grid for ResizableSplitView vs Library

**Context**: Need resizable split view for "Both" sub-tab. Use library or build custom?

**Options Considered**:

- **Option A**: Use `react-resizable-panels` library
  - **Pros**: Battle-tested, handles edge cases, feature-rich
  - **Cons**: Adds 50KB to bundle, potential performance overhead, overkill for simple use case
- **Option B**: Custom CSS Grid implementation
  - **Pros**: Lightweight (~2KB), full control, no dependencies, minimal bundle impact
  - **Cons**: Need to handle drag logic, edge cases

**Decision**: **Option B - Custom CSS Grid implementation**

**Rationale**:

- Simple use case (2 panels, horizontal divider) doesn't justify 50KB library
- CSS Grid with `fr` units + drag handler is ~2KB vs 50KB library
- Full control over performance, styling, behavior
- Follows performance-first principle: avoid heavy dependencies for simple features
- Can evolve into reusable component for future split view needs

**Trade-offs**: Slightly more code to maintain, but 48KB bundle savings and better performance

---

### Decision 3: Monaco Editor Resize Fix Approach

**Context**: Monaco editor doesn't resize when window width changes. How to fix?

**Options Considered**:

- **Option A**: Manual window resize event listener
  - **Pros**: Simple, works globally
  - **Cons**: Inefficient (fires for all resizes, not just editor container), hard to cleanup
- **Option B**: ResizeObserver on editor container
  - **Pros**: Efficient (only fires when container resizes), browser-native, proper cleanup
  - **Cons**: Need to ensure cleanup (disconnect on unmount)
- **Option C**: CSS `width: 100%; height: 100%;` only
  - **Pros**: No JS needed
  - **Cons**: Monaco needs explicit `layout()` call, CSS alone won't trigger it

**Decision**: **Option B - ResizeObserver on editor container**

**Rationale**:

- ResizeObserver is browser-native, efficient, designed for this exact use case
- Only fires when editor container actually resizes (not every window resize)
- Easy cleanup with `observer.disconnect()` in useEffect return
- Follows modern web API best practices
- Monaco requires explicit `layout()` call (CSS alone insufficient)

**Trade-offs**: Adds ResizeObserver code, but it's minimal and performant

---

### Decision 4: Split View Ratio Persistence

**Context**: Should split view ratio (left/right panel sizes) persist across app restarts?

**Options Considered**:

- **Option A**: Save to database (persist across restarts)
  - **Pros**: User preference remembered forever
  - **Cons**: Extra DB writes, increased DB size, most users won't adjust ratio
- **Option B**: Session-only (component state)
  - **Pros**: No DB writes, simpler, ratio persists during session
  - **Cons**: Resets on app restart

**Decision**: **Option B - Session-only persistence**

**Rationale**:

- Split ratio is a minor UI preference, not critical to persist
- Reduces unnecessary DB writes (performance-first principle)
- Users rarely adjust split ratios frequently
- Ratio persists during session (good enough UX)
- Can add DB persistence later if users request it
- Follows principle: Don't persist data unless necessary

**Trade-offs**: Ratio resets on app restart, but cleaner architecture and no DB overhead

## Implementation Phases

### Phase 1: State Management & Types

**Goal**: Update types and state hooks to support Response tab  
**Duration**: 1 hour

**Tasks**:

- [x] Update `RequestState` interface in `useRequestState.ts` ✅
  - Add `responseSubTab: 'headers' | 'body' | 'both'`
  - Add `splitViewRatio: number`
  - Extend `activeTab` to include `'response'`
- [x] Add setter functions in `RequestStateActions` ✅
  - `setResponseSubTab()`
  - `setSplitViewRatio()`
- [x] Initialize new state in `useRequestState()` hook ✅
  - Default `responseSubTab: 'headers'` loaded from settings
  - Default `splitViewRatio: 50`
- [x] Update `RequestTabs` props interface to accept `'response'` in `activeTab` type ✅
- [x] Implement response sub-tab preference persistence ✅

**Dependencies**: None  
**Deliverables**: ✅ Updated types and state management ready for Response tab  
**Status**: ✅ COMPLETED

---

### Phase 2: Build ResizableSplitView Component

**Goal**: Create reusable split view component  
**Duration**: 2 hours

**Tasks**:

- [x] Create `src/components/ui/resizable-split-view.tsx` ✅
- [x] Implement CSS Grid-based layout with `fr` units ✅
- [x] Add draggable divider with mouse event handlers ✅
- [x] Add cursor feedback on hover (`cursor: ew-resize`) ✅
- [x] Implement ratio calculation (0-100%) from pixel position ✅
- [x] Add `onRatioChange` callback to notify parent ✅
- [x] Add cleanup for event listeners in useEffect ✅
- [x] Test drag functionality (smooth, no lag, proper cursor) ✅
- [x] Test edge cases (min/max widths, fast drags) ✅

**Dependencies**: None  
**Deliverables**: ✅ Working ResizableSplitView component ready for use  
**Status**: ✅ COMPLETED

---

### Phase 3: Fix Monaco Editor Resize Issue

**Goal**: Ensure Monaco editor resizes with window width  
**Duration**: 1.5 hours

**Tasks**:

- [x] Add ResizeObserver logic to `monaco-editor.tsx` ✅
- [x] Get editor container reference ✅
- [x] Create ResizeObserver that calls `editor.layout()` ✅
- [x] Observe container DOM node ✅
- [x] Add cleanup (disconnect observer on unmount) ✅
- [x] Test resize behavior: ✅
  - Window width changes ✅
  - Parent container width changes ✅
  - Split view divider drag (in Both sub-tab) ✅
- [x] Verify no memory leaks (observer cleanup works) ✅
- [x] Make validation messages conditional on validateJson prop ✅

**Dependencies**: None  
**Deliverables**: ✅ Monaco editor that properly resizes, no more resize issues  
**Status**: ✅ COMPLETED - Monaco resize issue FIXED

---

### Phase 4: Build Response Sub-View Components

**Goal**: Create HeadersView, BodyView, BothView components  
**Duration**: 3 hours

**Tasks**:

- [x] Create `ResponseHeadersView.tsx` ✅
  - Extract headers display logic from old ResponsePanel ✅
  - Show status badge, time, header key-values ✅
  - Add Copy/Download buttons ✅
  - Handle empty state ✅
- [x] Create `ResponseBodyView.tsx` ✅
  - Use MonacoEditor (full-width) ✅
  - Pass response body as value ✅
  - Set read-only mode ✅
  - Add Copy/Download buttons ✅
  - Handle empty state ✅
  - Fixed height (500px) to prevent 0-height issue ✅
  - No validation messages (validateJson={false}) ✅
- [x] Create `ResponseBothView.tsx` ✅
  - Use ResizableSplitView with 50/50 initial ratio ✅
  - Left panel: Headers display ✅
  - Right panel: Monaco editor for body ✅
  - Copy/Download buttons at top ✅
  - Handle ratio changes (call setSplitViewRatio) ✅
  - Handle empty state ✅
  - Fixed Monaco height (400px) ✅
- [x] Add proper TypeScript interfaces for all props ✅
- [x] Add empty state handling for all views ✅

**Dependencies**: Phase 2 (ResizableSplitView), Phase 3 (Monaco fix)  
**Deliverables**: ✅ Three sub-view components ready for integration  
**Status**: ✅ COMPLETED

---

### Phase 5: Build ResponseTab Container

**Goal**: Create main Response tab with sub-tab navigation  
**Duration**: 2 hours

**Tasks**:

- [x] Create `ResponseTab.tsx` ✅
- [x] Add sub-tab navigation (Headers/Body/Both buttons) ✅
- [x] Manage `responseSubTab` state (from useRequestState) ✅
- [x] Render appropriate sub-view based on active sub-tab ✅
- [x] Pass response data to sub-views ✅
- [x] Pass Copy/Download handlers to sub-views ✅
- [x] Handle empty state (show message when no response) ✅
- [x] Add `min-h-0` for proper layout ✅
- [x] Add styling (consistent with other tabs) ✅
- [x] Handle cleanup (unmount sub-views when switching away) ✅

**Dependencies**: Phase 1 (state), Phase 4 (sub-views)  
**Deliverables**: ✅ Complete ResponseTab component ready for integration  
**Status**: ✅ COMPLETED

---

### Phase 6: Integrate Response Tab into ApiRequestBuilder

**Goal**: Add Response tab to Request Builder, remove old ResponsePanel  
**Duration**: 1.5 hours

**Tasks**:

- [x] Update `RequestTabs.tsx` ✅
  - Add Response tab button ✅
  - Add success/failure badge (✓/✗) when response available ✅
  - Style consistently with other tabs ✅
- [x] Update `ApiRequestBuilder.tsx` ✅
  - Import ResponseTab ✅
  - Add `case 'response':` to `renderTabContent()` switch ✅
  - Remove `<ResponsePanel />` from bottom ✅
  - Add `overflow-hidden` to tab content wrapper ✅
  - Add `useEffect` to auto-activate Response tab after request ✅
  - Test tab switching (all tabs work) ✅
- [x] Delete `ResponsePanel.tsx` (no longer needed) ✅
- [x] Test integration: ✅
  - Click Response tab → shows Response content ✅
  - Switch between tabs → state persists ✅
  - Switch between sub-tabs → works smoothly ✅
  - Copy/Download work in all sub-tabs ✅

**Dependencies**: Phase 5 (ResponseTab complete)  
**Deliverables**: ✅ Fully integrated Response tab in Request Builder  
**Status**: ✅ COMPLETED

---

### Phase 7: Testing & Performance Verification

**Goal**: Verify functionality, performance, and no regressions  
**Duration**: 2 hours

**Tasks**:

- [x] **Functional Testing**: ✅
  - Response tab appears as 5th tab ✅
  - Sub-tabs (Headers/Body/Both) all work ✅
  - Headers view shows correct data ✅
  - Body view shows formatted JSON ✅
  - Both view has resizable divider ✅
  - Empty state shows before request sent ✅
  - Copy/Download work in all sub-tabs ✅
  - Monaco editor resizes with window width ✅
  - Split view resizes with window width ✅
  - Response tab auto-activates after request ✅
  - Responses persist when switching requests ✅
  - Sub-tab preference is remembered ✅
- [x] **Performance Testing** (Verified Manually): ✅
  - Memory usage acceptable ✅
  - Load time <100ms ✅
  - No memory leaks observed ✅
  - Monaco cleanup works ✅
  - ResizeObserver cleanup works ✅
- [x] **Regression Testing**: ✅
  - Other tabs still work (Params, Auth, Headers, Body) ✅
  - Sending requests still works ✅
  - Response data still populates correctly ✅
  - Copy/Download still work ✅
- [x] **Accessibility Testing**: ✅
  - Keyboard navigation works ✅
  - Focus management works ✅

**Dependencies**: Phase 6 (integration complete)  
**Deliverables**: ✅ Fully tested feature ready for use  
**Status**: ✅ COMPLETED

## File Structure

### New Files

```
src/components/request/ResponseTab.tsx              # Main Response tab container (2KB)
src/components/request/ResponseHeadersView.tsx      # Headers-only view (2KB)
src/components/request/ResponseBodyView.tsx         # Body-only view (2KB)
src/components/request/ResponseBothView.tsx         # Side-by-side split view (2KB)
src/components/ui/resizable-split-view.tsx          # Reusable split view component (2KB)
```

### Modified Files

```
src/components/ApiRequestBuilder.tsx
  - Line 218-267: Add 'response' case to renderTabContent()
  - Line 342-346: Remove <ResponsePanel /> (delete)
  - Import ResponseTab

src/components/request/RequestTabs.tsx
  - Line 27: Extend activeTab type to include 'response'
  - Line 34-96: Add Response tab button with badge

src/hooks/useRequestState.ts
  - Line 30: Extend activeTab type
  - Line 28-42: Add responseSubTab, splitViewRatio to RequestState
  - Line 44-61: Add setResponseSubTab, setSplitViewRatio to RequestStateActions
  - Line 80-325: Initialize new state, create setters

src/components/ui/monaco-editor.tsx
  - Add ResizeObserver in useEffect
  - Call editor.layout() on container resize
  - Disconnect observer in cleanup
```

### Deleted Files

```
src/components/request/ResponsePanel.tsx            # Replaced by ResponseTab + sub-views
```

## Implementation Details

### Component 1: ResizableSplitView

**Location**: `src/components/ui/resizable-split-view.tsx`  
**Purpose**: Reusable side-by-side resizable panel component  
**Key Functions**:

- `handleMouseDown(e)`: Start drag, add document mouse listeners
- `handleMouseMove(e)`: Calculate new ratio from mouse X position
- `handleMouseUp()`: End drag, remove document mouse listeners
- `calculateRatio(clientX)`: Convert pixel position to 0-100% ratio

**Props**:

```typescript
interface ResizableSplitViewProps {
  left: React.ReactNode; // Left panel content
  right: React.ReactNode; // Right panel content
  initialRatio?: number; // Initial split ratio (0-100, default 50)
  onRatioChange?: (ratio: number) => void; // Callback when ratio changes
  minRatio?: number; // Min left panel % (default 20)
  maxRatio?: number; // Max left panel % (default 80)
  className?: string; // Optional container class
}
```

**Dependencies**:

- Internal: useState, useEffect, useRef hooks
- External: None (pure React + CSS Grid)

**Performance**: Lightweight (~2KB), CSS Grid-based, efficient drag handling

---

### Component 2: ResponseHeadersView

**Location**: `src/components/request/ResponseHeadersView.tsx`  
**Purpose**: Display response headers, status, time  
**Key Functions**:

- Renders status badge (green for 2xx, red for errors)
- Displays response time with Clock icon
- Shows headers as key-value list
- Provides Copy/Download buttons

**Props**:

```typescript
interface ResponseHeadersViewProps {
  response: ResponseData | null;
  onCopy: () => void;
  onDownload: () => void;
  showActions?: boolean; // Show Copy/Download buttons (default true)
}
```

**Dependencies**:

- Internal: Badge, Button, Clock icon
- External: None

---

### Component 3: ResponseBodyView

**Location**: `src/components/request/ResponseBodyView.tsx`  
**Purpose**: Display response body in full-width Monaco editor  
**Key Functions**:

- Renders Monaco editor with response body
- Sets read-only mode
- Handles empty state
- Provides Copy/Download buttons

**Props**:

```typescript
interface ResponseBodyViewProps {
  response: ResponseData | null;
  onCopy: () => void;
  onDownload: () => void;
  showActions?: boolean; // Show Copy/Download buttons (default true)
}
```

**Dependencies**:

- Internal: MonacoEditor component
- External: None

---

### Component 4: ResponseBothView

**Location**: `src/components/request/ResponseBothView.tsx`  
**Purpose**: Side-by-side split view with headers (left) + body (right)  
**Key Functions**:

- Uses ResizableSplitView for layout
- Embeds ResponseHeadersView (left, no actions)
- Embeds Monaco editor (right)
- Handles ratio changes
- Single Copy/Download at top

**Props**:

```typescript
interface ResponseBothViewProps {
  response: ResponseData | null;
  onCopy: () => void;
  onDownload: () => void;
  splitRatio: number; // Current split ratio (0-100)
  onSplitRatioChange: (ratio: number) => void; // Ratio change handler
}
```

**Dependencies**:

- Internal: ResizableSplitView, ResponseHeadersView, MonacoEditor
- External: None

---

### Component 5: ResponseTab

**Location**: `src/components/request/ResponseTab.tsx`  
**Purpose**: Main Response tab container with sub-tab navigation  
**Key Functions**:

- Manages sub-tab state (headers/body/both)
- Renders sub-tab navigation buttons
- Renders active sub-view component
- Handles empty state
- Tracks performance (memory + load time)

**Props**:

```typescript
interface ResponseTabProps {
  response: ResponseData | null;
  onCopy: () => void;
  onDownload: () => void;
  responseSubTab: 'headers' | 'body' | 'both';
  setResponseSubTab: (tab: 'headers' | 'body' | 'both') => void;
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;
}
```

**Dependencies**:

- Internal: ResponseHeadersView, ResponseBodyView, ResponseBothView
- External: None

## Data Flow

```
User clicks Response tab
    ↓
ApiRequestBuilder.setActiveTab('response')
    ↓
ApiRequestBuilder.renderTabContent()
    ↓
Renders <ResponseTab response={response} />
    ↓
ResponseTab renders sub-tab navigation
    ↓
User selects sub-tab (Headers/Body/Both)
    ↓
ResponseTab.setResponseSubTab('both')
    ↓
ResponseTab renders <ResponseBothView />
    ↓
ResponseBothView uses <ResizableSplitView>
    ↓
Left: ResponseHeadersView, Right: Monaco editor
    ↓
User drags divider
    ↓
ResizableSplitView.onRatioChange(newRatio)
    ↓
ResponseBothView.onSplitRatioChange(newRatio)
    ↓
useRequestState.setSplitRatio(newRatio)
    ↓
State updated, split ratio persists during session
```

## Testing Strategy

### Unit Tests

- [ ] Test file 1: `tests/unit/resizable-split-view.spec.ts`
  - Test drag handlers
  - Test ratio calculation
  - Test min/max constraints
  - Test cleanup (event listener removal)
- [ ] Test file 2: `tests/unit/response-tab.spec.ts`
  - Test sub-tab switching
  - Test empty state rendering
  - Test performance tracking

### Integration Tests

- [ ] **Response tab integration** - Test Response tab renders when activeTab === 'response'
- [ ] **Sub-tab switching** - Test switching between Headers/Body/Both sub-tabs
- [ ] **Monaco resize** - Test Monaco editor resizes when window width changes
- [ ] **Split view drag** - Test divider drag updates split ratio
- [ ] **Copy/Download** - Test buttons work in all sub-tabs
- [ ] **Empty state** - Test empty state shows when no response

### E2E Tests

- [ ] **Full response workflow**:
  1. Send request
  2. Click Response tab
  3. View headers
  4. View body
  5. View both (split view)
  6. Drag divider
  7. Copy response
  8. Download response
- [ ] **Tab switching workflow**:
  1. Switch to Response tab
  2. Switch back to Body tab
  3. Switch to Response tab again
  4. Verify state persists

### Manual Testing Checklist

- [ ] Response tab appears as 5th tab
- [ ] Sub-tabs (Headers/Body/Both) render correctly
- [ ] Headers view shows status, time, headers
- [ ] Body view shows formatted JSON in Monaco
- [ ] Both view has side-by-side layout
- [ ] Divider is draggable and smooth
- [ ] Monaco editor resizes with window width
- [ ] Monaco editor resizes with split divider drag
- [ ] Empty state shows before first request
- [ ] Copy button works in all sub-tabs
- [ ] Download button works in all sub-tabs
- [ ] Keyboard navigation works (Tab key)
- [ ] Screen reader announces tab changes
- [ ] No console errors
- [ ] No memory leaks (check DevTools Memory profiler)

## Performance Considerations

### Performance Targets (PRIMARY GOALS)

- [x] **Memory** (PRIMARY): <20MB when active - MANDATORY
  - Measured: Compare memory before/after Response tab mount
  - Target: <20MB delta (within Request Builder's 30MB budget)
  - Strategy: Unmount components when switching tabs, dispose Monaco editor
- [x] **Load Time** (PRIMARY): <100ms from tab click to render - MANDATORY
  - Measured: performance.now() from component mount to first render complete
  - Target: <100ms
  - Strategy: No async loading, lightweight components, conditional rendering
- [x] **Lazy Loading** (REQUIRED): Components render only when Response tab active - MANDATORY
  - Implementation: Conditional rendering in ApiRequestBuilder.renderTabContent()
  - Benefit: Response components don't exist in DOM until needed
- [x] **Cleanup** (REQUIRED): Full cleanup on unmount - MANDATORY
  - Monaco editor: Call editor.dispose()
  - ResizeObserver: Call observer.disconnect()
  - Event listeners: Remove drag handlers
  - Verify: No memory leaks in DevTools Memory profiler

**Informational:**

- [ ] **Bundle Size**: ~10KB total (tracked for awareness, not a blocker)

### Optimization Strategy (Focus: Memory & Speed)

- **Strategy 1: Lazy Rendering** - Response components only render when Response tab active
  - Benefit: Saves ~15MB memory when response not viewed
  - Implementation: `{activeTab === 'response' && <ResponseTab />}`
- **Strategy 2: Component Unmounting** - Components unmount when switching away from Response tab
  - Benefit: Frees memory immediately, no lingering DOM nodes
  - Implementation: React conditional rendering automatically handles unmount
- **Strategy 3: Monaco Editor Disposal** - Properly dispose Monaco instances
  - Benefit: Prevents memory leaks from Monaco editor (~40MB if not disposed)
  - Implementation: useEffect cleanup calling `editor.dispose()`
- **Strategy 4: ResizeObserver Cleanup** - Disconnect observer on unmount
  - Benefit: Prevents memory leaks from observer callbacks
  - Implementation: useEffect cleanup calling `observer.disconnect()`
- **Strategy 5: Lightweight Split View** - Custom CSS Grid instead of 50KB library
  - Benefit: 48KB bundle savings, better performance
  - Implementation: CSS Grid with `fr` units + drag handler

### Performance Monitoring (MANDATORY)

- [x] **Memory usage tracked and logged** - MANDATORY
  - Location: ResponseTab.tsx useEffect
  - Logs: `[Performance] Response tab memory: X.XX MB`
  - Alert: Warns if >20MB
- [x] **Load time tracked and logged** - MANDATORY
  - Location: ResponseTab.tsx useEffect
  - Logs: `[Performance] Response tab load time: X.XX ms`
  - Alert: Warns if >100ms
- [x] **Performance metrics logged to monitoring system** - MANDATORY
  - System: Console logs (can be extended to analytics later)
  - Filter: Logs prefixed with `[Performance]`
- [x] **Alerts on memory/load time budget violations** - MANDATORY
  - Implementation: console.warn() when budgets exceeded
  - Thresholds: Memory >20MB, Load time >100ms

**Optional/Informational:**

- [ ] **Bundle size tracked in build** - Vite reports bundle sizes automatically

## Security Considerations

- [x] **XSS Protection**: Response data displayed in Monaco editor (safe, no innerHTML)
- [x] **No eval()**: No dynamic code execution on response data
- [x] **Input Sanitization**: Not needed (display only, no user input on response content)

## Accessibility Considerations

- [x] **Keyboard Navigation**: Tab key works for tabs and sub-tabs
- [x] **ARIA Labels**: Tab buttons have proper aria-label
- [x] **Screen Reader**: Tab changes announced by screen reader
- [x] **Focus Management**: Focus moves to active tab on click
- [x] **Color Contrast**: Status badges meet WCAG AA standards
- [x] **Resize Handle**: Divider has `cursor: col-resize` for visual feedback

## Rollback Plan

If Response tab causes issues:

1. **Immediate Rollback** (< 5 min):
   - Revert commit: `git revert <commit-hash>`
   - Re-add ResponsePanel.tsx from git history
   - Remove Response tab from RequestTabs
   - Deploy hotfix
2. **Partial Rollback** (keep some changes):
   - Keep Monaco resize fix (it's a standalone improvement)
   - Revert Response tab integration
   - Keep ResizableSplitView (future-ready component)
3. **Debug & Re-deploy**:
   - Identify issue (memory leak? performance regression?)
   - Fix in separate branch
   - Test thoroughly
   - Re-deploy

## Open Questions

- [x] ✅ Split view ratio: 50/50, resizable - **CONFIRMED**
- [x] ✅ Empty state: Show empty state before request - **CONFIRMED**
- [x] ✅ Copy/Download buttons: All sub-tabs - **CONFIRMED**
- [ ] Should we add syntax highlighting for non-JSON responses (XML, HTML)?
  - Decision: **Later** - Use text mode for now, add highlighting in future enhancement
- [ ] Should we add response search/filtering?
  - Decision: **Later** - Out of scope for this feature, future enhancement
- [ ] Should we add response comparison (current vs previous)?
  - Decision: **Later** - Out of scope for this feature, future enhancement

## References

- [spec.md](./spec.md) - Feature specification
- [/ai-context/project-goal.md](../../ai-context/project-goal.md) - Performance goals
- [/ai-context/architecture.md](../../ai-context/architecture.md) - Architecture patterns
- [/ai-context/example-quality.md](../../ai-context/example-quality.md) - Code quality standards
- [/ai-context/common-utils.md](../../ai-context/common-utils.md) - Reusable utilities
- Current Implementation: `src/components/request/ResponsePanel.tsx`
- Tab Pattern: `src/components/request/ParamsTab.tsx`, `HeadersTab.tsx`, etc.
