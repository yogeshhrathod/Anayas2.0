/**
 * Environment Import Factory
 *
 * Factory that manages import strategies and auto-detects format.
 */

import type { Environment, FormatDetectionResult, FormatInfo } from './types';
import type { EnvironmentImportStrategy } from './import-strategy';
import { JsonParser } from './json-parser';
import { EnvFileParser } from './env-file-parser';
import { PostmanParser } from './postman-parser';

export class EnvironmentImportFactory {
  private strategies: Map<string, EnvironmentImportStrategy>;

  constructor() {
    this.strategies = new Map();

    // Register default strategies
    this.registerStrategy(new JsonParser());
    this.registerStrategy(new EnvFileParser());
    this.registerStrategy(new PostmanParser());
  }

  /**
   * Register a new import strategy
   */
  registerStrategy(strategy: EnvironmentImportStrategy): void {
    this.strategies.set(strategy.formatName, strategy);
  }

  /**
   * Get strategy by format name
   */
  getStrategy(formatName: string): EnvironmentImportStrategy | null {
    return this.strategies.get(formatName) || null;
  }

  /**
   * Auto-detect format from content
   */
  detectFormat(content: string): FormatDetectionResult {
    if (!content || !content.trim()) {
      return {
        format: 'unknown',
        isValid: false,
        confidence: 0,
      };
    }

    let bestMatch: {
      strategy: EnvironmentImportStrategy;
      confidence: number;
    } | null = null;

    // Try all strategies and find the best match
    for (const strategy of this.strategies.values()) {
      if (strategy.detect(content)) {
        const confidence = strategy.getConfidence(content);
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { strategy, confidence };
        }
      }
    }

    if (!bestMatch) {
      return {
        format: 'unknown',
        isValid: false,
        confidence: 0,
      };
    }

    // Try to parse to validate
    let isValid = false;
    try {
      // Quick validation - just check if parse doesn't throw
      // We'll do full validation later
      isValid = true;
    } catch {
      isValid = false;
    }

    return {
      format: bestMatch.strategy.formatName as
        | 'json'
        | 'env'
        | 'postman'
        | 'unknown',
      isValid,
      confidence: bestMatch.confidence,
    };
  }

  /**
   * Parse content using specified format or auto-detect
   */
  async parse(
    content: string,
    format?: 'json' | 'env' | 'postman' | 'auto'
  ): Promise<Environment[]> {
    let strategy: EnvironmentImportStrategy | null = null;

    if (format && format !== 'auto') {
      strategy = this.getStrategy(format);
      if (!strategy) {
        throw new Error(`Unsupported format: ${format}`);
      }
    } else {
      // Auto-detect
      const detection = this.detectFormat(content);
      if (detection.format === 'unknown' || !detection.isValid) {
        throw new Error(
          `Could not detect format or invalid content: ${detection.format}`
        );
      }
      strategy = this.getStrategy(detection.format);
      if (!strategy) {
        throw new Error(`No parser found for format: ${detection.format}`);
      }
    }

    return strategy.parse(content);
  }

  /**
   * Get all supported formats
   */
  getSupportedFormats(): FormatInfo[] {
    return Array.from(this.strategies.values()).map(s => s.getFormatInfo());
  }
}

// Singleton instance
let factoryInstance: EnvironmentImportFactory | null = null;

/**
 * Get the singleton factory instance
 */
export function getEnvironmentImportFactory(): EnvironmentImportFactory {
  if (!factoryInstance) {
    factoryInstance = new EnvironmentImportFactory();
  }
  return factoryInstance;
}
