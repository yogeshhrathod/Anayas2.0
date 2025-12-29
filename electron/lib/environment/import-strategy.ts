/**
 * Environment Import Strategy Interface
 *
 * Base interface that all environment import format parsers must implement.
 * Uses the Strategy Pattern for extensible format support.
 */

import type { Environment, FormatInfo, ValidationResult } from './types';

/**
 * Abstract base interface for environment import strategies.
 * Each format (JSON, .env, Postman) implements this interface.
 */
export interface EnvironmentImportStrategy {
  /**
   * Format identifier (e.g., 'json', 'env', 'postman')
   */
  readonly formatName: string;

  /**
   * Human-readable display name
   */
  readonly displayName: string;

  /**
   * Supported file extensions (e.g., ['.json', '.env'])
   */
  readonly fileExtensions: string[];

  /**
   * Supported MIME types
   */
  readonly mimeTypes: string[];

  /**
   * Detect if the content matches this format.
   *
   * @param content - Raw file content
   * @returns true if this parser can handle the content
   */
  detect(content: string): boolean;

  /**
   * Get detection confidence score.
   *
   * @param content - Raw file content
   * @returns Confidence score 0-1 (1 = definitely this format)
   */
  getConfidence(content: string): number;

  /**
   * Parse the content into normalized Environment objects.
   *
   * @param content - Raw file content
   * @returns Promise resolving to array of environments
   * @throws Error if parsing fails critically
   */
  parse(content: string): Promise<Environment[]>;

  /**
   * Validate parsed environments.
   *
   * @param environments - The environments to validate
   * @returns Validation result with errors and warnings
   */
  validate(environments: Environment[]): ValidationResult;

  /**
   * Get format information.
   *
   * @returns FormatInfo object
   */
  getFormatInfo(): FormatInfo;
}

/**
 * Abstract base class with common functionality for import strategies.
 */
export abstract class BaseEnvironmentImportStrategy
  implements EnvironmentImportStrategy
{
  abstract readonly formatName: string;
  abstract readonly displayName: string;
  abstract readonly fileExtensions: string[];
  abstract readonly mimeTypes: string[];

  abstract detect(content: string): boolean;
  abstract getConfidence(content: string): number;
  abstract parse(content: string): Promise<Environment[]>;

  /**
   * Default validation implementation.
   * Subclasses can override for format-specific validation.
   */
  validate(environments: Environment[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const env of environments) {
      // Validate name
      if (!env.name?.trim()) {
        errors.push(`Environment missing name`);
      }

      // Validate displayName
      if (!env.displayName?.trim()) {
        errors.push(`Environment "${env.name}" missing display name`);
      }

      // Validate variables
      if (!env.variables || typeof env.variables !== 'object') {
        errors.push(`Environment "${env.name}" has invalid variables`);
      } else {
        // Check for empty variable keys
        for (const key of Object.keys(env.variables)) {
          if (!key.trim()) {
            warnings.push(`Environment "${env.name}" has empty variable key`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get format information for this strategy.
   */
  getFormatInfo(): FormatInfo {
    return {
      name: this.formatName,
      displayName: this.displayName,
      fileExtensions: this.fileExtensions,
      supportsImport: true,
      supportsExport: true,
    };
  }

  /**
   * Utility: Safely parse JSON with error handling.
   */
  protected safeParseJson(content: string): unknown | null {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}
