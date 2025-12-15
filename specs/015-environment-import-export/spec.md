# Feature Specification: Environment Import/Export

**Status**: `completed`  
**Feature ID**: `015-environment-import-export`  
**Created**: 2025-12-15  
**Last Updated**: 2025-12-15  
**Owner**: Development Team  
**Phase**: Phase 3: Import/Export & Interoperability (plan-timeline.md)

## Overview

Enable users to import and export environments in multiple formats (JSON, .env files, Postman environment format) to facilitate environment sharing, backup, and migration between tools. This feature enhances the existing basic import/export functionality with format support, preview, and better error handling.

## Goal Alignment Summary

**How this feature supports the performance-first project goal:**

- **Lazy-loaded dialogs**: Import/export dialogs load on-demand, not bundled with initial load
- **Efficient parsing**: Lightweight parsers with minimal memory footprint
- **Streaming for large files**: Large environment files parsed incrementally to avoid memory spikes
- **Clean architecture**: Format-agnostic design allows adding new formats without modifying core code

**Success Criteria:**

- Import 100+ environment variables in <500ms
- Memory usage during import <20MB for large environment files
- Parse time <100ms for typical environments (<50 variables)
- Load time for import/export dialogs <200ms

**Constraints:**

- Feature must be lazy-loaded (not loaded upfront)
- Parsers must clean up after import (no memory leaks)
- Must support JSON, .env, and Postman environment formats
- Extensible for future import formats

**Unclear Points (to confirm):**

- Should we support Insomnia environment format? (Answer: Out of scope for MVP)
- Should we support environment variable encryption during export? (Answer: Out of scope for MVP)
- Should we support bulk import from multiple files? (Answer: Out of scope for MVP)

## Performance Impact Analysis (MANDATORY)

### Memory Impact

- **Estimated Memory Footprint**: 10-20MB (for large imports with 100+ variables)
- **Memory Budget**: <20MB during import operation
- **Memory Cleanup Strategy**:
  - Parser instances cleaned up immediately after import
  - File handles released after reading
  - Dialog components unmounted when closed

### Load Time Impact (PRIMARY)

- **Estimated Load Time**: <200ms for import/export dialogs
- **Initialization Strategy**:
  - Import/export buttons visible immediately
  - Dialogs loaded only when triggered
  - Format detection runs on file selection
- **Performance Tracking**: Log import/export time by file size

### Lazy Loading Strategy (REQUIRED)

- **How feature loads on-demand**: Import/export dialogs loaded only when user clicks "Import" or "Export" buttons
- **Code Splitting Plan**:
  - `EnvironmentImportDialog` component in separate chunk
  - `EnvironmentExportDialog` component in separate chunk
  - Each format parser in its own chunk (enables future formats without bloating)
- **Trigger**: User clicks "Import" or "Export" buttons in Environments page

### Bundle Size Impact (INFORMATIONAL - Not Primary)

- **Estimated Bundle Size**: ~30KB for parsers and dialogs (excluding dependencies)

### Performance Monitoring (PRIMARY)

- [x] Memory usage will be tracked (before/after feature load) - MANDATORY
- [x] Load time will be measured and logged - MANDATORY
- [x] Performance metrics will be logged to monitoring system - MANDATORY

**Optional/Informational:**

- [x] Bundle size will be tracked in build (for awareness)

## Goals

- [x] Enable importing environments from JSON, .env, and Postman formats
- [x] Enable exporting environments to JSON, .env, and Postman formats
- [x] Support selective export (export selected environments)
- [x] Provide preview before import with conflict resolution
- [x] Better error handling and validation

## User Stories

### As a developer, I want to export my environments so that I can backup and share them with my team

**Acceptance Criteria:**

- [x] Can export all environments or selected environments
- [x] Can choose export format (JSON, .env, Postman)
- [x] Exported file contains all environment variables
- [x] Exported file is valid and can be imported back
- [x] Success notification appears after export

**Priority**: `P0`

### As a developer, I want to import environments from different formats so that I can migrate from other tools

**Acceptance Criteria:**

- [x] Can import from JSON format (Anayas native format)
- [x] Can import from .env file format
- [x] Can import from Postman environment format
- [x] Format is auto-detected from file content
- [x] Can preview imported environments before committing
- [x] Can resolve conflicts (skip, overwrite, rename)
- [x] Invalid files show clear error messages

