/**
 * Response Utilities - Safe handling of response data with defensive defaults
 *
 * Handles corner cases like:
 * - Missing/undefined status, statusText, time, headers, data
 * - Network errors (status 0)
 * - Malformed response data
 */

import { ResponseData } from '../types/entities';

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
    response.statusText ?? (status === 0 ? 'Request Failed' : 'Unknown');
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
 * Get badge variant based on status code
 */
export function getStatusVariant(
  status: number | undefined | null
): 'default' | 'destructive' {
  if (status === undefined || status === null) {
    return 'destructive';
  }
  return status >= 200 && status < 300 ? 'default' : 'destructive';
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
    console.warn('Failed to stringify response body:', error);
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
