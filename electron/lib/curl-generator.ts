/**
 * cURL Generator (Main Process)
 *
 * Generates cURL command strings from Request objects.
 * This is a copy of the renderer version for use in the main process.
 */

interface Request {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  body: string;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  bodyType?: string;
  bodyFormData?: Array<{ key: string; value: string; enabled: boolean }>;
}

export function generateCurlCommand(request: Request): string {
  const parts: string[] = ['curl'];

  if (request.method && request.method !== 'GET') {
    parts.push('-X', request.method);
  }

  const url = buildUrl(request.url, request.queryParams || []);
  parts.push(escapeShellString(url));

  const headers = request.headers || {};
  const authHeaders = getAuthHeaders(request.auth);
  for (const [key, value] of Object.entries(headers)) {
    if (authHeaders.includes(key.toLowerCase())) {
      continue;
    }
    parts.push('-H', escapeShellString(`${key}: ${value}`));
  }

  const authFlags = generateAuthFlags(request.auth);
  parts.push(...authFlags);

  // Handle different body types
  if (request.bodyType === 'form-data' && request.bodyFormData) {
    const formDataFlags = generateFormDataFlags(request.bodyFormData);
    parts.push(...formDataFlags);
  } else if (request.bodyType === 'x-www-form-urlencoded' && request.bodyFormData) {
    const urlEncodedFlags = generateUrlEncodedFlags(request.bodyFormData);
    parts.push(...urlEncodedFlags);
  } else if (request.body && request.body.trim()) {
    const bodyFlags = generateBodyFlags(request.body, headers);
    parts.push(...bodyFlags);
  }

  return formatMultiLine(parts);
}

function buildUrl(
  baseUrl: string,
  queryParams: Array<{ key: string; value: string; enabled: boolean }>
): string {
  if (!queryParams || queryParams.length === 0) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);

    queryParams
      .filter(param => param.enabled && param.key)
      .forEach(param => {
        url.searchParams.append(param.key, param.value || '');
      });

    return url.toString();
  } catch (e) {
    const enabledParams = queryParams.filter(
      param => param.enabled && param.key
    );
    if (enabledParams.length === 0) {
      return baseUrl;
    }

    const queryString = enabledParams
      .map(
        param =>
          `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value || '')}`
      )
      .join('&');

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${queryString}`;
  }
}

function generateAuthFlags(auth: Request['auth']): string[] {
  if (!auth || auth.type === 'none') {
    return [];
  }

  const flags: string[] = [];

  switch (auth.type) {
    case 'bearer':
      if (auth.token) {
        flags.push(
          '-H',
          escapeShellString(`Authorization: Bearer ${auth.token}`)
        );
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
        flags.push(
          '-H',
          escapeShellString(`${auth.apiKeyHeader}: ${auth.apiKey}`)
        );
      }
      break;
  }

  return flags;
}

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

function generateBodyFlags(
  body: string,
  headers: Record<string, string>
): string[] {
  return ['--data-raw', escapeShellString(body)];
}

function generateFormDataFlags(
  formData: Array<{ key: string; value: string; enabled: boolean }>
): string[] {
  const flags: string[] = [];
  for (const item of formData) {
    if (item.enabled && item.key) {
      if (typeof item.value === 'string' && item.value.startsWith('FILE::')) {
        const filePath = item.value.replace('FILE::', '');
        flags.push('-F', escapeShellString(`${item.key}=@${filePath}`));
      } else {
        flags.push('-F', escapeShellString(`${item.key}=${item.value}`));
      }
    }
  }
  return flags;
}

function generateUrlEncodedFlags(
  formData: Array<{ key: string; value: string; enabled: boolean }>
): string[] {
  const flags: string[] = [];
  for (const item of formData) {
    if (item.enabled && item.key) {
      flags.push('--data-urlencode', escapeShellString(`${item.key}=${item.value}`));
    }
  }
  return flags;
}

function escapeShellString(str: string): string {
  // Safe characters that don't need quoting
  const safeRegex = /^[a-zA-Z0-9_.\-\/:]+$/;
  if (safeRegex.test(str)) {
    return str;
  }
  
  // Wrap in single quotes and escape any inner single quotes
  return `'${str.replace(/'/g, "'\\''")}'`;
}

function formatMultiLine(parts: string[]): string {
  if (parts.length <= 3) {
    return parts.join(' ');
  }

  const lines: string[] = [];
  let currentLine = 'curl';

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    const estimatedLength = currentLine.length + part.length + 1;

    if (estimatedLength > 80 && currentLine !== 'curl') {
      lines.push(currentLine + ' \\');
      currentLine = '  ' + part;
    } else {
      currentLine += (currentLine === 'curl' ? ' ' : ' ') + part;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}
