/**
 * cURL Generator
 * 
 * Generates cURL command strings from Request objects.
 * Produces readable, multi-line cURL commands with proper escaping.
 */

import { Request } from '../types/entities';

/**
 * Generate a cURL command from a Request object
 */
export function generateCurlCommand(request: Request): string {
  const parts: string[] = ['curl'];

  // Add method
  if (request.method && request.method !== 'GET') {
    parts.push('-X', request.method);
  }

  // Build URL with query parameters
  const url = buildUrl(request.url, request.queryParams || []);
  parts.push(escapeShellString(url));

  // Add headers
  const headers = request.headers || {};
  // Don't add auth headers if we're using auth flags
  const authHeaders = getAuthHeaders(request.auth);
  for (const [key, value] of Object.entries(headers)) {
    // Skip auth headers that will be added via auth flags
    if (authHeaders.includes(key.toLowerCase())) {
      continue;
    }
    parts.push('-H', escapeShellString(`${key}: ${value}`));
  }

  // Add authentication
  const authFlags = generateAuthFlags(request.auth);
  parts.push(...authFlags);

  // Add body/data
  if (request.body && request.body.trim()) {
    const bodyFlags = generateBodyFlags(request.body, headers);
    parts.push(...bodyFlags);
  }

  // Format as multi-line for readability
  return formatMultiLine(parts);
}

/**
 * Build URL with query parameters
 */
function buildUrl(baseUrl: string, queryParams: Array<{ key: string; value: string; enabled: boolean }>): string {
  if (!queryParams || queryParams.length === 0) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    
    // Add enabled query parameters
    queryParams
      .filter(param => param.enabled && param.key)
      .forEach(param => {
        url.searchParams.append(param.key, param.value || '');
      });

    return url.toString();
  } catch (e) {
    // If URL is invalid, just append query string manually
    const enabledParams = queryParams.filter(param => param.enabled && param.key);
    if (enabledParams.length === 0) {
      return baseUrl;
    }

    const queryString = enabledParams
      .map(param => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value || '')}`)
      .join('&');

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${queryString}`;
  }
}

/**
 * Generate authentication flags
 */
function generateAuthFlags(auth: Request['auth']): string[] {
  if (!auth || auth.type === 'none') {
    return [];
  }

  const flags: string[] = [];

  switch (auth.type) {
    case 'bearer':
      if (auth.token) {
        flags.push('-H', escapeShellString(`Authorization: Bearer ${auth.token}`));
      }
      break;

    case 'basic':
      if (auth.username) {
        const credentials = auth.password 
          ? `${auth.username}:${auth.password}`
          : auth.username;
        flags.push('-u', escapeShellString(credentials));
      }
      break;

    case 'apikey':
      if (auth.apiKey && auth.apiKeyHeader) {
        flags.push('-H', escapeShellString(`${auth.apiKeyHeader}: ${auth.apiKey}`));
      }
      break;
  }

  return flags;
}

/**
 * Get header names that are used for authentication
 */
function getAuthHeaders(auth: Request['auth']): string[] {
  if (!auth || auth.type === 'none') {
    return [];
  }

  switch (auth.type) {
    case 'bearer':
      return ['authorization'];
    case 'apikey':
      return auth.apiKeyHeader ? [auth.apiKeyHeader.toLowerCase()] : [];
    default:
      return [];
  }
}

/**
 * Generate body/data flags
 */
function generateBodyFlags(body: string, _headers: Record<string, string>): string[] {
  // Use --data-raw for better compatibility
  return ['--data-raw', escapeShellString(body)];
}

/**
 * Escape shell string for use in cURL command
 */
function escapeShellString(str: string): string {
  // If string contains spaces, quotes, or special characters, wrap in single quotes
  // and escape any single quotes inside
  if (str.includes(' ') || str.includes("'") || str.includes('"') || str.includes('$') || str.includes('\\')) {
    // Escape single quotes by ending the string, adding escaped quote, and continuing
    return `'${str.replace(/'/g, "'\\''")}'`;
  }
  
  return str;
}

/**
 * Format command parts as multi-line for readability
 */
function formatMultiLine(parts: string[]): string {
  if (parts.length <= 3) {
    // Short command, keep on one line
    return parts.join(' ');
  }

  // Format with line continuation
  const lines: string[] = [];
  let currentLine = 'curl';

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    // Estimate line length (rough)
    const estimatedLength = currentLine.length + part.length + 1;
    
    if (estimatedLength > 80 && currentLine !== 'curl') {
      // Start new line
      lines.push(currentLine + ' \\');
      currentLine = '  ' + part; // Indent continuation lines
    } else {
      currentLine += (currentLine === 'curl' ? ' ' : ' ') + part;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

