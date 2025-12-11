# Feature Specification: Postman Collection Import

**Status**: `in-progress`  
**Feature ID**: `014-postman-collection-import`  
**Created**: 2025-12-11  
**Last Updated**: 2025-12-11  
**Owner**: Development Team  
**Phase**: Phase 3: Import/Export & Interoperability (plan-timeline.md)

## Overview

Enable users to import complete Postman collections (both v1 and v2.x formats) into Anayas, preserving the full hierarchy of folders, requests, environments, and metadata. This feature uses an extensible design pattern to support future import formats (Insomnia, OpenAPI, HAR, etc.).

## Goal Alignment Summary

**How this feature supports the performance-first project goal:**

- **Lazy-loaded parser**: Import parsers are loaded on-demand, not bundled with initial load
- **Streaming for large files**: Large collections parsed incrementally to avoid memory spikes
- **Worker thread processing**: Heavy parsing offloaded to prevent UI blocking
- **Clean architecture**: Strategy pattern allows adding new formats without modifying core code

**Success Criteria:**

- Import 1000+ request collection in <5 seconds
- Memory usage during import <100MB for large collections
- Parse time <100ms for typical collections (<100 requests)
- Load time for import feature <200ms

**Constraints:**

- Feature must be lazy-loaded (not loaded upfront)
- Parser must clean up after import (no memory leaks)
- Must support both Postman v1 (legacy) and v2.x (current) formats
- Extensible for future import formats

**Unclear Points (to confirm):**

- Should we support Postman Collection v2.0 separately from v2.1? (Answer: Yes, both supported)
- Should environments be imported as collection-level or global? (Answer: User choice)
- Should we preserve Postman test scripts? (Answer: Out of scope for MVP)

## Performance Impact Analysis (MANDATORY)

### Memory Impact

- **Estimated Memory Footprint**: 30-50MB (for large imports with 1000+ requests)
- **Memory Budget**: <100MB during import operation
- **Memory Cleanup Strategy**:
  - Parser instances cleaned up immediately after import
  - Parsed data passed to database incrementally for large imports
  - File handles released after reading

### Load Time Impact (PRIMARY)

- **Estimated Load Time**: <200ms for import dialog
- **Initialization Strategy**:
  - Import button visible immediately
  - Parser loaded only when import triggered
  - Format detection runs on file selection
- **Performance Tracking**: Log import time by collection size

### Lazy Loading Strategy (REQUIRED)

- **How feature loads on-demand**: Import dialog and parsers loaded only when user clicks "Import Collection"
- **Code Splitting Plan**:
  - `ImportDialog` component in separate chunk
  - Each format parser in its own chunk (enables future formats without bloating)
- **Trigger**: User clicks "Import Collection" button in sidebar or collections menu

### Bundle Size Impact (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: ~50KB for parsers (excluding dependencies)

### Performance Monitoring (PRIMARY)

- [x] Memory usage will be tracked (before/after feature load) - MANDATORY
- [x] Load time will be measured and logged - MANDATORY
- [x] Performance metrics will be logged to monitoring system - MANDATORY

## Goals

- [x] Import complete Postman collections preserving full hierarchy
- [x] Support both Postman Collection v1 and v2.x formats
- [x] Extensible architecture for future import formats (Insomnia, OpenAPI, HAR)
- [x] Provide preview before import with conflict resolution
- [x] Support bulk import of multiple collections

## User Stories

### As a developer migrating from Postman, I want to import my existing collections so that I can continue my workflow in Anayas

**Acceptance Criteria:**

- [x] Can select Postman collection JSON file via file dialog
- [x] Collections with folders are imported with correct hierarchy
- [x] All requests preserve method, URL, headers, body, query params, and auth
- [x] Request names and descriptions are preserved
- [x] Progress indicator shows import status for large collections

**Priority**: `P0`

### As a developer, I want to preview what will be imported so that I can verify the data before committing

**Acceptance Criteria:**

- [x] Preview shows collection name, folder count, request count
- [x] Preview shows tree structure of folders and requests
- [x] Can expand/collapse preview sections
- [x] Can cancel import before committing
- [x] Invalid items are highlighted with error messages

**Priority**: `P0`

### As a team lead, I want to import Postman environments so that my team can use existing configurations

**Acceptance Criteria:**

- [x] Environment variables from Postman collection are extracted
- [x] User can choose to import as collection-level or global environment
- [x] Variable names and values are preserved correctly
- [x] Secret variables are marked appropriately

