/**
 * Environment Import/Export Types
 *
 * Shared TypeScript interfaces for the environment import/export system.
 */

// Note: Environment type is defined in src/types/entities.ts
// We'll import it at runtime or use a compatible interface
export interface Environment {
  id?: number;
  name: string;
  displayName: string;
  variables: Record<string, string>;
  isDefault?: number;
  lastUsed?: string;
  createdAt?: string;
}

/**
 * Import result for environment import operations
 */
export interface EnvironmentImportResult {
  success: boolean;
  environments: Environment[];
  warnings: string[];
  errors: string[];
  conflicts: EnvironmentConflict[];
}

/**
 * Conflict detected during import
 */
export interface EnvironmentConflict {
  environmentName: string;
  existingId: number;
  importedEnvironment: Environment;
}

/**
 * Export result for environment export operations
 */
export interface EnvironmentExportResult {
  success: boolean;
  content: string;
  filename: string;
  error?: string;
}

/**
 * Format detection result
 */
export interface FormatDetectionResult {
  format: 'json' | 'env' | 'postman' | 'unknown';
  isValid: boolean;
  confidence: number; // 0-1
}

/**
 * Format information
 */
export interface FormatInfo {
  name: string;
  displayName: string;
  fileExtensions: string[];
  supportsImport: boolean;
  supportsExport: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
