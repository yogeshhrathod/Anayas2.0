import { Request } from '../types/entities';

const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

function normalizeLineContiuations(command: string): string {
  return command.replace(/\\\s*\n\s*/g, ' ').trim();
}

/**
 * Pre-process curl extensions into a generalized format tokenizable by our custom parser.
 */
function preProcessCurlExtensions(command: string): string {
  let processed = command;
  
  // Convert --data-urlencode "key=value" to --data "key=encoded_value"
  processed = processed.replace(
    /--data-urlencode\s+(['"]?)([^'"\\s][^'"]*?)\1(?=\s|$)/g,
    (_match, _quote, value) => {
      const eqIdx = value.indexOf('=');
      if (eqIdx >= 0) {
        const key = value.substring(0, eqIdx);
        const val = encodeURIComponent(value.substring(eqIdx + 1));
        return `--data "${key}=${val}"`;
      }
      return `--data "${encodeURIComponent(value)}"`;
    }
  );

  return processed;
}

function parseQueryParams(url: string): Array<{ key: string; value: string; enabled: boolean }> {
  try {
    const urlObj = new URL(url);
    const params: Array<{ key: string; value: string; enabled: boolean }> = [];
    urlObj.searchParams.forEach((value, key) => {
      params.push({ key, value, enabled: true });
    });
    return params;
  } catch {
    return [];
  }
}

function stripQueryString(url: string): string {
  try {
    if (url.includes('://')) {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    }
  } catch {
    // Fall through to manual parsing
  }
  const idx = url.indexOf('?');
  return idx > 0 ? url.substring(0, idx) : url;
}

function generateRequestName(method: string, url: string): string {
  try {
    const urlObj = new URL(url);
    const segment = urlObj.pathname.split('/').filter(Boolean).pop() || 'request';
    return `${method} ${segment}`;
  } catch {
    return `${method} Request`;
  }
}

/**
 * Extract body/data from parsed shell arguments
 */
function parseData(args: string[]): string | undefined {
  const dataParts: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-d' || arg === '--data' || arg === '--data-raw' || arg === '--data-binary') {
      if (i + 1 < args.length) {
        dataParts.push(args[i + 1]);
        i++;
      }
    } else if (arg.startsWith('--data=')) {
      dataParts.push(arg.substring(7));
    } else if (arg.startsWith('-d') && arg.length > 2) {
      dataParts.push(arg.substring(2));
    }
  }
  return dataParts.length > 0 ? dataParts.join('&') : undefined;
}

/**
 * Extract HTTP method from parsed arguments
 */
function parseMethod(args: string[], hasBody: boolean): string {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-X' || arg === '--request') {
      if (i + 1 < args.length) {
        return args[i + 1].toUpperCase();
      }
    }
    if (arg === '-I' || arg === '--head') {
      return 'HEAD';
    }
  }
  return hasBody ? 'POST' : 'GET';
}

/**
 * Extract Headers from parsed arguments
 */
function parseHeaders(args: string[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-H' || arg === '--header') {
      if (i + 1 < args.length) {
        const headerStr = args[i + 1];
        const colonIndex = headerStr.indexOf(':');
        if (colonIndex !== -1) {
          const key = headerStr.substring(0, colonIndex).trim();
          const value = headerStr.substring(colonIndex + 1).trim();
          headers[key] = value;
        } else {
          headers[headerStr] = ''; // Handle unexpected formats gracefully
        }
        i++;
      }
    } else if (arg === '-A' || arg === '--user-agent') {
      if (i + 1 < args.length) {
        headers['User-Agent'] = args[i + 1];
        i++;
      }
    } else if (arg === '-b' || arg === '--cookie') {
      if (i + 1 < args.length) {
        headers['Cookie'] = args[i + 1];
        i++;
      }
    } else if (arg === '-e' || arg === '--referer') {
      if (i + 1 < args.length) {
        headers['Referer'] = args[i + 1];
        i++;
      }
    }
  }
  return headers;
}

/**
 * Extract URL from parsed arguments
 */
