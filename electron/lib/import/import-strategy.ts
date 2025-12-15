/**
 * Import Strategy Interface
 *
 * Base interface that all import format parsers must implement.
 * Uses the Strategy Pattern for extensible format support.
 */

import type { FormatInfo, ImportResult, ValidationResult } from './types';

/**
 * Abstract base interface for import strategies.
 * Each format (Postman v1, v2, Insomnia, OpenAPI, etc.) implements this interface.
 */
export interface ImportStrategy {
  /**
   * Format identifier (e.g., 'postman-v2', 'postman-v1', 'insomnia')
   */
  readonly formatName: string;

  /**
   * Human-readable display name
   */
  readonly displayName: string;

  /**
   * Supported file extensions (e.g., ['.json'])
   */
  readonly fileExtensions: string[];

  /**
   * Supported MIME types
   */
  readonly mimeTypes: string[];

  /**
   * Detect if the content matches this format.
   *
   * @param content - Raw file content (usually JSON string)
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
   * Get detected version if applicable.
   *
   * @param content - Raw file content
   * @returns Version string or undefined
   */
  getVersion(content: string): string | undefined;

  /**
   * Parse the content into a normalized ImportResult.
   *
   * @param content - Raw file content
   * @returns Promise resolving to ImportResult
   * @throws Error if parsing fails critically
   */
  parse(content: string): Promise<ImportResult>;

  /**
   * Validate an import result.
   *
   * @param result - The import result to validate
   * @returns Validation result with errors and warnings
   */
  validate(result: ImportResult): ValidationResult;

  /**
   * Get format information.
   *
   * @returns FormatInfo object
   */
  getFormatInfo(): FormatInfo;
}

/**
 * Abstract base class with common functionality for import strategies.
 * Parsers can extend this for convenience methods.
 */
export abstract class BaseImportStrategy implements ImportStrategy {
  abstract readonly formatName: string;
  abstract readonly displayName: string;
  abstract readonly fileExtensions: string[];
  abstract readonly mimeTypes: string[];

  abstract detect(content: string): boolean;
  abstract getConfidence(content: string): number;
  abstract getVersion(content: string): string | undefined;
  abstract parse(content: string): Promise<ImportResult>;

  /**
   * Default validation implementation.
   * Subclasses can override for format-specific validation.
   */
  validate(result: ImportResult): ValidationResult {
    const errors: ImportResult['errors'] = [];
    const warnings: ImportResult['warnings'] = [];

    // Validate collection name
    if (!result.collection.name?.trim()) {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Collection name is required',
        skipped: false,
      });
    }

    // Validate requests
    for (const request of result.requests) {
      // Check for empty body on POST/PUT/PATCH
      if (
        ['POST', 'PUT', 'PATCH'].includes(request.method) &&
        !request.body?.trim()
      ) {
        warnings.push({
          code: 'EMPTY_BODY',
          message: `Request "${request.name}" has no body`,
          itemName: request.name,
        });
      }

      // Check for invalid URL
      if (!request.url?.trim()) {
        errors.push({
          code: 'MISSING_URL',
          message: `Request "${request.name}" has no URL`,
          itemName: request.name,
          skipped: true,
        });
      }
    }

    // Check for deep nesting
    const maxDepth = Math.max(
      ...result.folders.map(f => f.path.split('/').length),
      0
    );
    if (maxDepth > 10) {
      warnings.push({
        code: 'DEEP_NESTING',
        message: `Folder nesting exceeds 10 levels (found ${maxDepth})`,
      });
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
      mimeTypes: this.mimeTypes,
    };
  }

  /**
   * Utility: Generate a unique temporary ID.
   */
  protected generateTempId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility: Safely parse JSON with error handling.
   */
  protected safeParseJson(content: string): any | null {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Utility: Create an empty import result.
   */
  protected createEmptyResult(name: string, format: string): ImportResult {
    return {
      source: {
        format,
        originalName: name,
      },
      collection: {
        name,
      },
      folders: [],
      requests: [],
      environments: [],
      warnings: [],
      errors: [],
      stats: {
        totalFolders: 0,
        totalRequests: 0,
        totalEnvironments: 0,
        skippedItems: 0,
      },
    };
  }

  /**
   * Utility: Normalize HTTP method.
   */
  protected normalizeMethod(
    method: string | undefined
  ): ImportResult['requests'][0]['method'] {
    const normalized = (method || 'GET').toUpperCase();
    const validMethods = [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'HEAD',
      'OPTIONS',
    ];
    return validMethods.includes(normalized)
      ? (normalized as ImportResult['requests'][0]['method'])
      : 'GET';
  }
}



