import { describe, expect, it, vi } from 'vitest';
import { 
  normalizeResponse, 
  getStatusDisplay, 
  getStatusText,
  getStatusVariant, 
  formatResponseTime, 
  safeStringifyBody, 
  hasHeaders, 
  getHeaderEntries, 
  formatResponseSize 
} from '../../../../src/lib/response-utils';

// Mock logger
vi.mock('../../../../src/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

declare global {
  interface Window {
    electronAPI: any;
  }
}

describe('response-utils', () => {
  describe('normalizeResponse', () => {
    it('should normalize a valid response', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        data: { id: 1 },
        time: 150
      };
      const result = normalizeResponse(response as any);
      expect(result).not.toBeNull();
      expect(result?.isSuccess).toBe(true);
      expect(result?.isError).toBe(false);
    });

    it('should handle missing fields with defaults', () => {
      const result = normalizeResponse({} as any);
      expect(result?.status).toBe(0);
      expect(result?.statusText).toBe('Request Failed');
      expect(result?.isError).toBe(true);
    });

    it('should return null for null input', () => {
      expect(normalizeResponse(null)).toBeNull();
    });
  });

  describe('getStatusDisplay', () => {
    it('should return Error for 0 or null', () => {
      expect(getStatusDisplay(0)).toBe('Error');
      expect(getStatusDisplay(null)).toBe('Error');
    });

    it('should return status code as string for valid codes', () => {
      expect(getStatusDisplay(200)).toBe('200');
      expect(getStatusDisplay(404)).toBe('404');
    });
  });

  describe('getStatusText', () => {
    it('should return provided status text', () => {
      expect(getStatusText(200, 'Custom OK')).toBe('Custom OK');
    });

    it('should return standard status text for valid codes', () => {
      expect(getStatusText(200)).toBe('OK');
      expect(getStatusText(404)).toBe('Not Found');
    });

    it('should return Request Failed for invalid or missing status', () => {
      expect(getStatusText(0)).toBe('Request Failed');
      expect(getStatusText(null)).toBe('Request Failed');
      expect(getStatusText(undefined)).toBe('Request Failed');
    });

    it('should truncate long status text', () => {
      const longText = 'A very long status text that should be truncated because it exceeds the limit';
      expect(getStatusText(200, longText, 10)).toBe('A very lon...');
    });

    it('should return Unknown for unknown status codes', () => {
      expect(getStatusText(999)).toBe('Unknown');
    });
  });

  describe('getStatusVariant', () => {
    it('should return correct variants for status codes', () => {
      expect(getStatusVariant(200)).toBe('success');
      expect(getStatusVariant(204)).toBe('success');
      expect(getStatusVariant(404)).toBe('error');
      expect(getStatusVariant(401)).toBe('error');
      expect(getStatusVariant(500)).toBe('destructive');
      expect(getStatusVariant(null)).toBe('destructive');
      expect(getStatusVariant(undefined)).toBe('destructive');
      expect(getStatusVariant(302)).toBe('default');
    });
  });

  describe('formatResponseTime', () => {
    it('should format ms', () => {
      expect(formatResponseTime(150)).toBe('150ms');
      expect(formatResponseTime(0)).toBe('0ms');
      expect(formatResponseTime(null)).toBe('0ms');
      expect(formatResponseTime(undefined)).toBe('0ms');
    });
  });

  describe('safeStringifyBody', () => {
    it('should format JSON strings', () => {
      const result = safeStringifyBody('{"a":1}');
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it('should return raw string for invalid JSON', () => {
      const invalidJson = '{"a":1';
      expect(safeStringifyBody(invalidJson)).toBe(invalidJson);
    });

    it('should stringify objects', () => {
      const result = safeStringifyBody({ b: 2 });
      expect(result).toBe('{\n  "b": 2\n}');
    });

    it('should handle undefined and null', () => {
      expect(safeStringifyBody(undefined)).toBe('');
      expect(safeStringifyBody(null)).toBe('');
    });

    it('should handle circular references', () => {
       const a: any = {};
       a.self = a;
       const result = safeStringifyBody(a);
       expect(result).toBe('[object Object]');
    });
  });

  describe('hasHeaders and getHeaderEntries', () => {
    it('should handle headers correctly', () => {
      const headers = { 'X-A': '1' };
      expect(hasHeaders(headers)).toBe(true);
      expect(hasHeaders({})).toBe(false);
      expect(hasHeaders(null)).toBe(false);
      expect(hasHeaders(undefined)).toBe(false);
      expect(getHeaderEntries(headers)).toEqual([['X-A', '1']]);
      expect(getHeaderEntries(null)).toEqual([]);
      expect(getHeaderEntries(undefined)).toEqual([]);
      expect(getHeaderEntries({} as any)).toEqual([]);
    });
  });

  describe('formatResponseSize', () => {
    it('should format bytes, KB, and MB correctly', () => {
      expect(formatResponseSize('hello')).toBe('5 B');
      expect(formatResponseSize('a'.repeat(100))).toBe('100 B');
      expect(formatResponseSize('a'.repeat(2048))).toBe('2.00 KB');
      expect(formatResponseSize('a'.repeat(2 * 1024 * 1024))).toBe('2.00 MB');
      expect(formatResponseSize(null)).toBe('0 B');
      expect(formatResponseSize(undefined)).toBe('0 B');
      expect(formatResponseSize({})).toBe('2 B'); // "{}"
      
      const circular: any = {};
      circular.self = circular;
      expect(formatResponseSize(circular)).toBe('0 B');
    });
  });
});