**Priority**: `P0`

### As a developer, I want to preview imported environments so that I can verify the data before committing

**Acceptance Criteria:**

- [x] Preview shows environment names and variable counts
- [x] Preview shows which environments will be created/updated
- [x] Preview highlights conflicts (existing environments with same name)
- [x] Can cancel import before committing
- [x] Can resolve conflicts (skip, overwrite, rename)

**Priority**: `P0`

### As a developer, I want clear error messages when import fails so that I can fix issues with my environment file

**Acceptance Criteria:**

- [x] Invalid JSON shows specific parse error with line number
- [x] Unsupported format shows clear message with supported formats
- [x] Missing required fields show which fields are missing
- [x] Detailed error log available for debugging

**Priority**: `P1`

---

## Technical Requirements

### Existing Code to Leverage

- [x] Similar Feature: `specs/001-curl-import-export/` - Parser pattern and IPC structure
- [x] Similar Feature: `specs/014-postman-collection-import/` - Import dialog pattern and format detection
- [x] Component: `src/components/ui/Dialog.tsx` - Import/export dialog base
- [x] Hook: `src/hooks/useToastNotifications.ts` - Success/error notifications
- [x] Hook: `src/hooks/useEnvironmentOperations.ts` - Existing import/export functions (to enhance)
- [x] Type/Interface: `src/types/entities.ts` - Environment type
- [x] Service: `electron/ipc/handlers.ts` - IPC handler patterns
- [x] Page: `src/pages/Environments.tsx` - Where import/export buttons live

### Integration Points

- **Where to add**: Environments page (`src/pages/Environments.tsx`) - Enhance existing import/export buttons
- **How to integrate**: Replace basic file picker with proper import/export dialogs
- **Existing patterns to follow**: cURL import dialog pattern, Postman import dialog pattern

### Architecture Decisions

#### 1. Strategy Pattern for Import Formats

Use the **Strategy Pattern** to support multiple import formats with a unified interface:

```typescript
// Base interface for all import strategies
interface EnvironmentImportStrategy {
  readonly formatName: string;
  readonly fileExtensions: string[];
  readonly mimeTypes: string[];

  detect(content: string): boolean;
  parse(content: string): Promise<Environment[]>;
  validate(environments: Environment[]): ValidationResult;
}
```

This pattern allows:

- Easy addition of new formats (Insomnia, etc.)
- Each parser is independent and testable
- No modification of core import logic when adding formats
- Lazy loading of specific parsers

#### 2. Format Detection

Auto-detect format from file content:

- JSON: Valid JSON array or object with environment structure
- .env: Key-value pairs separated by `=` or `:`
- Postman: JSON object with `id`, `name`, `values` array

#### 3. Normalized Environment Format

All import strategies produce a normalized result:

```typescript
interface Environment {
  id?: number;
  name: string;
  displayName: string;
  variables: Record<string, string>;
  isDefault?: number;
  lastUsed?: string;
  createdAt?: string;
}
```

### Dependencies

- Internal:
  - Environment entity types (`src/types/entities.ts`)
  - IPC handlers (`electron/ipc/handlers.ts`)
  - Preload API (`electron/preload.ts`)
  - Toast notifications (`src/hooks/useToastNotifications.ts`)
  - Database helpers (`electron/database/json-db.ts`)
- External:
  - No external dependencies (pure TypeScript parsers)

### File Structure Changes

```
New Files:
- electron/lib/environment/
  - types.ts                        # Shared types for import/export
  - import-strategy.ts              # Base strategy interface
  - import-factory.ts               # Strategy factory
  - json-parser.ts                   # JSON format parser
  - env-file-parser.ts              # .env file format parser
  - postman-parser.ts               # Postman environment format parser
  - export-generator.ts             # Export format generators
  - index.ts                         # Public exports

- src/components/environment/
  - EnvironmentImportDialog.tsx      # Main import dialog
  - EnvironmentExportDialog.tsx     # Main export dialog
  - ImportPreview.tsx                # Preview component
  - FormatSelector.tsx              # Format selection UI

Modified Files:
- electron/ipc/handlers.ts          # Enhance env:import, add env:export handlers
- electron/preload.ts               # Expose enhanced import/export APIs
- src/hooks/useEnvironmentOperations.ts # Enhance import/export functions
- src/pages/Environments.tsx        # Use new dialogs instead of basic file picker
```