function parseUrl(args: string[]): string {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url') {
      if (i + 1 < args.length) {
        return args[i + 1];
      }
    }
  }

  const skipVals = new Set([
    '-X', '--request', '--url', '-H', '--header',
    '-d', '--data', '--data-raw', '--data-binary', '--data-urlencode',
    '-u', '--user', '-b', '--cookie', '-A', '--user-agent', '-e', '--referer'
  ]);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('-')) {
      if (skipVals.has(arg)) i++;
      continue;
    }
    // Simple heuristic to differentiate URL from other standalone strings
    if (arg.includes('://') || arg.includes('.') || arg.includes('localhost') || arg.includes(':')) {
      return arg;
    }
  }
  throw new Error('URL not found in cURL command');
}

/**
 * Precise Bash argument string tokenizer. Retains accurate escape structures inside quotes.
 */
function parseArguments(command: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let escapeNext = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (escapeNext) {
      if (char === '\n' || char === '\r') {
         // Line continuation
      } else {
        current += char;
      }
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      if (inQuotes && quoteChar === "'") {
        current += char; // bash preserves escaping backslash entirely in single quotes
      } else {
        escapeNext = true;
      }
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

    if (!inQuotes && /\s/.test(char)) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}

function parseAuth(headers: Record<string, string>, args: string[]): Request['auth'] {
  const authHeader = headers['Authorization'] || headers['authorization'];
  if (authHeader) {
    const lower = authHeader.toLowerCase();
    if (lower.startsWith('bearer ')) {
      return { type: 'bearer', token: authHeader.substring(7).trim() };
    }
    if (lower.startsWith('basic ')) {
      try {
        const decoded = atob(authHeader.substring(6).trim());
        const colonIdx = decoded.indexOf(':');
        if (colonIdx >= 0) {
          return {
            type: 'basic',
            username: decoded.substring(0, colonIdx),
            password: decoded.substring(colonIdx + 1),
          };
        } else {
           return { type: 'basic', username: decoded, password: '' };
        }
      } catch { /* fall through */ }
    }
  }

  // -u inline bash syntax check
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '-u' || args[i] === '--user') && i + 1 < args.length) {
      const creds = args[i + 1];
      const colonIdx = creds.indexOf(':');
      if (colonIdx >= 0) {
        return { type: 'basic', username: creds.substring(0, colonIdx), password: creds.substring(colonIdx + 1) };
      }
      return { type: 'basic', username: creds, password: '' };
    }
  }

  const apiKeyHeaderNames = ['X-API-Key', 'X-Api-Key', 'API-Key', 'apikey', 'x-api-key'];
  for (const key of apiKeyHeaderNames) {
    const value = headers[key] ?? headers[key.toLowerCase()];
    if (value) {
      return { type: 'apikey', apiKey: value, apiKeyHeader: key };
    }
  }

  return { type: 'none' };
}

export function parseCurlCommand(curlCommand: string): Request {
  if (!curlCommand || !curlCommand.trim()) {
    throw new Error('Empty cURL command');
  }

  let cmd = curlCommand.trim();
  if (cmd.startsWith('$ ')) cmd = cmd.substring(2).trim();
  if (cmd.startsWith('curl ')) cmd = cmd.substring(5).trim();
  if (!cmd || cmd.toLowerCase() === 'curl') {
    throw new Error('Invalid cURL command: no arguments found');
  }

  // Handle cross-line integrations safely before feeding tokenizer
  let normalized = normalizeLineContiuations(curlCommand);
  if (normalized.startsWith('$ ')) normalized = normalized.substring(2).trim();
  if (normalized.startsWith('curl ')) normalized = normalized.substring(5).trim();

  normalized = preProcessCurlExtensions(normalized);

  const args = parseArguments(normalized);
  
  const rawBody = parseData(args);
  const body = rawBody || '';
  const rawMethod = (parseMethod(args, !!rawBody)).toUpperCase();
  const method: Request['method'] = VALID_METHODS.includes(
    rawMethod as (typeof VALID_METHODS)[number]
  ) ? (rawMethod as Request['method']) : 'GET';

  let url;
  try {
     url = parseUrl(args);
  } catch (e) {
     if (normalized.length === 0) throw new Error('Invalid cURL command: no arguments found');
     throw new Error('Failed to parse cURL command: URL not found');
  }
  
  const headers = parseHeaders(args);
  const queryParams = parseQueryParams(url);
  const cleanUrl = stripQueryString(url);
  const auth = parseAuth(headers, args);

  return {
    name: generateRequestName(method, cleanUrl),
    method,
    url: cleanUrl,
    headers,
    body,
    queryParams,
    auth,
    isFavorite: 0,
  };
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
