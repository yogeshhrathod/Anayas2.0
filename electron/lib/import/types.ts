/**
 * Import Types
 *
 * Shared TypeScript interfaces for the collection import system.
 * All import strategies produce a normalized ImportResult.
 */

// ============================================================================
// Core Import Result Types
// ============================================================================

/**
 * HTTP methods supported for import
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

/**
 * Body content types
 */
export type BodyType =
  | 'none'
  | 'json'
  | 'text'
  | 'xml'
  | 'form-data'
  | 'x-www-form-urlencoded';

/**
 * Authentication configuration
 */
export interface ParsedAuth {
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

/**
 * Query parameter
 */
export interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

/**
 * Parsed collection metadata
 */
export interface ParsedCollection {
  name: string;
  description?: string;
  documentation?: string;
}

/**
 * Parsed folder with hierarchy information
 */
export interface ParsedFolder {
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

/**
 * Parsed request
 */
export interface ParsedRequest {
  /** Display name */
  name: string;
  /** HTTP method */
  method: HttpMethod;
  /** Request URL (may contain variables like {{baseUrl}}) */
  url: string;
  /** HTTP headers */
  headers: Record<string, string>;
  /** Request body content */
  body: string;
  /** Body content type */
  bodyType?: BodyType;
  /** Query parameters */
  queryParams: QueryParam[];
  /** Authentication config */
  auth: ParsedAuth;
  /** Description/documentation */
  description?: string;
  /** Parent folder tempId (null for root-level requests) */
  folderTempId: string | null;
  /** Order within parent folder */
  order: number;
}

/**
 * Parsed environment
 */
export interface ParsedEnvironment {
  /** Environment name */
  name: string;
  /** Variables */
  variables: Record<string, string>;
  /** Whether this was the active environment */
  isActive?: boolean;
}

/**
 * Import warning (non-critical issue)
 */
export interface ImportWarning {
  /** Warning code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Item that caused the warning */
  itemName?: string;
  /** Path to the item */
  itemPath?: string;
}

/**
 * Import error (critical issue)
 */
export interface ImportError {
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

/**
 * Import statistics
 */
export interface ImportStats {
  totalFolders: number;
  totalRequests: number;
  totalEnvironments: number;
  skippedItems: number;
}

/**
 * Source format information
 */
export interface ImportSource {
  /** Format name (e.g., 'postman-v2', 'postman-v1') */
  format: string;
  /** Format version (e.g., '2.1.0') */
  version?: string;
  /** Original file/collection name */
  originalName: string;
}

/**
 * Main import result produced by all parsers
 */
export interface ImportResult {
  /** Source format information */
  source: ImportSource;
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
  stats: ImportStats;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result for an import
 */
export interface ValidationResult {
  /** Whether the import is valid */
  isValid: boolean;
  /** Validation errors */
  errors: ImportError[];
  /** Validation warnings */
  warnings: ImportWarning[];
}

// ============================================================================
// Format Detection Types
// ============================================================================

/**
 * Result of format detection
 */
export interface FormatDetectionResult {
  /** Detected format name (null if unknown) */
  format: string | null;
  /** Format version if detected */
  version?: string;
  /** Whether the content is valid for the detected format */
  isValid: boolean;
  /** Confidence score 0-1 */
  confidence: number;
}

/**
 * Information about a supported format
 */
export interface FormatInfo {
  /** Format name (e.g., 'postman-v2') */
  name: string;
  /** Display name (e.g., 'Postman Collection v2') */
  displayName: string;
  /** Supported file extensions */
  fileExtensions: string[];
  /** MIME types */
  mimeTypes: string[];
}

// ============================================================================
// Import Options Types
// ============================================================================

/**
 * Options for import execution
 */
export interface ImportOptions {
  /** How to handle environments */
  environmentMode: 'collection' | 'global' | 'skip';
  /** What to do if collection name exists */
  duplicateHandling: 'rename' | 'replace' | 'cancel';
  /** Whether to import disabled items */
  includeDisabled: boolean;
}

/**
 * Result of import execution
 */
export interface ImportExecutionResult {
  /** Whether import succeeded */
  success: boolean;
  /** ID of created collection */
  collectionId?: number;
  /** Number of folders created */
  folderCount: number;
  /** Number of requests created */
  requestCount: number;
  /** Number of environments created */
  environmentCount: number;
  /** Warnings during import */
  warnings: string[];
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Parse Result Types (for IPC)
// ============================================================================

/**
 * Result of parse operation
 */
export interface ParseResult {
  /** Whether parsing succeeded */
  success: boolean;
  /** Parsed result (if successful) */
  result?: ImportResult;
  /** Error message (if failed) */
  error?: string;
}
