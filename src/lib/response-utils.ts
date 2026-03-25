/**
 * Response Utilities - Safe handling of response data with defensive defaults
 *
 * Handles corner cases like:
 * - Missing/undefined status, statusText, time, headers, data
 * - Network errors (status 0)
 * - Malformed response data
 */

import { ResponseData } from '../types/entities';
import logger from './logger';

const STATUS_TEXTS: Record<number, string> = {
  // 1xx
  100: 'Continue',
  101: 'Switching Protocols',
  // 2xx
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  206: 'Partial Content',
  // 3xx
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  // 4xx
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  408: 'Request Timeout',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  // 5xx
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

/**
 * Normalized response data with guaranteed non-null values
 */
export interface NormalizedResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
  isError: boolean; // True if status is 0 (network error) or >= 400 (HTTP error)
  isSuccess: boolean; // True if status is 2xx
}

/**
 * Normalize response data with safe defaults for all fields
 * Handles undefined, null, and missing properties
 */
export function normalizeResponse(
  response: ResponseData | null | undefined
): NormalizedResponseData | null {
  if (!response) {
    return null;
  }

  const status = response.status ?? 0;
  const statusText =
    response.statusText ||
    STATUS_TEXTS[status] ||
    (status === 0 ? 'Request Failed' : 'Unknown');
  const headers = response.headers ?? {};
  const data = response.data ?? null;
  const time = response.time ?? 0;

  return {
    status,
    statusText,
    headers,
    data,
    time,
    isError: status === 0 || status >= 400,
    isSuccess: status >= 200 && status < 300,
  };
}

/**
 * Get display-friendly status text
 * Returns "Error" for status 0, otherwise returns the status code
 */
export function getStatusDisplay(status: number | undefined | null): string {
  if (status === undefined || status === null || status === 0) {
    return 'Error';
  }
  return String(status);
}

/**
 * Get status text for a status code, with fallback to standard HTTP status texts
 */
export function getStatusText(
  status: number | undefined | null,
  providedText?: string,
  maxLength: number = 30
): string {
  let text = '';
  if (providedText && providedText.trim()) {
    text = providedText;
  } else if (status === undefined || status === null || status === 0) {
    text = 'Request Failed';
  } else {
    text = STATUS_TEXTS[status] || 'Unknown';
  }

  if (maxLength > 0 && text.length > maxLength) {
    return `${text.slice(0, maxLength)}...`;
  }
  return text;
}

/**
 * Get badge variant based on status code
 */
export function getStatusVariant(
  status: number | undefined | null
): 'default' | 'destructive' | 'success' | 'warning' | 'error' {
  if (status === undefined || status === null) {
    return 'destructive';
  }
  if (status >= 200 && status < 300) {
    return 'success';
  }
  if (status >= 400 && status < 500) {
    return 'error';
  }
  if (status >= 500) {
    return 'destructive';
  }
  return 'default';
}

/**
 * Format response time for display
 */
export function formatResponseTime(time: number | undefined | null): string {
  if (time === undefined || time === null) {
    return '0ms';
  }
  return `${time}ms`;
}

/**
 * Safe JSON stringify for response body
 * Handles circular references and other edge cases
 */
export function safeStringifyBody(data: unknown): string {
  if (data === undefined || data === null) {
    return '';
  }

  if (typeof data === 'string') {
    // Already a string, try to format if it's JSON
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return data;
    }
  }

  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    // Handle circular references or other stringify errors
    logger.warn('Failed to stringify response body', { error });
    return String(data);
  }
}

/**
 * Check if response has valid headers
 */
export function hasHeaders(
  headers: Record<string, string> | undefined | null
): boolean {
  if (!headers || typeof headers !== 'object') {
    return false;
  }
  return Object.keys(headers).length > 0;
}

/**
 * Get headers as entries array (safe for null/undefined)
 */
export function getHeaderEntries(
  headers: Record<string, string> | undefined | null
): [string, string][] {
  if (!headers || typeof headers !== 'object') {
    return [];
  }
  return Object.entries(headers);
}

/**
 * Format response size for display (calculates byte size of data)
 */
export function formatResponseSize(data: unknown): string {
  if (data === undefined || data === null) {
    return '0 B';
  }

  let size = 0;
  if (typeof data === 'string') {
    size = new TextEncoder().encode(data).length;
  } else {
    try {
      // For objects/arrays, estimate size from JSON string
      size = new TextEncoder().encode(JSON.stringify(data)).length;
    } catch {
      size = 0;
    }
  }

  if (size === 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
