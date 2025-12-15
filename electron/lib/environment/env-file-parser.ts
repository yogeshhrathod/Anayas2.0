/**
 * .env File Format Parser
 *
 * Parser for .env file format (key=value pairs).
 * Supports both `=` and `:` separators.
 * Handles comments (lines starting with #).
 */

// Environment type - matches src/types/entities.ts
interface Environment {
  id?: number;
  name: string;
  displayName: string;
  variables: Record<string, string>;
  isDefault?: number;
  lastUsed?: string;
  createdAt?: string;
}
import {
  BaseEnvironmentImportStrategy,
  type EnvironmentImportStrategy,
} from './import-strategy';

export class EnvFileParser
  extends BaseEnvironmentImportStrategy
  implements EnvironmentImportStrategy
{
  readonly formatName = 'env';
  readonly displayName = '.env File';
  readonly fileExtensions = ['.env', '.env.local', '.env.production'];
  readonly mimeTypes = ['text/plain'];

  detect(content: string): boolean {
    const lines = content.split('\n');
    let keyValueCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Check for key=value or key:value pattern
      if (/^[A-Za-z_][A-Za-z0-9_]*\s*[=:]\s*/.test(trimmed)) {
        keyValueCount++;
      }
    }

    // Consider it .env format if we have at least one key-value pair
    return keyValueCount > 0;
  }

  getConfidence(content: string): number {
    if (!this.detect(content)) return 0;

    const lines = content.split('\n');
    let keyValueCount = 0;
    let totalLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      totalLines++;

      // Skip comments
      if (trimmed.startsWith('#')) continue;

      // Check for key=value or key:value pattern
      if (/^[A-Za-z_][A-Za-z0-9_]*\s*[=:]\s*/.test(trimmed)) {
        keyValueCount++;
      }
    }

    if (totalLines === 0) return 0;

    // Confidence based on ratio of key-value pairs
    return Math.min(1.0, keyValueCount / totalLines);
  }

  async parse(content: string): Promise<Environment[]> {
    const lines = content.split('\n');
    const variables: Record<string, string> = {};
    let environmentName = 'Imported Environment';
    let environmentComment = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // Handle comments
      if (trimmed.startsWith('#')) {
        const comment = trimmed.substring(1).trim();

        // Try to extract environment name from comment
        // Format: # Environment: Production
        const nameMatch = comment.match(/^[Ee]nvironment:\s*(.+)/i);
        if (nameMatch) {
          environmentName = nameMatch[1].trim();
        } else {
          environmentComment = comment;
        }
        continue;
      }

      // Parse key=value or key:value
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*[=:]\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        variables[key] = value;
      }
    }

    // If no environment name was found in comments, use filename or default
    if (environmentName === 'Imported Environment' && environmentComment) {
      environmentName = environmentComment;
    }

    // Create single environment from .env file
    const environment: Environment = {
      name: this.sanitizeName(environmentName),
      displayName: environmentName,
      variables,
      isDefault: 0,
    };

    return [environment];
  }

  /**
   * Sanitize environment name for use as internal identifier
   */
  private sanitizeName(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '') || 'imported_environment'
    );
  }
}
