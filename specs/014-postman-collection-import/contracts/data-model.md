# Data Model: Postman Collection Import

## Overview

This document defines the data models used in the Postman Collection Import feature. The design uses a normalized `ImportResult` interface that all import strategies produce, enabling uniform handling regardless of source format.

## Core Interfaces

### ImportResult

The main result produced by all import parsers:

```typescript
interface ImportResult {
  /** Source format information */
  source: {
    format: string; // e.g., 'postman-v2', 'postman-v1'
    version?: string; // e.g., '2.1.0'
    originalName: string; // Original file/collection name
  };

  /** Parsed collection data */
  collection: ParsedCollection;

  /** Array of parsed folders (flattened with paths) */
  folders: ParsedFolder[];

  /** Array of parsed requests */
  requests: ParsedRequest[];

  /** Optional: Parsed environments */
  environments?: ParsedEnvironment[];

  /** Warnings encountered during parsing */
  warnings: ImportWarning[];

  /** Errors that prevented parsing some items */
  errors: ImportError[];

  /** Statistics */
  stats: {
    totalFolders: number;
    totalRequests: number;
    totalEnvironments: number;
    skippedItems: number;
  };
}
```

### ParsedCollection

```typescript
interface ParsedCollection {
  name: string;
  description?: string;
  documentation?: string;
}
```

### ParsedFolder

```typescript
interface ParsedFolder {
  /** Temporary ID for reference during import */
  tempId: string;

  /** Display name */
  name: string;

  /** Optional description */
  description?: string;

  /** Path for nested folders (e.g., 'parent/child') */
  path: string;

  /** Parent folder tempId (null for root-level folders) */
  parentTempId: string | null;

  /** Order within parent */
  order: number;
}
```

### ParsedRequest

```typescript
interface ParsedRequest {
  /** Display name */
  name: string;

  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

  /** Request URL (may contain variables like {{baseUrl}}) */
  url: string;

  /** HTTP headers */
  headers: Record<string, string>;

  /** Request body content */
  body: string;

  /** Body content type */
  bodyType?:
    | 'none'
    | 'json'
    | 'text'
    | 'xml'
    | 'form-data'
    | 'x-www-form-urlencoded';

  /** Query parameters */
  queryParams: Array<{
    key: string;
    value: string;
    enabled: boolean;
  }>;

  /** Authentication config */
  auth: ParsedAuth;

  /** Description/documentation */
  description?: string;

  /** Parent folder tempId (null for root-level requests) */
  folderTempId: string | null;

  /** Order within parent folder */
  order: number;
}
```

### ParsedAuth

```typescript
interface ParsedAuth {
  type: 'none' | 'bearer' | 'basic' | 'apikey';

  /** For bearer auth */
  token?: string;

  /** For basic auth */
  username?: string;
  password?: string;

  /** For API key auth */
  apiKey?: string;
  apiKeyHeader?: string;
}
```

### ParsedEnvironment

```typescript
interface ParsedEnvironment {
  /** Environment name */
  name: string;

  /** Variables */
  variables: Record<string, string>;

  /** Whether this was the active environment */
  isActive?: boolean;
}
```

### ImportWarning

```typescript
interface ImportWarning {
  /** Warning code */
  code: string;

  /** Human-readable message */
  message: string;

  /** Item that caused the warning */
  itemName?: string;

  /** Path to the item */
  itemPath?: string;
}
```

### ImportError

```typescript
interface ImportError {
  /** Error code */
  code: string;

  /** Human-readable message */
  message: string;

  /** Item that caused the error */
  itemName?: string;

  /** Path to the item */
  itemPath?: string;

  /** Whether the item was skipped */
  skipped: boolean;
}
```

## Import Options

```typescript
interface ImportOptions {
  /** How to handle environments */
  environmentMode: 'collection' | 'global' | 'skip';

  /** What to do if collection name exists */
  duplicateHandling: 'rename' | 'replace' | 'cancel';

  /** Whether to import disabled items */
  includeDisabled: boolean;
}
```

## Postman Format Mappings

### Postman v2.x to ImportResult

