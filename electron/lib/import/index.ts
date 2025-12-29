/**
 * Import Module - Public Exports
 *
 * Provides collection import functionality with extensible format support.
 */

// Types
export type {
  BodyType,
  // Detection types
  FormatDetectionResult,
  FormatInfo,
  HttpMethod,
  ImportError,
  ImportExecutionResult,
  // Options types
  ImportOptions,
  // Core result types
  ImportResult,
  ImportSource,
  ImportStats,
  // Warning/Error types
  ImportWarning,
  ParseResult,
  ParsedAuth,
  ParsedCollection,
  ParsedEnvironment,
  ParsedFolder,
  ParsedRequest,
  QueryParam,
  // Validation types
  ValidationResult,
} from './types';

// Strategy interface for creating custom parsers
export { BaseImportStrategy } from './import-strategy';
export type { ImportStrategy } from './import-strategy';

// Factory for parsing imports
export { ImportFactory, getImportFactory } from './import-factory';

// Built-in parsers (for direct access if needed)
export { PostmanV1Parser } from './postman-v1-parser';
export { PostmanV2Parser } from './postman-v2-parser';



