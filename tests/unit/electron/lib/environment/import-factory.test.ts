import { describe, expect, it, vi } from 'vitest';
import { EnvironmentImportFactory } from '../../../../../electron/lib/environment/import-factory';
import { JsonParser } from '../../../../../electron/lib/environment/json-parser';

describe('EnvironmentImportFactory', () => {
  const factory = new EnvironmentImportFactory();

  describe('detectFormat', () => {
    it('should detect JSON format correctly', () => {
      const content = JSON.stringify({ name: 'env', variables: {} });
      const result = factory.detectFormat(content);
      expect(result.format).toBe('json');
      expect(result.isValid).toBe(true);
    });

    it('should detect .env format correctly', () => {
      const content = 'KEY=VALUE';
      const result = factory.detectFormat(content);
      expect(result.format).toBe('env');
    });

    it('should return unknown for empty content', () => {
      expect(factory.detectFormat('').format).toBe('unknown');
    });

    it('should return unknown for completely invalid content', () => {
       expect(factory.detectFormat('!!! not a format !!!').format).toBe('unknown');
    });
  });

  describe('parse', () => {
    it('should parse with explicit format', async () => {
      const content = JSON.stringify({ name: 'env', variables: { k: 'v' } });
      const result = await factory.parse(content, 'json');
      expect(result).toHaveLength(1);
      expect(result[0].variables.k).toBe('v');
    });

    it('should parse with auto-detect', async () => {
      const content = 'K=V';
      const result = await factory.parse(content, 'auto');
      expect(result[0].variables.K).toBe('V');
    });

    it('should throw for unsupported explicit format', async () => {
      await expect(factory.parse('c', 'unknown' as any)).rejects.toThrow('Unsupported format');
    });

    it('should throw if auto-detect fails', async () => {
       await expect(factory.parse('invalid', 'auto')).rejects.toThrow('Could not detect format');
    });
  });

  describe('getStrategy', () => {
    it('should return registered strategy', () => {
      expect(factory.getStrategy('json')).toBeInstanceOf(JsonParser);
      expect(factory.getStrategy('non-existent')).toBeNull();
    });
  });

  describe('getSupportedFormats', () => {
    it('should return all registered formats info', () => {
      const formats = factory.getSupportedFormats();
      expect(formats.map(f => f.name)).toContain('json');
      expect(formats.map(f => f.name)).toContain('env');
      expect(formats.map(f => f.name)).toContain('postman');
    });
  });
});