| Postman v2 Field   | ImportResult Field                       |
| ------------------ | ---------------------------------------- |
| `info.name`        | `collection.name`                        |
| `info.description` | `collection.description`                 |
| `item` (array)     | `folders` + `requests` (recursive parse) |
| `item[].item`      | Folder (has nested items)                |
| `item[].request`   | Request (has request object)             |
| `request.method`   | `request.method`                         |
| `request.url.raw`  | `request.url`                            |
| `request.header`   | `request.headers`                        |
| `request.body.raw` | `request.body`                           |
| `request.auth`     | `request.auth`                           |
| `variable`         | `environments`                           |

### Postman v1 to ImportResult

| Postman v1 Field           | ImportResult Field                      |
| -------------------------- | --------------------------------------- |
| `name`                     | `collection.name`                       |
| `description`              | `collection.description`                |
| `folders`                  | `folders`                               |
| `requests`                 | `requests`                              |
| `requests[].method`        | `request.method`                        |
| `requests[].url`           | `request.url`                           |
| `requests[].headers`       | `request.headers` (parse string format) |
| `requests[].data`          | `request.body`                          |
| `requests[].currentHelper` | `request.auth`                          |

## Database Mapping

### ImportResult to Anayas Entities

```
ImportResult → Collection + Folder[] + Request[]

collection: ParsedCollection → {
  name: collection.name,
  description: collection.description,
  documentation: collection.documentation,
  environments: [], // Added separately
  isFavorite: 0
}

folder: ParsedFolder → {
  name: folder.name,
  description: folder.description,
  collectionId: <created collection ID>,
  order: folder.order
}

request: ParsedRequest → {
  name: request.name,
  method: request.method,
  url: request.url,
  headers: request.headers,
  body: request.body,
  queryParams: request.queryParams,
  auth: request.auth,
  collectionId: <created collection ID>,
  folderId: <resolved folder ID>,
  isFavorite: 0,
  order: request.order
}
```

## Validation Rules

### Required Fields

- `ImportResult.collection.name`: Must be non-empty string
- `ParsedRequest.name`: Must be non-empty string
- `ParsedRequest.method`: Must be valid HTTP method
- `ParsedRequest.url`: Must be non-empty string (can contain variables)
- `ParsedFolder.name`: Must be non-empty string

### Validation Warnings

| Condition                             | Warning Code       | Message                              |
| ------------------------------------- | ------------------ | ------------------------------------ |
| Empty request body for POST/PUT/PATCH | `EMPTY_BODY`       | Request {name} has no body           |
| Invalid URL format                    | `INVALID_URL`      | URL may be invalid: {url}            |
| Unsupported auth type                 | `UNSUPPORTED_AUTH` | Auth type {type} not fully supported |
| Deep nesting (>10 levels)             | `DEEP_NESTING`     | Folder nesting exceeds 10 levels     |

### Validation Errors

| Condition                 | Error Code       | Message                            |
| ------------------------- | ---------------- | ---------------------------------- |
| Missing collection name   | `MISSING_NAME`   | Collection name is required        |
| Invalid HTTP method       | `INVALID_METHOD` | Invalid HTTP method: {method}      |
| Circular folder reference | `CIRCULAR_REF`   | Circular folder reference detected |
| Parse failure             | `PARSE_ERROR`    | Failed to parse item: {reason}     |

## Example Import Result

```json
{
  "source": {
    "format": "postman-v2",
    "version": "2.1.0",
    "originalName": "My API Collection"
  },
  "collection": {
    "name": "My API Collection",
    "description": "API endpoints for my service"
  },
  "folders": [
    {
      "tempId": "folder-1",
      "name": "Users",
      "path": "Users",
      "parentTempId": null,
      "order": 0
    },
    {
      "tempId": "folder-2",
      "name": "Auth",
      "path": "Users/Auth",
      "parentTempId": "folder-1",
      "order": 0
    }
  ],
  "requests": [
    {
      "name": "Get Users",
      "method": "GET",
      "url": "{{baseUrl}}/api/users",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": "",
      "queryParams": [{ "key": "page", "value": "1", "enabled": true }],
      "auth": {
        "type": "bearer",
        "token": "{{authToken}}"
      },
      "folderTempId": "folder-1",
      "order": 0
    }
  ],
  "environments": [
    {
      "name": "Development",
      "variables": {
        "baseUrl": "http://localhost:3000",
        "authToken": "dev-token"
      }
    }
  ],
  "warnings": [],
  "errors": [],
  "stats": {
    "totalFolders": 2,
    "totalRequests": 1,
    "totalEnvironments": 1,
    "skippedItems": 0
  }
}
```
