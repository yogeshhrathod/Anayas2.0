/**
 * Environment Export Generator
 *
 * Generates export content in different formats (JSON, .env, Postman).
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

export type ExportFormat = 'json' | 'env' | 'postman';

export interface ExportOptions {
  format: ExportFormat;
  environments: Environment[];
}

export class EnvironmentExportGenerator {
  /**
   * Generate export content
   */
  generate(options: ExportOptions): string {
    switch (options.format) {
      case 'json':
        return this.generateJson(options.environments);
      case 'env':
        return this.generateEnv(options.environments);
      case 'postman':
        return this.generatePostman(options.environments);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Generate filename for export
   */
  generateFilename(format: ExportFormat, count: number): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'env' ? '.env' : '.json';

    if (count === 1) {
      return `environment-${timestamp}${extension}`;
    }
    return `environments-${timestamp}${extension}`;
  }

  /**
   * Generate JSON format export
   */
  private generateJson(environments: Environment[]): string {
    // If single environment, export as object, otherwise as array
    if (environments.length === 1) {
      return JSON.stringify(this.sanitizeForExport(environments[0]), null, 2);
    }
    return JSON.stringify(
      environments.map(env => this.sanitizeForExport(env)),
      null,
      2
    );
  }

  /**
   * Generate .env format export
   */
  private generateEnv(environments: Environment[]): string {
    if (environments.length === 0) {
      return '';
    }

    // For .env format, we can only export one environment
    // If multiple, export the first one with a comment
    const env = environments[0];
    const lines: string[] = [];

    // Add environment name as comment
    lines.push(`# Environment: ${env.displayName}`);
    lines.push('');

    // Add variables
    for (const [key, value] of Object.entries(env.variables || {})) {
      // Escape value if needed
      const escapedValue = this.escapeEnvValue(value);
      lines.push(`${key}=${escapedValue}`);
    }

    // If multiple environments, add comment
    if (environments.length > 1) {
      lines.push('');
      lines.push(
        `# Note: Only exported first environment. Total: ${environments.length}`
      );
    }

    return lines.join('\n');
  }

  /**
   * Generate Postman format export
   */
  private generatePostman(environments: Environment[]): string {
    if (environments.length === 0) {
      return JSON.stringify([]);
    }

    // Convert environments to Postman format
    const postmanEnvs = environments.map(env => ({
      id: this.generateUuid(),
      name: env.displayName,
      values: Object.entries(env.variables || {}).map(([key, value]) => ({
        key,
        value: value || '',
        enabled: true,
        type: 'default',
      })),
      _postman_variable_scope: 'environment',
      _postman_exported_at: new Date().toISOString(),
      _postman_exported_using: 'Anayas',
    }));

    // If single environment, export as object, otherwise as array
    if (postmanEnvs.length === 1) {
      return JSON.stringify(postmanEnvs[0], null, 2);
    }
    return JSON.stringify(postmanEnvs, null, 2);
  }

  /**
   * Sanitize environment for export (remove internal fields)
   */
  private sanitizeForExport(env: Environment): Partial<Environment> {
    return {
      name: env.name,
      displayName: env.displayName,
      variables: env.variables,
      // Optionally include isDefault, but not id, lastUsed, createdAt
      ...(env.isDefault !== undefined && { isDefault: env.isDefault }),
    };
  }

  /**
   * Escape value for .env format
   */
  private escapeEnvValue(value: string): string {
    // If value contains spaces, quotes, or special chars, wrap in quotes
    if (/[\s"$\\]/.test(value)) {
      // Escape backslashes and quotes
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${escaped}"`;
    }
    return value;
  }

  /**
   * Generate a simple UUID-like string
   */
  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
