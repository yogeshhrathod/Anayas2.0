/**
 * Import Strategy Factory
 *
 * Manages registered import strategies and provides format detection.
 * Implements the Factory Pattern for creating the right parser.
 */

import type { ImportStrategy } from './import-strategy';
import type { FormatDetectionResult, FormatInfo, ParseResult } from './types';

/**
 * Factory for managing import strategies.
 * Singleton pattern - use ImportFactory.getInstance()
 */
export class ImportFactory {
  private static instance: ImportFactory | null = null;
  private strategies: Map<string, ImportStrategy> = new Map();
  private initialized = false;

  private constructor() {}

  /**
   * Get the singleton instance of ImportFactory.
   */
  static getInstance(): ImportFactory {
    if (!ImportFactory.instance) {
      ImportFactory.instance = new ImportFactory();
    }
    return ImportFactory.instance;
  }

  /**
   * Initialize the factory with default strategies.
   * Called lazily on first use.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Lazy import parsers to enable code splitting
    const [{ PostmanV2Parser }, { PostmanV1Parser }] = await Promise.all([
      import('./postman-v2-parser'),
      import('./postman-v1-parser'),
    ]);

    // Register default strategies
    this.register(new PostmanV2Parser());
    this.register(new PostmanV1Parser());

    this.initialized = true;
  }

  /**
   * Register a new import strategy.
   *
   * @param strategy - The strategy to register
   */
  register(strategy: ImportStrategy): void {
    this.strategies.set(strategy.formatName, strategy);
  }

  /**
   * Unregister a strategy by name.
   *
   * @param formatName - The format name to unregister
   */
  unregister(formatName: string): void {
    this.strategies.delete(formatName);
  }

  /**
   * Get a registered strategy by name.
   *
   * @param formatName - The format name
   * @returns The strategy or undefined
   */
  getStrategy(formatName: string): ImportStrategy | undefined {
    return this.strategies.get(formatName);
  }

  /**
   * Detect the format of the given content.
   *
   * @param content - Raw file content
   * @returns Format detection result
   */
  async detectFormat(content: string): Promise<FormatDetectionResult> {
    await this.initialize();

    // Try to parse as JSON first
    try {
      JSON.parse(content);
    } catch {
      return {
        format: null,
        isValid: false,
        confidence: 0,
      };
    }

    // Find the best matching strategy
    let bestMatch: ImportStrategy | null = null;
    let bestConfidence = 0;

    for (const strategy of this.strategies.values()) {
      if (strategy.detect(content)) {
        const confidence = strategy.getConfidence(content);
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = strategy;
        }
      }
    }

    if (bestMatch) {
      return {
        format: bestMatch.formatName,
        version: bestMatch.getVersion(content),
        isValid: true,
        confidence: bestConfidence,
      };
    }

    return {
      format: null,
      isValid: false,
      confidence: 0,
    };
  }

  /**
   * Parse content using auto-detected or specified format.
   *
   * @param content - Raw file content
   * @param format - Optional format name (auto-detect if not provided)
   * @returns Parse result
   */
  async parse(content: string, format?: string): Promise<ParseResult> {
    await this.initialize();

    try {
      let strategy: ImportStrategy | undefined;

      if (format) {
        // Use specified format
        strategy = this.strategies.get(format);
        if (!strategy) {
          return {
            success: false,
            error: `Unsupported format: ${format}`,
          };
        }
      } else {
        // Auto-detect format
        const detection = await this.detectFormat(content);
        if (!detection.format) {
          return {
            success: false,
            error:
              'Unable to detect import format. Please ensure the file is a valid Postman collection.',
          };
        }
        strategy = this.strategies.get(detection.format);
      }

      if (!strategy) {
        return {
          success: false,
          error: 'No suitable parser found for this file format.',
        };
      }

      // Parse the content
      console.log(
        '[ImportFactory] Parsing with strategy:',
        strategy.formatName
      );
      const result = await strategy.parse(content);
      console.log('[ImportFactory] Parse complete, validating...');

      // Validate the result
      const validation = strategy.validate(result);

      // Add validation warnings/errors to result
      result.warnings.push(...validation.warnings);
      result.errors.push(...validation.errors);

      console.log('[ImportFactory] Validation complete, returning result');
      return {
        success: true,
        result,
      };
    } catch (error: any) {
      console.error('[ImportFactory] Parse error:', error);
      return {
        success: false,
        error: error.message || 'Failed to parse collection',
      };
    }
  }

  /**
   * Get list of supported formats.
   *
   * @returns Array of format information
   */
  async getSupportedFormats(): Promise<FormatInfo[]> {
    await this.initialize();

    return Array.from(this.strategies.values()).map(s => s.getFormatInfo());
  }

  /**
   * Check if a format is supported.
   *
   * @param formatName - The format name to check
   * @returns true if supported
   */
  isFormatSupported(formatName: string): boolean {
    return this.strategies.has(formatName);
  }

  /**
   * Get the count of registered strategies.
   */
  get strategyCount(): number {
    return this.strategies.size;
  }

  /**
   * Reset the factory (mainly for testing).
   */
  static reset(): void {
    if (ImportFactory.instance) {
      ImportFactory.instance.strategies.clear();
      ImportFactory.instance.initialized = false;
    }
    ImportFactory.instance = null;
  }
}

// Export singleton getter for convenience
export const getImportFactory = () => ImportFactory.getInstance();
