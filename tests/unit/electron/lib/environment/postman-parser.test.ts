import { describe, expect, it } from 'vitest';
import { PostmanParser } from '../../../../../electron/lib/environment/postman-parser';

describe('PostmanParser', () => {
  const parser = new PostmanParser();

  describe('detect', () => {
    it('should detect valid Postman environment format', () => {
      const content = JSON.stringify({
        name: 'Postman Env',
        values: [{ key: 'k', value: 'v' }],
        _postman_variable_scope: 'environment'
      });
      expect(parser.detect(content)).toBe(true);
    });

    it('should detect Postman format with exported_using field', () => {
       const content = JSON.stringify({
        name: 'Postman Env',
        values: [],
        _postman_exported_using: 'Postman'
      });
      expect(parser.detect(content)).toBe(true);
    });

    it('should not detect non-Postman JSON', () => {
      const content = JSON.stringify({ name: 'env', variables: {} });
      expect(parser.detect(content)).toBe(false);
    });
  });

  describe('getConfidence', () => {
    it('should return high confidence for Postman specific structure', () => {
       const content = JSON.stringify({
        name: 'Postman Env',
        values: [],
        _postman_variable_scope: 'environment'
      });
      expect(parser.getConfidence(content)).toBe(1.0);
    });

    it('should return lower confidence for generic structures', () => {
       const content = JSON.stringify({
        name: 'Postman Env',
        values: []
      });
      // Detect might return false if no Postman fields are present
      // But based on implementation:
      // (env._postman_variable_scope === 'environment' || env._postman_exported_using === 'Postman')
      // So without these fields, detect returns false, so confidence 0.
      expect(parser.getConfidence(content)).toBe(0);
    });
  });

  describe('parse', () => {
    it('should parse Postman variables correctly', async () => {
      const content = JSON.stringify({
        name: 'Postman Env',
        values: [
          { key: 'key1', value: 'value1', enabled: true },
          { key: 'key2', value: 'value2', enabled: false },
          { key: 'key3', value: 'value3' }
        ],
        _postman_variable_scope: 'environment'
      });
      const result = await parser.parse(content);
      expect(result).toHaveLength(1);
      expect(result[0].variables).toEqual({
        key1: 'value1',
        key3: 'value3'
      });
      expect(result[0].displayName).toBe('Postman Env');
    });

    it('should handle array of Postman environments', async () => {
        const content = JSON.stringify([
          { name: 'env1', values: [{ key: 'k1', value: 'v1' }] },
          { name: 'env2', values: [{ key: 'k2', value: 'v2' }] }
        ]);
        const result = await parser.parse(content);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('env1');
        expect(result[1].name).toBe('env2');
    });

    it('should handle missing values array gracefully', async () => {
       const content = JSON.stringify({
        name: 'Empty Env',
        _postman_variable_scope: 'environment'
      });
      const result = await parser.parse(content);
      expect(result[0].variables).toEqual({});
    });
  });
});
