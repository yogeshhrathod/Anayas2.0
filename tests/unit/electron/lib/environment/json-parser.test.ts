import { describe, expect, it } from 'vitest';
import { JsonParser } from '../../../../../electron/lib/environment/json-parser';

describe('JsonParser', () => {
  const parser = new JsonParser();

  describe('detect', () => {
    it('should detect a valid single environment object', () => {
      const content = JSON.stringify({
        name: 'test-env',
        variables: { key: 'value' }
      });
      expect(parser.detect(content)).toBe(true);
    });

    it('should detect an array of environments', () => {
      const content = JSON.stringify([{
        name: 'test-env',
        variables: { key: 'value' }
      }]);
      expect(parser.detect(content)).toBe(true);
    });

    it('should not detect invalid JSON', () => {
      expect(parser.detect('not json')).toBe(false);
    });

    it('should not detect JSON without environment structure', () => {
      expect(parser.detect(JSON.stringify({ some: 'other', data: 123 }))).toBe(false);
    });
  });

  describe('getConfidence', () => {
    it('should return 1.0 for valid environment structures', () => {
      const content = JSON.stringify({
        name: 'test-env',
        variables: { key: 'value' }
      });
      expect(parser.getConfidence(content)).toBe(1.0);
    });

    it('should return 0 for invalid formats', () => {
      expect(parser.getConfidence('invalid')).toBe(0);
    });
  });

  describe('parse', () => {
    it('should parse and normalize a single environment', async () => {
      const content = JSON.stringify({
        name: 'test-env',
        variables: { key: 'value' }
      });
      const result = await parser.parse(content);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-env');
      expect(result[0].displayName).toBe('test-env');
      expect(result[0].variables).toEqual({ key: 'value' });
    });

    it('should parse name and displayName correctly', async () => {
       const content = JSON.stringify({
        displayName: 'My Env',
        variables: {}
      });
      const result = await parser.parse(content);
      expect(result[0].displayName).toBe('My Env');
      expect(result[0].name).toBe('My Env');
    });

    it('should handle array of environments', async () => {
      const content = JSON.stringify([
        { name: 'env1', variables: { k1: 'v1' } },
        { name: 'env2', variables: { k2: 'v2' } }
      ]);
      const result = await parser.parse(content);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('env1');
      expect(result[1].name).toBe('env2');
    });

    it('should throw error for invalid JSON when parsing', async () => {
      await expect(parser.parse('not json')).rejects.toThrow('Invalid JSON format');
    });

    it('should handle missing optional fields', async () => {
      const content = JSON.stringify({ name: 'env', variables: {} });
      const [env] = await parser.parse(content);
      expect(env.isDefault).toBeUndefined();
      expect(env.lastUsed).toBeUndefined();
    });

    it('should normalize isDefault from boolean to number', async () => {
      const content = JSON.stringify({ name: 'env', variables: {}, isDefault: true });
      const [env] = await parser.parse(content);
      expect(env.isDefault).toBe(1);
    });
  });
  
  describe('BaseEnvironmentImportStrategy features', () => {
    it('should validate correctly', () => {
       const envs = [{ name: 'test', displayName: 'test', variables: { 'k': 'v' } }];
       const result = parser.validate(envs);
       expect(result.isValid).toBe(true);
    });
    
    it('should report errors for invalid environments', () => {
       // @ts-ignore
       const envs = [{ name: '', variables: null }];
       const result = parser.validate(envs as any);
       expect(result.isValid).toBe(false);
       expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should return format info', () => {
       const info = parser.getFormatInfo();
       expect(info.name).toBe('json');
       expect(info.displayName).toBe('JSON (Anayas)');
    });
  });
});
