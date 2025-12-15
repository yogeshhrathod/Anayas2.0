/**
 * Postman Environment Format Parser
 *
 * Parser for Postman environment format (v1.0).
 * Supports Postman environment JSON structure.
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

interface PostmanEnvironment {
  id?: string;
  name: string;
  values: Array<{
    key: string;
    value: string;
    enabled?: boolean;
    type?: string;
  }>;
  _postman_variable_scope?: string;
  _postman_exported_at?: string;
  _postman_exported_using?: string;
}

export class PostmanParser
  extends BaseEnvironmentImportStrategy
  implements EnvironmentImportStrategy
{
  readonly formatName = 'postman';
  readonly displayName = 'Postman Environment';
  readonly fileExtensions = ['.json'];
  readonly mimeTypes = ['application/json'];

  detect(content: string): boolean {
    const parsed = this.safeParseJson(content);
    if (!parsed || typeof parsed !== 'object') return false;

    const env = parsed as Record<string, unknown>;

    // Check for Postman environment structure
    return (
      typeof env.name === 'string' &&
      Array.isArray(env.values) &&
      (env._postman_variable_scope === 'environment' ||
        env._postman_exported_using === 'Postman')
    );
  }

  getConfidence(content: string): number {
    if (!this.detect(content)) return 0;

    const parsed = this.safeParseJson(content);
    if (!parsed || typeof parsed !== 'object') return 0;

    const env = parsed as Record<string, unknown>;

    // High confidence if it has Postman-specific fields
    let confidence = 0.5;

    if (env._postman_variable_scope === 'environment') {
      confidence = 1.0;
    } else if (env._postman_exported_using === 'Postman') {
      confidence = 0.9;
    } else if (Array.isArray(env.values)) {
      confidence = 0.8;
    }

    return confidence;
  }

  async parse(content: string): Promise<Environment[]> {
    const parsed = this.safeParseJson(content);
    if (!parsed) {
      throw new Error('Invalid JSON format');
    }

    // Handle array of Postman environments
    if (Array.isArray(parsed)) {
      return parsed.map(env => this.parsePostmanEnvironment(env));
    }

    // Single Postman environment
    return [this.parsePostmanEnvironment(parsed as PostmanEnvironment)];
  }

  /**
   * Parse a single Postman environment to Anayas format
   */
  private parsePostmanEnvironment(postmanEnv: PostmanEnvironment): Environment {
    const variables: Record<string, string> = {};

    // Convert Postman values array to variables object
    if (Array.isArray(postmanEnv.values)) {
      for (const item of postmanEnv.values) {
        // Only include enabled variables (default to enabled if not specified)
        if (item.enabled !== false) {
          variables[item.key] = item.value || '';
        }
      }
    }

    // Use Postman name as both name and displayName
    const name = postmanEnv.name || 'Imported Postman Environment';
    const sanitizedName = this.sanitizeName(name);

    return {
      name: sanitizedName,
      displayName: name,
      variables,
      isDefault: 0,
    };
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
        .replace(/^_|_$/g, '') || 'imported_postman_environment'
    );
  }
}
