/**
 * cURL Parser (Main Process)
 *
 * Parses cURL command strings into Request objects compatible with Anayas.
 * This is a copy of the renderer version for use in the main process.
 */

interface Request {
  name: string;
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
}

interface ParseResult {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  auth: Request['auth'];
}

export function parseCurlCommand(curlCommand: string): Request {
  if (!curlCommand || !curlCommand.trim()) {
    throw new Error('Empty cURL command');
  }

  const normalized = curlCommand
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let command = normalized.replace(/^curl\s+/, '').trim();

  if (!command) {
    throw new Error('Invalid cURL command: no arguments found');
  }

  const args = parseArguments(command);

  const result: ParseResult = {
    method: 'GET',
    url: '',
    headers: {},
    body: '',
    queryParams: [],
    auth: {
      type: 'none',
    },
  };

  result.method = parseMethod(args);
  result.url = parseUrl(args);
  result.headers = parseHeaders(args);

  const bodyData = parseData(args);
  if (bodyData) {
    result.body = bodyData;
  }

  result.auth = parseAuth(args, result.headers);
  result.queryParams = parseQueryParams(result.url);

  try {
    const urlObj = new URL(result.url);
    result.url = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch (e) {
    const queryIndex = result.url.indexOf('?');
    if (queryIndex > 0) {
      result.url = result.url.substring(0, queryIndex);
    }
  }

  return {
    name: generateRequestName(result.method, result.url),
    method: result.method as Request['method'],
    url: result.url,
    headers: result.headers,
    body: result.body || '',
    queryParams: result.queryParams,
    auth: result.auth,
  };
}

function parseArguments(command: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let escapeNext = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if ((char === '"' || char === "'") && !escapeNext) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      } else {
        current += char;
      }
      continue;
    }

    if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        args.push(current.trim());
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function parseMethod(args: string[]): string {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-X' || arg === '--request') {
      if (i + 1 < args.length) {
        const method = args[i + 1].toUpperCase();
        const validMethods = [
          'GET',
          'POST',
          'PUT',
          'PATCH',
          'DELETE',
          'HEAD',
          'OPTIONS',
        ];
        if (validMethods.includes(method)) {
          return method;
        }
      }
    }
  }
  return 'GET';
}

function parseUrl(args: string[]): string {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url') {
      if (i + 1 < args.length) {
        return args[i + 1];
      }
    }
  }

  for (const arg of args) {
    if (arg.startsWith('-')) {
      continue;
    }

    if (arg.startsWith('http://') || arg.startsWith('https://')) {
      return arg;
    }
  }

  throw new Error('URL not found in cURL command');
}

function parseHeaders(args: string[]): Record<string, string> {
  const headers: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-H' || arg === '--header') {
      if (i + 1 < args.length) {
        const headerStr = args[i + 1];
        const colonIndex = headerStr.indexOf(':');
        if (colonIndex > 0) {
          const key = headerStr.substring(0, colonIndex).trim();
          const value = headerStr.substring(colonIndex + 1).trim();
          headers[key] = value;
        }
      }
    }
  }

  return headers;
}

function parseData(args: string[]): string | undefined {
  let data: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-d' || arg === '--data' || arg === '--data-raw') {
      if (i + 1 < args.length) {
        data = args[i + 1];
        if (data) {
          return data;
        }
      }
    } else if (arg === '--data-binary') {
      if (i + 1 < args.length) {
        return args[i + 1];
      }
    } else if (arg.startsWith('--data=')) {
      return arg.substring(7);
    } else if (arg.startsWith('-d')) {
      if (arg.length > 2) {
        return arg.substring(2);
      }
    }
  }

  return data;
}

function parseAuth(
  args: string[],
  headers: Record<string, string>
): Request['auth'] {
  const auth: Request['auth'] = {
    type: 'none',
  };

  const authHeader = headers['Authorization'] || headers['authorization'];
  if (authHeader) {
    if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
      return {
        type: 'bearer',
        token: authHeader.substring(7).trim(),
      };
    }
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-u' || arg === '--user') {
      if (i + 1 < args.length) {
        const credentials = args[i + 1];
        const colonIndex = credentials.indexOf(':');
        if (colonIndex > 0) {
          return {
            type: 'basic',
            username: credentials.substring(0, colonIndex),
            password: credentials.substring(colonIndex + 1),
          };
        } else {
          return {
            type: 'basic',
            username: credentials,
            password: '',
          };
        }
      }
    }
  }

  const apiKeyHeaders = [
    'X-API-Key',
    'X-Api-Key',
    'API-Key',
    'apikey',
    'x-api-key',
  ];
  for (const key of apiKeyHeaders) {
    if (headers[key] || headers[key.toLowerCase()]) {
      const value = headers[key] || headers[key.toLowerCase()];
      return {
        type: 'apikey',
        apiKey: value,
        apiKeyHeader: key,
      };
    }
  }

  return auth;
}

function parseQueryParams(
  url: string
): Array<{ key: string; value: string; enabled: boolean }> {
  try {
    const urlObj = new URL(url);
    const params: Array<{ key: string; value: string; enabled: boolean }> = [];

    urlObj.searchParams.forEach((value, key) => {
      params.push({
        key,
        value,
        enabled: true,
      });
    });

    return params;
  } catch (e) {
    return [];
  }
}

function generateRequestName(method: string, url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.split('/').filter(Boolean).pop() || 'request';
    return path;
  } catch (e) {
    return 'Request';
  }
}


export function parseCurlCommands(
  commands: string[]
): Array<{ success: boolean; request?: Request; error?: string }> {
  return commands.map((command, index) => {
    try {
      const request = parseCurlCommand(command);
      return { success: true, request };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || `Failed to parse command ${index + 1}`,
      };
    }
  });
}