### Data Model Changes

No database schema changes. Uses existing Environment interface:

- `id`: Optional number
- `name`: string
- `displayName`: string
- `variables`: Record<string, string>
- `isDefault`: Optional number
- `lastUsed`: Optional string
- `createdAt`: Optional string

### API Changes

Enhanced IPC handlers:

```typescript
// Enhanced import handler
'env:import': (content: string, format?: string) => Promise<{
  success: boolean;
  environments: Environment[];
  warnings: string[];
  errors: string[];
}>

// New export handler
'env:export': (environmentIds: number[], format: 'json' | 'env' | 'postman') => Promise<{
  success: boolean;
  content: string;
  filename: string;
}>

// Format detection
'env:detect-format': (content: string) => Promise<{
  format: string;
  isValid: boolean;
}>

// Get supported formats
'env:supported-formats': () => Promise<string[]>
```

New preload APIs:

```typescript
window.electronAPI.env = {
  // ... existing APIs ...
  import: (content: string, format?: string) => Promise<ImportResult>,
  export: (environmentIds: number[], format: string) => Promise<ExportResult>,
  detectFormat: (content: string) => Promise<FormatDetectionResult>,
  getSupportedFormats: () => Promise<string[]>,
};
```

## Acceptance Criteria

### Functional Requirements

- [x] Import environments from JSON format (Anayas native)
- [x] Import environments from .env file format
- [x] Import environments from Postman environment format
- [x] Auto-detect format from file content
- [x] Export environments to JSON format
- [x] Export environments to .env file format
- [x] Export environments to Postman environment format
- [x] Support selective export (export selected environments)
- [x] Preview imported environments before committing
- [x] Resolve conflicts (skip, overwrite, rename)
- [x] Handle partial failures gracefully (import what's valid)
- [x] Validate environment data before import
- [x] Show clear error messages for invalid files

### Non-Functional Requirements

- [x] **Performance (PRIMARY)**:
  - Memory: <20MB during import for large files (PRIMARY GOAL)
  - Load time: <200ms for import/export dialogs (PRIMARY GOAL)
  - Parse time: <100ms for typical environments
  - Lazy-loaded: Yes (not loaded upfront) - REQUIRED
  - Cleanup: Full cleanup on dialog close - REQUIRED (prevents memory leaks)
  - Bundle size: Tracked for awareness (not a blocker)
- [x] **Accessibility**: Keyboard navigation, screen reader support for dialogs
- [x] **Security**: Validate file content, sanitize input, no code execution
- [x] **Testing**: Unit tests for each parser, integration tests for full flow

## Success Metrics

- 99% of environment files import successfully
- Import time <500ms for 100-variable environments
- Zero memory leaks after import (verified by tests)
- Extensible: Adding new format takes <1 day

## Out of Scope

- Insomnia environment format (future enhancement)
- Environment variable encryption during export
- Bulk import from multiple files
- Real-time sync with external tools
- Environment variable validation rules
- Environment templates

## Risks & Mitigation

| Risk                                          | Impact | Probability | Mitigation                                                                 |
| --------------------------------------------- | ------ | ----------- | -------------------------------------------------------------------------- |
| Complex environment files cause memory issues | Medium | Low         | Streaming parser, progress feedback, chunked processing                    |
| Unknown format variations                     | Medium | Medium      | Comprehensive format detection, graceful degradation, clear error messages |
| Breaking changes in Postman format            | Low    | Low         | Version detection, format validation, user-friendly migration messages     |
| Large environment files (>10MB)               | Low    | Low         | File size limits, streaming parser, progress indicators                    |

## References

- [Postman Environment Format](https://schema.getpostman.com/json/environment/v1.0.0/environment.json)
- [specs/001-curl-import-export/](../001-curl-import-export/) - Similar feature for reference
- [specs/014-postman-collection-import/](../014-postman-collection-import/) - Postman import pattern
- [plan-timeline.md](../../plan-timeline.md) - Phase 3: Import/Export & Interoperability

## Notes

- Future formats to consider: Insomnia, Thunder Client, REST Client
- The Strategy Pattern makes adding new formats straightforward
- Consider environment variable validation rules in future iterations
- Monitor Postman format changes in their schema repository
