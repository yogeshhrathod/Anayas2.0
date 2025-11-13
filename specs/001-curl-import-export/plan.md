# Implementation Plan: cURL Import/Export

**Feature ID**: `001-curl-import-export`  
**Status**: `completed`  
**Related Spec**: [spec.md](./spec.md)

## Overview

Implement cURL import/export functionality by creating parser and generator utilities, adding IPC handlers, and building UI components for importing and exporting requests as cURL commands.

## Architecture Decisions

### Decision 1: Parser Library vs Custom Implementation
**Context**: Need to parse cURL commands reliably with support for various flags and formats  
**Options Considered**:
- Option A: Use npm library (curl-to-json, curlconverter) - Pros: Less code, community maintained. Cons: Dependency, potential compatibility issues
- Option B: Custom parser - Pros: Full control, no dependencies. Cons: More code to maintain

**Decision**: Evaluate libraries first, fallback to custom parser if needed  
**Rationale**: Prefer stable library to reduce maintenance, but custom parser ensures full control  
**Trade-offs**: Library may have limitations, custom parser requires more testing

### Decision 2: Generator Implementation
**Context**: Need to generate valid cURL commands from Request objects  
**Options Considered**:
- Option A: Use library - Pros: Consistent output. Cons: May not match our exact needs
- Option B: Custom generator - Pros: Full control, readable output. Cons: More code

**Decision**: Custom generator  
**Rationale**: Need specific formatting (multi-line, readable) and full control over escaping  
**Trade-offs**: More code to maintain, but ensures output quality

## Implementation Phases

### Phase 1: Core Utilities
**Goal**: Create parser and generator utilities  
**Duration**: 1 day

**Tasks**:
- [x] Research and evaluate cURL parsing libraries
- [x] Create curl-parser.ts utility
- [x] Create curl-generator.ts utility
- [x] Add comprehensive error handling

**Dependencies**: None  
**Deliverables**: Parser and generator utilities with tests

### Phase 2: IPC Integration
**Goal**: Expose parser and generator via IPC  
**Duration**: 0.5 days

**Tasks**:
- [x] Add IPC handlers in handlers.ts
- [x] Expose APIs in preload.ts
- [x] Test IPC communication

**Dependencies**: Phase 1  
**Deliverables**: Working IPC handlers and preload APIs

### Phase 3: UI Components
**Goal**: Build import/export UI  
**Duration**: 1 day

**Tasks**:
- [x] Add Copy as cURL button to RequestHeader
- [x] Create CurlImportDialog component
- [x] Add import options to Collections page
- [x] Add error handling and validation UI

**Dependencies**: Phase 2  
**Deliverables**: Complete UI for import/export

### Phase 4: Testing & Polish
**Goal**: Test and refine implementation  
**Duration**: 0.5 days

**Tasks**:
- [x] Test with various cURL formats
- [x] Test edge cases and error scenarios
- [x] Test bulk import
- [x] Polish UI and error messages

**Dependencies**: Phase 3  
**Deliverables**: Fully tested and polished feature

## File Structure

### New Files
```
src/lib/curl-parser.ts
src/lib/curl-generator.ts
src/components/curl/CurlImportDialog.tsx
```

### Modified Files
```
electron/ipc/handlers.ts
  - Add curl:parse handler
  - Add curl:generate handler
  - Add curl:import-bulk handler

electron/preload.ts
  - Add electronAPI.curl namespace with parse, generate, importBulk

src/components/request/RequestHeader.tsx
  - Add Copy as cURL button next to Send button

src/pages/Collections.tsx
  - Add Import cURL button/menu item
```

## Implementation Details

### Component 1: curl-parser.ts
**Location**: `src/lib/curl-parser.ts`  
**Purpose**: Parse cURL command strings into Request objects  
**Key Functions**:
- `parseCurlCommand(command: string): Request` - Main parsing function
- `parseMethod(args: string[]): string` - Extract HTTP method
- `parseUrl(args: string[]): string` - Extract and parse URL
- `parseHeaders(args: string[]): Record<string, string>` - Extract headers
- `parseData(args: string[]): string` - Extract request body
- `parseAuth(args: string[]): AuthConfig` - Extract authentication

**Dependencies**:
- Internal: Request types from `src/types/entities.ts`
- External: None (or npm library if chosen)

### Component 2: curl-generator.ts
**Location**: `src/lib/curl-generator.ts`  
**Purpose**: Generate cURL commands from Request objects  
**Key Functions**:
- `generateCurlCommand(request: Request): string` - Main generation function
- `escapeShellString(str: string): string` - Escape special characters
- `formatHeaders(headers: Record<string, string>): string[]` - Format header flags
- `formatBody(body: string, contentType?: string): string` - Format body data
- `formatAuth(auth: AuthConfig): string[]` - Format auth flags

**Dependencies**:
- Internal: Request types from `src/types/entities.ts`
- External: None

### Component 3: CurlImportDialog
**Location**: `src/components/curl/CurlImportDialog.tsx`  
**Purpose**: Dialog for importing cURL commands  
**Key Functions**:
- Textarea for pasting cURL commands
- File upload for importing from file
- Preview of parsed request
- Save to collection/folder options
- Bulk import support

**Dependencies**:
- Internal: Dialog component, Request types, IPC APIs
- External: shadcn/ui components

## Data Flow

### Import Flow
```
User pastes cURL → CurlImportDialog → electronAPI.curl.parse()
  → IPC handler → curl-parser.ts → Returns Request object
  → Preview in dialog → User confirms → Save to collection
```

### Export Flow
```
User clicks Copy → RequestHeader → electronAPI.curl.generate()
  → IPC handler → curl-generator.ts → Returns cURL string
  → Copy to clipboard → Show success toast
```

## Testing Strategy

### Unit Tests
- [x] Test parser with various cURL formats
- [x] Test generator with all request types
- [x] Test edge cases (special chars, multi-line, etc.)

### Integration Tests
- [x] Test IPC handlers
- [x] Test end-to-end import flow
- [x] Test end-to-end export flow

### Manual Testing Checklist
- [x] Import simple GET request
- [x] Import POST with JSON body
- [x] Import with Bearer auth
- [x] Import with Basic auth
- [x] Import with API key
- [x] Export GET request
- [x] Export POST request
- [x] Export with all auth types
- [x] Bulk import multiple commands
- [x] Error handling for invalid commands

## Performance Considerations

- [x] Parser should complete in <100ms for typical commands
- [x] Generator should complete in <50ms
- [x] Bulk import should process 10+ commands without blocking UI

## Security Considerations

- [x] Validate and sanitize parsed input
- [x] Prevent command injection in generated commands
- [x] Handle malicious or malformed cURL commands gracefully

## Accessibility Considerations

- [x] Keyboard navigation in import dialog
- [x] Screen reader support for buttons and dialogs
- [x] Clear error messages

## Rollback Plan

If issues arise:
1. Disable feature via feature flag (if implemented)
2. Remove UI buttons/menu items
3. Keep utilities for future use

## Open Questions

- [x] Which cURL parsing library to use (if any)?
- [x] Should we support file uploads in cURL parser? (Out of scope for now)

## References

- [spec.md](./spec.md)
- [plan-timeline.md](../../plan-timeline.md)
