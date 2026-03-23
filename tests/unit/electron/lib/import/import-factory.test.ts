import { describe, expect, it, beforeEach } from 'vitest';
import { ImportFactory } from '../../../../../electron/lib/import/import-factory';
import { PostmanV2Parser } from '../../../../../electron/lib/import/postman-v2-parser';

describe('ImportFactory', () => {
  let factory: ImportFactory;

  beforeEach(() => {
    ImportFactory.reset();
    factory = ImportFactory.getInstance();
  });

  describe('initialize', () => {
    it('should register default strategies upon initialization', async () => {
      await factory.initialize();
      expect(factory.strategyCount).toBeGreaterThan(0);
      expect(factory.getStrategy('postman-v2')).toBeInstanceOf(PostmanV2Parser);
    });
  });

  describe('detectFormat', () => {
    it('should detect Postman v2 format', async () => {
      const content = JSON.stringify({
        info: { name: 'v2', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }
      });
      const result = await factory.detectFormat(content);
      expect(result.format).toBe('postman-v2');
      expect(result.isValid).toBe(true);
    });

    it('should return null for invalid JSON', async () => {
      const result = await factory.detectFormat('not json');
      expect(result.format).toBeNull();
      expect(result.isValid).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse with auto-detection', async () => {
      const content = JSON.stringify({
        info: { name: 'v2', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
        item: []
      });
      const result = await factory.parse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.collection.name).toBe('v2');
      }
    });

    it('should parse with explicit format', async () => {
      const content = JSON.stringify({
        info: { name: 'v2', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
        item: []
      });
      const result = await factory.parse(content, 'postman-v2');
      expect(result.success).toBe(true);
    });

    it('should return failure for unsupported format', async () => {
      const result = await factory.parse('{}', 'unknown');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unsupported format');
      }
    });
  });

  describe('getSupportedFormats', () => {
    it('should return list of supported formats', async () => {
      const formats = await factory.getSupportedFormats();
      expect(formats.length).toBeGreaterThan(0);
      expect(formats.some(f => f.name === 'postman-v2')).toBe(true);
    });
  });
});
