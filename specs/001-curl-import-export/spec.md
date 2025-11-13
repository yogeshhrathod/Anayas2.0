# Feature Specification: cURL Import/Export

**Status**: `completed`  
**Feature ID**: `001-curl-import-export`  
**Created**: 2025-11-13  
**Last Updated**: 2025-01-27  
**Owner**: Development Team  
**Phase**: Phase 3: Import/Export & Interoperability (plan-timeline.md)

## Overview

Enable users to import HTTP requests from cURL commands and export requests as cURL commands. This feature provides interoperability with command-line tools and other API clients, allowing users to quickly convert between cURL commands and Anayas request format.

## Goals

- [x] Enable importing cURL commands into Anayas requests
- [x] Enable exporting Anayas requests as cURL commands
- [x] Support bulk import of multiple cURL commands
- [x] Provide clipboard-based import for quick workflow

## User Stories

### As a developer, I want to import a cURL command so that I can quickly test an API request without manually recreating it

**Acceptance Criteria:**
- [x] Can paste a cURL command and import it as a request
- [x] Can import from a file containing cURL commands
- [x] Parsed request correctly extracts method, URL, headers, body, and auth
- [x] Can preview parsed request before saving
- [x] Can save imported request to a collection or folder

**Priority**: `P0`

### As a developer, I want to export my request as a cURL command so that I can share it or use it in scripts

**Acceptance Criteria:**
- [x] Can copy request as cURL command to clipboard
- [x] Generated cURL command is valid and executable
- [x] All request components (method, headers, body, auth) are included
- [x] Special characters are properly escaped
- [x] Success notification appears after copying

**Priority**: `P0`

### As a developer, I want to bulk import multiple cURL commands so that I can quickly set up a collection from existing scripts

**Acceptance Criteria:**
- [x] Can import multiple cURL commands at once
- [x] Each command is parsed and saved as a separate request
- [x] Can specify collection/folder for bulk imports
- [x] Errors in one command don't block others

**Priority**: `P1`

---

## Technical Requirements

### Architecture Decisions

- **Parser Library**: Evaluate npm libraries (curl-to-json, curlconverter) or implement custom parser based on stability and feature requirements
- **Generator**: Implement custom generator to ensure full control over output format and escaping
- **UI Placement**: Copy button in RequestHeader, import dialog accessible from Collections page and context menus

### Dependencies

- Internal: 
  - Request entity types (`src/types/entities.ts`)
  - IPC handlers (`electron/ipc/handlers.ts`)
  - Preload API (`electron/preload.ts`)
  - Toast notifications (`src/hooks/useToastNotifications.ts`)
- External: 
  - Potential npm library for cURL parsing (TBD)
  - No additional dependencies if custom parser is used

### File Structure Changes

```
New Files:
- src/lib/curl-parser.ts
- src/lib/curl-generator.ts
- src/components/curl/CurlImportDialog.tsx

Modified Files:
- electron/ipc/handlers.ts (add curl handlers)
- electron/preload.ts (expose curl APIs)
- src/components/request/RequestHeader.tsx (add Copy as cURL button)
- src/pages/Collections.tsx (add Import cURL option)
```

### Data Model Changes

No database schema changes. Uses existing Request interface:
- `method`: HTTP method
- `url`: Request URL
- `headers`: Record<string, string>
- `body`: string
- `queryParams`: Array<{key, value, enabled}>
- `auth`: {type, token, username, password, apiKey, apiKeyHeader}

### API Changes

New IPC handlers:
- `curl:parse` - Parse cURL command string to Request object
- `curl:generate` - Generate cURL command from Request object
- `curl:import-bulk` - Import multiple cURL commands

New preload APIs:
- `electronAPI.curl.parse(command: string)`
- `electronAPI.curl.generate(request: Request)`
- `electronAPI.curl.importBulk(commands: string[])`

## Acceptance Criteria

### Functional Requirements

- [x] Parse cURL commands with all common flags (-X, -H, -d, -u, etc.)
- [x] Generate valid cURL commands from any request type
- [x] Support all HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- [x] Support all auth types (Bearer, Basic, API Key)
- [x] Handle query parameters in URL
- [x] Handle form-data and x-www-form-urlencoded bodies
- [x] Properly escape special characters in generated commands
- [x] Bulk import with error handling per command

### Non-Functional Requirements

- [x] Performance: Parse commands in <100ms for typical requests
- [x] Accessibility: Keyboard navigation and screen reader support
- [x] Security: Validate and sanitize parsed input
- [x] Testing: Unit tests for parser and generator with edge cases

## Success Metrics

- Users can successfully import cURL commands with >95% success rate
- Generated cURL commands execute successfully when copied to terminal
- Bulk import processes 10+ commands without performance issues

## Out of Scope

- Automatic clipboard detection (manual trigger only)
- cURL command history
- Custom cURL option preservation (only standard options)
- File upload support in cURL parser (only data strings)

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Complex cURL commands fail to parse | Medium | Medium | Implement robust error handling, partial parsing, clear error messages |
| Generated commands have escaping issues | High | Low | Comprehensive testing with special characters, use proper escaping |
| Library dependency issues | Low | Low | Prefer custom parser if library is unstable or has compatibility issues |

## References

- [plan-timeline.md](../../plan-timeline.md) - Phase 3.1 cURL Support
- [curl-import-export-feature.plan.md](../../curl-import-export-feature.plan.md) - Implementation plan

## Notes

- Consider using a well-maintained library for parsing to reduce maintenance burden
- Generator should prioritize readability (multi-line format) over compactness
- Support both single-line and multi-line cURL command formats
