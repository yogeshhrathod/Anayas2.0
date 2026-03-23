import { describe, expect, it } from 'vitest';
import { EnvironmentExportGenerator } from '../../../../../electron/lib/environment/export-generator';

describe('EnvironmentExportGenerator', () => {
  const generator = new EnvironmentExportGenerator();
  const environments: any[] = [
    {
      name: 'env-1',
      displayName: 'Env 1',
      variables: { key1: 'value1', key2: 'value with spaces' }
    },
    {
       name: 'env-2',
       displayName: 'Env 2',
       variables: { key3: 'value3' }
    }
  ];

  describe('generate', () => {
    it('should generate JSON format correctly for single environment', () => {
      const result = generator.generate({ format: 'json', environments: [environments[0]] });
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('env-1');
      expect(parsed.variables.key1).toBe('value1');
    });

    it('should generate JSON array for multiple environments', () => {
      const result = generator.generate({ format: 'json', environments });
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('should generate .env format correctly', () => {
      const result = generator.generate({ format: 'env', environments: [environments[0]] });
      expect(result).toContain('# Environment: Env 1');
      expect(result).toContain('key1=value1');
      expect(result).toContain('key2="value with spaces"');
    });

    it('should generate Postman format correctly', () => {
      const result = generator.generate({ format: 'postman', environments: [environments[0]] });
      const parsed = JSON.parse(result);
      expect(parsed._postman_variable_scope).toBe('environment');
      expect(parsed.values).toHaveLength(2);
      expect(parsed.values[0].key).toBe('key1');
    });

    it('should throw for unsupported format', () => {
      expect(() => generator.generate({ format: 'invalid' as any, environments: [] })).toThrow('Unsupported export format');
    });
  });

  describe('generateFilename', () => {
    it('should generate correct filename for single environment', () => {
      const filename = generator.generateFilename('json', 1);
      expect(filename).toMatch(/^environment-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should generate correct filename for multiple environments', () => {
      const filename = generator.generateFilename('json', 2);
      expect(filename).toMatch(/^environments-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should use .env extension for env format', () => {
      const filename = generator.generateFilename('env', 1);
      expect(filename).toMatch(/\.env$/);
    });
  });
});
