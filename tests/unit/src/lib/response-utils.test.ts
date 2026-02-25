import { describe, expect, it, vi } from 'vitest';
import {
    formatResponseSize,
    formatResponseTime,
    getStatusDisplay,
    getStatusVariant,
    normalizeResponse,
    safeStringifyBody
} from '../../../../src/lib/response-utils';

// Mock logger
vi.mock('../../../../src/lib/logger', () => ({
  default: {
    warn: vi.fn(),
  },
}));

describe('response-utils', () => {
  describe('normalizeResponse', () => {
    it('should return null for null input', () => {
      expect(normalizeResponse(null)).toBeNull();
    });

    it('should provide safe defaults', () => {
      const normalized = normalizeResponse({} as any);
      expect(normalized).toEqual({
        status: 0,
        statusText: 'Request Failed',
        headers: {},
        data: null,
        time: 0,
        isError: true,
        isSuccess: false
      });
    });

    it('should correctly identify success and error statuses', () => {
      expect(normalizeResponse({ status: 200 } as any)?.isSuccess).toBe(true);
      expect(normalizeResponse({ status: 204 } as any)?.isSuccess).toBe(true);
      expect(normalizeResponse({ status: 404 } as any)?.isError).toBe(true);
      expect(normalizeResponse({ status: 500 } as any)?.isError).toBe(true);
      expect(normalizeResponse({ status: 200 } as any)?.isError).toBe(false);
    });
  });

  describe('getStatusDisplay', () => {
    it('should return "Error" for 0, null, or undefined', () => {
      expect(getStatusDisplay(0)).toBe('Error');
      expect(getStatusDisplay(null)).toBe('Error');
      expect(getStatusDisplay(undefined)).toBe('Error');
    });

    it('should return status code string for valid statuses', () => {
      expect(getStatusDisplay(200)).toBe('200');
      expect(getStatusDisplay(404)).toBe('404');
    });
  });

  describe('getStatusVariant', () => {
    it('should return correct variants', () => {
      expect(getStatusVariant(200)).toBe('success');
      expect(getStatusVariant(404)).toBe('error');
      expect(getStatusVariant(500)).toBe('destructive');
      expect(getStatusVariant(null)).toBe('destructive');
    });
  });

  describe('formatResponseTime', () => {
    it('should format time with ms suffix', () => {
      expect(formatResponseTime(123)).toBe('123ms');
      expect(formatResponseTime(0)).toBe('0ms');
      expect(formatResponseTime(null)).toBe('0ms');
    });
  });

  describe('safeStringifyBody', () => {
    it('should format JSON strings', () => {
      const json = '{"a":1}';
      expect(safeStringifyBody(json)).toContain('"a": 1');
    });

    it('should stringify objects', () => {
      const obj = { a: 1 };
      expect(safeStringifyBody(obj)).toContain('"a": 1');
    });

    it('should return empty string for null/undefined', () => {
      expect(safeStringifyBody(null)).toBe('');
      expect(safeStringifyBody(undefined)).toBe('');
    });
  });

  describe('formatResponseSize', () => {
    it('should format bytes correctly', () => {
      expect(formatResponseSize('hello')).toBe('5 B');
      expect(formatResponseSize(null)).toBe('0 B');
      expect(formatResponseSize({a: 1})).toBe('7 B'); // {"a":1}
    });

    it('should format KB and MB', () => {
      const largeData = 'a'.repeat(1024 * 1.5);
      expect(formatResponseSize(largeData)).toBe('1.50 KB');
      
      const veryLargeData = 'a'.repeat(1024 * 1024 * 2);
      expect(formatResponseSize(veryLargeData)).toBe('2.00 MB');
    });
  });
});