**Priority**: `P1`

### As a developer, I want clear error messages when import fails so that I can fix issues with my collection file

**Acceptance Criteria:**

- [x] Invalid JSON shows specific parse error with line number
- [x] Unsupported format shows clear message with supported formats
- [x] Partial import shows which items failed and why
- [x] Detailed error log available for debugging

**Priority**: `P1`

### As a developer, I want to import legacy Postman v1 collections so that I can migrate old projects

**Acceptance Criteria:**

- [x] Postman Collection v1 format detected automatically
- [x] v1 collections converted to Anayas format correctly
- [x] v1-specific fields (like folder ordering) are handled
- [x] Warning shown for v1-only features not supported in Anayas

**Priority**: `P1`

---

## Technical Requirements

### Architecture Decisions

#### 1. Strategy Pattern for Import Formats

Use the **Strategy Pattern** to support multiple import formats with a unified interface:

```typescript
// Base interface for all import strategies
interface ImportStrategy {
  readonly formatName: string;
  readonly fileExtensions: string[];
  readonly mimeTypes: string[];

  detect(content: string): boolean;
  parse(content: string): Promise<ImportResult>;
  validate(result: ImportResult): ValidationResult;
}

// Factory for creating the right strategy
class ImportStrategyFactory {
  private strategies: Map<string, ImportStrategy>;

  register(strategy: ImportStrategy): void;
  detectFormat(content: string): ImportStrategy | null;
  getStrategy(formatName: string): ImportStrategy | null;
}
```

This pattern allows:

- Easy addition of new formats (Insomnia, OpenAPI, HAR, etc.)
- Each parser is independent and testable
- No modification of core import logic when adding formats
- Lazy loading of specific parsers

#### 2. Postman Collection Version Detection

Auto-detect collection version from structure:

- v2.x: Has `info._postman_id` and `info.schema` with v2 URL
- v1: Has `id`, `name`, `requests` at root level (no `info`)

#### 3. Normalized Import Result

All import strategies produce a normalized result:

```typescript
interface ImportResult {
  collection: {
    name: string;
    description?: string;
  };
  folders: Array<{
    name: string;
    description?: string;
    parentPath?: string; // For nested folders
    order: number;
  }>;
  requests: Array<{
    name: string;
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body?: string;
    queryParams: QueryParam[];
    auth?: AuthConfig;
    folderPath?: string; // Path to parent folder
    order: number;
  }>;
  environments?: Array<{
    name: string;
    variables: Record<string, string>;
  }>;
  warnings: string[];
  errors: string[];
}
```

### Existing Code to Leverage

- [x] Similar Feature: `specs/001-curl-import-export/` - Parser pattern and IPC structure
- [x] Component: `src/components/ui/Dialog.tsx` - Import dialog base
- [x] Hook: `src/hooks/useToastNotifications.ts` - Success/error notifications
- [x] Utility: `electron/lib/curl-parser.ts` - Parser structure pattern
- [x] Type/Interface: `src/types/entities.ts` - Collection, Folder, Request types
- [x] Service: `electron/ipc/handlers.ts` - IPC handler patterns
- [x] Page: Sidebar Collections section - Where import button lives

### Integration Points

- **Where to add**: Sidebar "Collections" section header + Collection context menu
- **How to integrate**: Add "Import Collection" button that opens import dialog
- **Existing patterns to follow**: cURL import dialog pattern

### Dependencies

- Internal:
  - Request entity types (`src/types/entities.ts`)
  - IPC handlers (`electron/ipc/handlers.ts`)
  - Preload API (`electron/preload.ts`)
  - Toast notifications (`src/hooks/useToastNotifications.ts`)
  - Database helpers (`electron/database/json-db.ts`)
- External:
  - No external dependencies (pure TypeScript parsers)

### File Structure Changes

```
New Files:
- electron/lib/import/
  - types.ts                        # Shared types for import strategies
  - import-strategy.ts              # Base strategy interface
  - import-factory.ts               # Strategy factory
  - postman-v1-parser.ts            # Postman v1 format parser
  - postman-v2-parser.ts            # Postman v2.x format parser
  - index.ts                        # Public exports

- src/components/import/
  - ImportCollectionDialog.tsx      # Main import dialog
  - ImportPreview.tsx               # Preview component
  - ImportProgress.tsx              # Progress indicator
  - ImportFormatDetector.tsx        # Format detection UI

Modified Files:
- electron/ipc/handlers.ts          # Add import handlers
- electron/preload.ts               # Expose import APIs
- src/types/electron.d.ts           # Add import API types
- src/components/sidebar/           # Add import button
```

