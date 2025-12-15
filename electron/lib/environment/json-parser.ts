/**
 * JSON Format Parser
 *
 * Parser for Anayas native JSON format.
 * Supports both single environment and array of environments.
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

export class JsonParser
  extends BaseEnvironmentImportStrategy
  implements EnvironmentImportStrategy
{
  readonly formatName = 'json';
  readonly displayName = 'JSON (Anayas)';
  readonly fileExtensions = ['.json'];
  readonly mimeTypes = ['application/json'];

  detect(content: string): boolean {
    const parsed = this.safeParseJson(content);
    if (!parsed) return false;

    // Check if it's an array of environments
    if (Array.isArray(parsed)) {
      return parsed.length > 0 && this.isEnvironmentLike(parsed[0]);
    }

    // Check if it's a single environment
    return this.isEnvironmentLike(parsed);
  }

  getConfidence(content: string): number {
    if (!this.detect(content)) return 0;

    const parsed = this.safeParseJson(content);
    if (!parsed) return 0;

    // High confidence if it has environment structure
    if (Array.isArray(parsed)) {
      return parsed.every(item => this.isEnvironmentLike(item)) ? 1.0 : 0.5;
    }

    return this.isEnvironmentLike(parsed) ? 1.0 : 0.5;
  }

  async parse(content: string): Promise<Environment[]> {
    const parsed = this.safeParseJson(content);
    if (!parsed) {
      throw new Error('Invalid JSON format');
    }

    let environments: unknown[];

    // Handle array of environments
    if (Array.isArray(parsed)) {
      environments = parsed;
    } else {
      // Single environment
      environments = [parsed];
    }

    // Normalize to Environment format
    return environments.map(env =>
      this.normalizeEnvironment(env as Record<string, unknown>)
    );
  }

  /**
   * Check if an object looks like an environment
   */
  private isEnvironmentLike(obj: unknown): boolean {
    if (!obj || typeof obj !== 'object') return false;

    const env = obj as Record<string, unknown>;

    // Must have name or displayName
    const hasName =
      typeof env.name === 'string' || typeof env.displayName === 'string';

    // Must have variables object
    const hasVariables = env.variables && typeof env.variables === 'object';

    return hasName && hasVariables;
  }

  /**
   * Normalize parsed environment to Environment interface
   */
  private normalizeEnvironment(env: Record<string, unknown>): Environment {
    const isDefault =
      env.isDefault !== undefined
        ? typeof env.isDefault === 'number'
          ? env.isDefault
          : env.isDefault
            ? 1
            : 0
        : undefined;

    return {
      id: typeof env.id === 'number' ? env.id : undefined,
      name:
        (typeof env.name === 'string' ? env.name : null) ||
        (typeof env.displayName === 'string' ? env.displayName : null) ||
        'Unnamed',
      displayName:
        (typeof env.displayName === 'string' ? env.displayName : null) ||
        (typeof env.name === 'string' ? env.name : null) ||
        'Unnamed',
      variables:
        env.variables && typeof env.variables === 'object'
          ? (env.variables as Record<string, string>)
          : {},
      isDefault,
      lastUsed: typeof env.lastUsed === 'string' ? env.lastUsed : undefined,
      createdAt: typeof env.createdAt === 'string' ? env.createdAt : undefined,
    };
  }
}
