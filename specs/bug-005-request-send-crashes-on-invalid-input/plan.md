# Implementation Plan: request-send-crashes-on-invalid-input (Bug Fix)

**Feature ID**: `bug-005-request-send-crashes-on-invalid-input`  
**Status**: `in-progress`  
**Related Spec**: `specs/bug-005-request-send-crashes-on-invalid-input/spec.md`

## Overview

Renderer: handle IPC result shape properly, map success responses to `ResponseData`, and avoid setting invalid objects as responses. Sanitize headers to drop empty/invalid keys before sending.  
Main IPC handler: sanitize headers defensively and append query params to the resolved URL string.

## Existing Code Analysis

> **Note**: Reference the "Existing Code to Leverage" section in spec.md for initial analysis.

### Components to Reuse
- `src/components/request/ResponseTab.tsx` and subviews already expect `ResponseData`

### Hooks to Reuse
- `src/hooks/useRequestActions.ts` is the integration point for mapping IPC result → `ResponseData`

### Utilities to Reuse
- None required beyond existing utils

### Types to Extend
- `electron/preload.ts` `RequestOptions` to include `environmentId` and `queryParams`

### Services to Reuse
- `electron/services/api.ts` transport

### Integration Points
- **Hook**: `src/hooks/useRequestActions.ts` - map IPC result and sanitize headers
- **IPC**: `electron/ipc/handlers.ts` - sanitize headers; append query params

### New Components Needed
- [ ] New Component 1: `src/components/path/to/new-component.tsx` - [Why existing ones can't be used]

## Goal Alignment Check

**Does this plan support the long-term project goal? (Performance-first, low memory)**
- [x] Yes - Prevents crashes and reduces wasteful re-renders

**Are there more reusable or cleaner ways to achieve the same?**
- Considered changing IPC output shape; rejected due to existing tests. Renderer mapping is safer.

**Architecture Compliance:**
- [x] Follows architecture.md patterns (typed preload, IPC contracts)
- [x] Uses existing services/utilities
- [x] No architecture violations

## Performance Implementation Plan

### Lazy Loading Strategy (REQUIRED)
- N/A (bug fix within existing flows)

### Code Splitting Plan (Supports Lazy Loading)
- N/A

### Bundle Size (INFORMATIONAL - Not Primary)
- No change

### Memory Management Plan
- No new allocations; no additional cleanup needed

### Performance Tracking Implementation (MANDATORY)
- Existing Response tab logs are sufficient

**Optional/Informational:**
- N/A

### Performance Budget Verification (PRIMARY GOALS)
- **Memory**: <50MB delta - ✅
- **Load Time**: <200ms mapping - ✅

**Informational:**
- **Bundle Size**: [Estimated: ___ KB] [Tracked for awareness, not a blocker]

## Files to Modify/Create (with WHY)

### New Files
- None

### Modified Files
- `src/hooks/useRequestActions.ts` - Map result to `ResponseData`, handle errors; sanitize headers
- `electron/ipc/handlers.ts` - Sanitize headers defensively; append query params
- `electron/preload.ts` - Extend `RequestOptions` typing
- `tests/integration/ipc-handlers/request-handlers.spec.ts` - Add regression test

## Architecture Decisions

### Decision: Keep IPC return shape; map in renderer
**Context**: Tests rely on `{ success, data, status, ... }`  
**Options Considered**:
- Change IPC shape vs. map in renderer
**Decision**: Map in renderer  
**Rationale**: Preserve test compatibility; minimal change  
**Trade-offs**: Slight duplication (mapping)

## Implementation Phases

### Phase 1: Tests First
**Goal**: Reproduce failure with empty header at IPC layer  
**Duration**: 0.5 day

**Tasks**:
- [ ] Add test: request:send ignores empty header keys and succeeds

**Dependencies**: None  
**Deliverables**: Failing test

### Phase 2: Fixes
**Goal**: Implement renderer mapping, sanitize headers, append query params  
**Duration**: 0.5 day

**Tasks**:
- [ ] Update `useRequestActions.ts`
- [ ] Update `electron/ipc/handlers.ts`
- [ ] Update `electron/preload.ts`
- [ ] Make tests pass

**Dependencies**: Phase 1  
**Deliverables**: All tests green

## File Structure

### New/Modified/Deleted Files
```
src/hooks/useRequestActions.ts                  # modified
electron/ipc/handlers.ts                        # modified
electron/preload.ts                             # modified
tests/integration/ipc-handlers/request-handlers.spec.ts # modified
```

## Implementation Details

### Component 1: [Name]
**Location**: `path/to/component`  
**Purpose**: [What it does]  
**Key Functions**:
- `function1()`: [Description]
- `function2()`: [Description]

**Dependencies**:
- Internal: [Other components/modules]
- External: [Libraries, APIs]

### Component 2: [Name]
[Same structure as Component 1]

## Data Flow

[Describe how data flows through the system for this feature]

```
User Action → Component A → Service B → Database
                ↓
            Component C
```

## Testing Strategy

### Unit Tests
- N/A

### Integration Tests
- [x] IPC handler: empty header ignored, returns success
- [ ] Optional renderer e2e (not required)

### E2E Tests
- N/A

### Manual Testing Checklist
- [ ] Test case 1
- [ ] Test case 2
- [ ] Test case 3

## Migration & Rollout

### Database Migrations
- None

### Feature Flags
- None

### Rollout Plan
1. Land tests
2. Implement fixes
3. Run full suite

## Performance Considerations

### Performance Targets (PRIMARY GOALS)
- [x] **Memory** (PRIMARY): <50MB when active
- [x] **Load Time** (PRIMARY): <200ms
- [x] **Lazy Loading** (REQUIRED): N/A
- [x] **Cleanup** (REQUIRED): N/A

**Informational:**
- [ ] **Bundle Size**: Tracked in build (for awareness, not a blocker)

### Optimization Strategy (Focus: Memory & Speed)
- Avoid setting invalid response objects to state
- Minimal work in hot paths

### Performance Monitoring (MANDATORY)
- [x] Memory/load time logging already present in Response tab

**Optional/Informational:**
- [ ] Bundle size tracked in build (for awareness)

## Security Considerations

- Sanitize headers to avoid invalid/injected header names

## Accessibility Considerations

- No UI control changes

## Rollback Plan

- Revert changes in renderer and IPC handler

## Open Questions

- None

## References

- `specs/bug-005-request-send-crashes-on-invalid-input/spec.md`

