import { describe, expect, it } from 'vitest';
import { EnvFileParser } from '../../../../../electron/lib/environment/env-file-parser';

describe('EnvFileParser', () => {
  const parser = new EnvFileParser();

  describe('detect', () => {
    it('should detect valid .env format with = separator', () => {
      const content = 'KEY=VALUE\nOTHER=val';
      expect(parser.detect(content)).toBe(true);
    });

    it('should detect valid .env format with : separator', () => {
      const content = 'KEY: VALUE\nOTHER: val';
      expect(parser.detect(content)).toBe(true);
    });

    it('should ignore comments when detecting', () => {
      const content = '# This is a comment\nKEY=VALUE';
      expect(parser.detect(content)).toBe(true);
    });

    it('should not detect content with no key-value pairs', () => {
      expect(parser.detect('not an env file at all')).toBe(false);
      expect(parser.detect('# Only comments')).toBe(false);
    });
  });

  describe('getConfidence', () => {
    it('should return confidence based on key-value pair ratio', () => {
      const content = 'KEY=VALUE\n# Comment\nOTHER=val';
      // 2 KV pairs, 3 non-empty lines total (including comment)
      expect(parser.getConfidence(content)).toBeCloseTo(2/3);
    });

    it('should return 0 for empty content', () => {
      expect(parser.getConfidence('')).toBe(0);
    });
  });

  describe('parse', () => {
    it('should parse basic key-value pairs', async () => {
      const content = 'KEY=VALUE\n# Comment\nDB_PASS: secret';
      const result = await parser.parse(content);
      expect(result).toHaveLength(1);
      expect(result[0].variables).toEqual({
        KEY: 'VALUE',
        DB_PASS: 'secret'
      });
    });

    it('should extract environment name from specific comment', async () => {
      const content = '# Environment: My Custom Env\nKEY=VALUE';
      const result = await parser.parse(content);
      expect(result[0].displayName).toBe('My Custom Env');
      expect(result[0].name).toBe('my_custom_env');
    });

    it('should strip quotes from values', async () => {
      const content = 'V1="double quoted"\nV2=\'single quoted\'\nV3=unquoted';
      const result = await parser.parse(content);
      expect(result[0].variables).toEqual({
        V1: 'double quoted',
        V2: 'single quoted',
        V3: 'unquoted'
      });
    });

    it('should handle complex environment name sanitation', async () => {
       const content = '# Environment: Test Env! @123\nK=V';
       const result = await parser.parse(content);
       expect(result[0].name).toBe('test_env_123');
    });

    it('should fallback to first comment as environment name if no explicit name is found', async () => {
       const content = '# This is a description\nK=V';
       const result = await parser.parse(content);
       expect(result[0].displayName).toBe('This is a description');
    });
  });
});
