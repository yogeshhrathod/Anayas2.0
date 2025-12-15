# Data Model: Environment Import/Export

**Feature ID**: 015-environment-import-export

## Overview

This feature uses the existing Environment data model with no schema changes. All import/export operations work with the standard Environment interface defined in `src/types/entities.ts`.

## Schema

### Environment Interface

```typescript
interface Environment {
  id?: number; // Optional ID (assigned on save)
  name: string; // Internal identifier (unique)
  displayName: string; // Display name for UI
  variables: Record<string, string>; // Environment variables
  isDefault?: number; // 0 or 1 (boolean as number)
  lastUsed?: string; // ISO timestamp
  createdAt?: string; // ISO timestamp
}
```

### Import Result

```typescript
interface ImportResult {
  success: boolean;
  environments: Environment[];
  warnings: string[];
  errors: string[];
  conflicts: Conflict[];
}

interface Conflict {
  environmentName: string;
  existingId: number;
  importedEnvironment: Environment;
}
```

### Export Result

```typescript
interface ExportResult {
  success: boolean;
  content: string; // Exported content as string
  filename: string; // Suggested filename
  error?: string; // Error message if failed
}
```

### Format Detection Result

```typescript
interface FormatDetectionResult {
  format: 'json' | 'env' | 'postman' | 'unknown';
  isValid: boolean;
  confidence: number; // 0-1 confidence score
}
```

## Database Schema

No database schema changes. Uses existing `environments` table/collection structure:

- Environments stored in `db.environments` array
- Uses existing CRUD operations from `electron/database/json-db.ts`
- No migrations required

## Validation Rules

### Environment Validation

- [x] `name` is required and non-empty
- [x] `displayName` is required and non-empty
- [x] `variables` is required and is an object
- [x] Variable keys must be non-empty strings
- [x] Variable values must be strings (can be empty)

### Import Validation

- [x] File content must be non-empty
- [x] Format must be supported (json, env, postman)
- [x] Parsed environments must pass environment validation
- [x] Duplicate environment names detected as conflicts

### Export Validation

- [x] Format must be supported (json, env, postman)
- [x] At least one environment must exist to export
- [x] Selected environment IDs must be valid

## Format-Specific Data Models

### JSON Format (Anayas Native)

```typescript
// Single environment
{
  "name": "production",
  "displayName": "Production",
  "variables": {
    "base_url": "https://api.example.com",
    "api_key": "secret123"
  },
  "isDefault": 0
}

// Multiple environments (array)
[
  { "name": "production", ... },
  { "name": "staging", ... }
]
```

### .env File Format

```
# Environment: Production
BASE_URL=https://api.example.com
API_KEY=secret123
DEBUG=false
```

### Postman Environment Format

```json
{
  "id": "uuid-here",
  "name": "Production",
  "values": [
    {
      "key": "base_url",
      "value": "https://api.example.com",
      "enabled": true
    },
    {
      "key": "api_key",
      "value": "secret123",
      "enabled": true
    }
  ],
  "_postman_variable_scope": "environment"
}
```

## Data Transformations

### Import Transformations

1. **JSON → Environment**: Direct mapping (already in correct format)
2. **.env → Environment**:
   - Parse key-value pairs
   - Create single environment with name from comment or filename
   - Variables from key-value pairs
3. **Postman → Environment**:
   - `name` → `displayName`
   - `name` → `name` (sanitized)
   - `values` array → `variables` object
   - Filter disabled variables

### Export Transformations

1. **Environment → JSON**: Direct serialization
2. **Environment → .env**:
   - Convert variables to `KEY=VALUE` format
   - Add comment with environment name
3. **Environment → Postman**:
   - `displayName` → `name`
   - `variables` → `values` array
   - Generate UUID for `id`
   - Set `_postman_variable_scope` to "environment"

## Notes

- All timestamps use ISO 8601 format
- Environment names must be unique (enforced by database)
- Variable names are case-sensitive
- Empty variable values are allowed
- No size limits on environment files (but performance targets apply)