### Data Model Changes

No database schema changes. Uses existing interfaces:

- `Collection`: name, description, environments
- `Folder`: name, description, collectionId, order
- `Request`: Full request structure with auth, headers, body, etc.

### API Changes

New IPC handlers:

```typescript
// Detect format of imported file
'import:detect-format': (content: string) => Promise<{
  format: string;
  version?: string;
  isValid: boolean;
}>

// Parse collection file
'import:parse': (content: string, format?: string) => Promise<ImportResult>

// Execute import (save to database)
'import:execute': (result: ImportResult, options: ImportOptions) => Promise<{
  collectionId: number;
  folderCount: number;
  requestCount: number;
}>

// Get supported formats
'import:supported-formats': () => Promise<string[]>
```

New preload APIs:

```typescript
window.electronAPI.import = {
  detectFormat: (content: string) => Promise<FormatDetectionResult>,
  parse: (content: string, format?: string) => Promise<ImportResult>,
  execute: (result: ImportResult, options: ImportOptions) =>
    Promise<ImportExecutionResult>,
  getSupportedFormats: () => Promise<string[]>,
};
```

## Acceptance Criteria

### Functional Requirements

- [x] Detect and parse Postman Collection v1 format
- [x] Detect and parse Postman Collection v2.0/v2.1 format
- [x] Preserve complete folder hierarchy (including nested folders)
- [x] Import all request fields: method, URL, headers, body, query params, auth
- [x] Import folder descriptions and documentation
- [x] Support all auth types: none, bearer, basic, API key, OAuth (where applicable)
- [x] Handle Postman variables in URLs ({{variable}}) - preserve as-is
- [x] Import environments if present in collection
- [x] Show preview before committing import
- [x] Support cancellation during import
- [x] Handle partial failures gracefully (import what's valid)

### Non-Functional Requirements

- [x] **Performance (PRIMARY)**:
  - Memory: <100MB during import for large collections (PRIMARY GOAL)
  - Load time: <200ms for import dialog (PRIMARY GOAL)
  - Parse time: <100ms for typical collections
  - Lazy-loaded: Yes (not loaded upfront) - REQUIRED
  - Cleanup: Full cleanup on dialog close - REQUIRED (prevents memory leaks)
  - Bundle size: Tracked for awareness (not a blocker)
- [x] **Accessibility**: Keyboard navigation, screen reader support for preview
- [x] **Security**: Validate file content, sanitize input, no code execution
- [x] **Testing**: Unit tests for each parser, integration tests for full flow

## Success Metrics

- 99% of Postman collections import successfully
- Import time <5s for 1000-request collections
- Zero memory leaks after import (verified by tests)
- Extensible: Adding new format takes <1 day

## Out of Scope

- Postman test scripts (pre-request, tests)
- Postman Runner configurations
- Postman Mock servers
- Postman Monitors
- GraphQL-specific Postman features
- Real-time sync with Postman
- Postman API key authentication for cloud collections

## Risks & Mitigation

| Risk                                       | Impact | Probability | Mitigation                                                                 |
| ------------------------------------------ | ------ | ----------- | -------------------------------------------------------------------------- |
| Complex nested folder structures           | Medium | Medium      | Recursive parser with depth limit, extensive testing                       |
| Very large collections cause memory issues | High   | Low         | Streaming parser, progress feedback, chunked database writes               |
| Unknown Postman format variations          | Medium | Medium      | Comprehensive format detection, graceful degradation, clear error messages |
| Breaking changes in Postman format         | Low    | Low         | Version detection, format validation, user-friendly migration messages     |

## References

- [Postman Collection v2.1 Schema](https://schema.getpostman.com/json/collection/v2.1.0/collection.json)
- [Postman Collection v2.0 Schema](https://schema.getpostman.com/json/collection/v2.0.0/collection.json)
- [specs/001-curl-import-export/](../001-curl-import-export/) - Similar feature for reference
- [plan-timeline.md](../../plan-timeline.md) - Phase 3.2 Collection Import

## Notes

- Future formats to consider: Insomnia, OpenAPI, HAR, Thunder Client, REST Client
- The Strategy Pattern makes adding new formats straightforward
- Consider WebSocket collection support in future iterations
- Monitor Postman format changes in their schema repository
