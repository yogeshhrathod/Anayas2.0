import fs from 'fs';
import path from 'path';
import { createLogger } from './logger';

const logger = createLogger('api');

// ── Restricted (forbidden) request header handling ──────────────────────────
// Chromium's `net.fetch` rejects "forbidden" request headers (e.g. Cookie,
// Referer, Connection, Host, Origin, and any `Sec-*` / `Proxy-*` header) with
// `net::ERR_INVALID_ARGUMENT`. These are headers the browser normally manages
// itself. However, an API client must be able to send them verbatim (e.g. when
// a user pastes a curl / browser "copy as fetch" command).
//
// To send them faithfully we inject them via the session's
// `webRequest.onBeforeSendHeaders` hook, which runs AFTER fetch's validation,
// so Chromium never sees them as manually-set fetch headers.

/** Marker header (safe, X-prefixed) used to correlate a fetch call with its
 *  pending restricted headers inside the shared webRequest hook. */
const INTERNAL_REQUEST_ID_HEADER = 'x-luna-internal-request-id';

/** Explicit list of forbidden header names (lowercase). Prefix-based rules
 *  (`sec-`, `proxy-`) are handled separately in {@link isRestrictedHeader}. */
const RESTRICTED_HEADER_NAMES = new Set<string>([
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'connection',
  'content-length',
  'cookie',
  'cookie2',
  'date',
  'dnt',
  'expect',
  'feature-policy',
  'host',
  'keep-alive',
  'origin',
  'referer',
  'set-cookie',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'via',
]);

/** Pending restricted headers keyed by a unique per-request id. */
const pendingRestrictedHeaders = new Map<string, Record<string, string>>();

/** Tracks sessions that already have the onBeforeSendHeaders hook registered
 *  (only one listener per session is allowed). */
const sessionsWithRestrictedHook = new WeakSet<object>();

let restrictedRequestCounter = 0;

/** Returns true if a header name is forbidden by Chromium's fetch and must be
 *  injected via the webRequest hook instead. */
function isRestrictedHeader(name: string): boolean {
  const n = name.toLowerCase();
  if (n.startsWith('sec-') || n.startsWith('proxy-')) return true;
  return RESTRICTED_HEADER_NAMES.has(n);
}

/** Strips CR/LF (header-injection / invalid-value protection). */
function sanitizeHeaderValue(value: string): string {
  return String(value).replace(/[\r\n]+/g, ' ');
}

/** Generates a process-unique id for correlating restricted headers. */
function nextRestrictedRequestId(): string {
  restrictedRequestCounter += 1;
  return `${Date.now().toString(36)}-${restrictedRequestCounter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** Registers the (single) onBeforeSendHeaders hook on a session, idempotently. */
function ensureRestrictedHeaderHook(apiSession: {
  webRequest: {
    onBeforeSendHeaders: (
      listener: (
        details: { requestHeaders: Record<string, string> },
        callback: (response: { requestHeaders: Record<string, string> }) => void
      ) => void
    ) => void;
  };
}): void {
  if (sessionsWithRestrictedHook.has(apiSession)) return;
  sessionsWithRestrictedHook.add(apiSession);

  apiSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...details.requestHeaders };

    // Locate the marker header case-insensitively.
    let markerKey: string | undefined;
    for (const k of Object.keys(requestHeaders)) {
      if (k.toLowerCase() === INTERNAL_REQUEST_ID_HEADER) {
        markerKey = k;
        break;
      }
    }

    if (markerKey) {
      const id = requestHeaders[markerKey];
      delete requestHeaders[markerKey];
      const restricted = pendingRestrictedHeaders.get(id);
      if (restricted) {
        for (const [rk, rv] of Object.entries(restricted)) {
          requestHeaders[rk] = rv;
        }
        pendingRestrictedHeaders.delete(id);
      }
    }

    callback({ requestHeaders });
  });
}

interface FetchOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  isJson?: boolean;
  timeout?: number;
  sslVerification?: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
}

export class ApiService {
  private activeRequests: Map<string, AbortController> = new Map();

  public cancelRequest(transactionId: string): boolean {
    const controller = this.activeRequests.get(transactionId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(transactionId);
      logger.info(`Cancelled request with transactionId: ${transactionId}`);
      return true;
    }
    return false;
  }

  public async request<T>(
    url: string,
    options: FetchOptions & { transactionId?: string }
  ): Promise<ApiResponse> {
    const startTime = Date.now();
    let isTimeout = false;
    // Correlation id for restricted-header injection; used for cleanup on error.
    let markerId: string | null = null;

    try {
      // Split headers: "safe" ones are passed directly to net.fetch, while
      // "restricted" (forbidden) ones are injected via webRequest to avoid
      // net::ERR_INVALID_ARGUMENT while still sending them to the server.
      const headers: Record<string, string> = {};
      const restrictedHeaders: Record<string, string> = {};
      let hasContentType = false;
      let contentTypeValue = '';
      if (options.headers) {
        for (const [key, rawValue] of Object.entries(options.headers)) {
          if (!key || key.trim() === '') continue;
          if (rawValue === undefined || rawValue === null) continue;
          const value = sanitizeHeaderValue(rawValue);
          if (isRestrictedHeader(key)) {
            restrictedHeaders[key] = value;
            continue;
          }
          headers[key] = value;
          if (key.toLowerCase() === 'content-type') {
            hasContentType = true;
            contentTypeValue = value.toLowerCase();
          }
        }
      }

      let body = options.body;

      if (
        contentTypeValue.includes('multipart/form-data') &&
        typeof body === 'string'
      ) {
        const formData = new FormData();
        try {
          const parsedBody = JSON.parse(body);
          for (const [key, value] of Object.entries(parsedBody)) {
            if (typeof value === 'string' && value.startsWith('FILE::')) {
              const filePath = value.replace('FILE::', '');
              if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);
                const blob = new Blob([fileBuffer]);
                formData.append(key, blob, path.basename(filePath));
              } else {
                logger.warn(`File not found: ${filePath}`);
              }
            } else {
              formData.append(key, String(value));
            }
          }
          body = formData;
          // Let fetch automatically set the boundary for multipart/form-data
          const contentTypesKeys = Object.keys(headers).filter(
            k => k.toLowerCase() === 'content-type'
          );
          contentTypesKeys.forEach(k => delete headers[k]);
        } catch (e) {
          logger.error('Failed to parse multipart/form-data body', {
            error: e,
          });
        }
      } else if (
        contentTypeValue.includes('application/x-www-form-urlencoded') &&
        typeof body === 'string'
      ) {
        try {
          const parsedBody = JSON.parse(body);
          body = new URLSearchParams(parsedBody).toString();
        } catch (e) {
          logger.error('Failed to parse form-urlencoded body', { error: e });
        }
      } else if (options.isJson && body) {
        if (!hasContentType) {
          headers['Content-Type'] = 'application/json';
        }
        body = typeof body === 'string' ? body : JSON.stringify(body);
      } else if (body instanceof URLSearchParams) {
        if (!hasContentType) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      }

      logger.info(`API Request: ${options.method} ${url}`, { headers });

      // Create AbortController for timeout
      const controller = new AbortController();
      if (options.transactionId) {
        this.activeRequests.set(options.transactionId, controller);
      }

      let timeoutId: NodeJS.Timeout | null = null;
      if (options.timeout && options.timeout > 0) {
        timeoutId = setTimeout(() => {
          isTimeout = true;
          controller.abort();
        }, options.timeout);
      }

      const { net, session } = await import('electron');

      const fetchOptions: any = {
        method: options.method,
        headers,
        signal: controller.signal,
      };

      if (
        options.method !== 'GET' &&
        options.method !== 'HEAD' &&
        body !== undefined &&
        body !== null
      ) {
        fetchOptions.body = body;
      }

      // Always use a shared persistent session to allow session/cookie sharing across API calls
      const apiSession = session.fromPartition('persist:api-session');

      // Update certificate verification on the shared session
      if (options.sslVerification === false) {
        apiSession.setCertificateVerifyProc((_request, callback) => {
          callback(0); // Accept all certificates
        });
      } else {
        // Use default certificate verification
        apiSession.setCertificateVerifyProc((_request, callback) => {
          callback(-1); // Use default verification logic
        });
      }

      fetchOptions.session = apiSession;

      // Inject restricted (forbidden) headers via the session's webRequest hook
      // so they reach the server without tripping fetch's ERR_INVALID_ARGUMENT.
      const restrictedKeys = Object.keys(restrictedHeaders);
      if (restrictedKeys.length > 0) {
        ensureRestrictedHeaderHook(apiSession);
        markerId = nextRestrictedRequestId();
        pendingRestrictedHeaders.set(markerId, restrictedHeaders);
        // Safe, X-prefixed marker so the hook can correlate this request.
        headers[INTERNAL_REQUEST_ID_HEADER] = markerId;
        logger.info(
          `Injecting ${restrictedKeys.length} restricted header(s) via webRequest: ${restrictedKeys.join(', ')}`
        );
      }

      const response = await net.fetch(url, fetchOptions);

      if (options.transactionId) {
        this.activeRequests.delete(options.transactionId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const responseTime = Date.now() - startTime;

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseBody: any;
      const contentTypeHeader = response.headers.get('content-type') || '';
      const contentType = contentTypeHeader.toLowerCase();

      if (contentType.includes('json')) {
        try {
          responseBody = await response.json();
        } catch (e) {
          responseBody = await response.text();
          try {
            // Try parsing as JSON anyway if it looks like JSON
            if (
              typeof responseBody === 'string' &&
              (responseBody.trim().startsWith('{') ||
                responseBody.trim().startsWith('['))
            ) {
              responseBody = JSON.parse(responseBody);
            }
          } catch {
            // Keep as text if parsing fails
          }
        }
      } else if (
        contentType.includes('text/') ||
        contentType === '' ||
        response.status >= 400
      ) {
        try {
          const text = await response.text();
          // Try to parse as JSON anyway, as many APIs send JSON without proper content-type or as plain text
          if (
            text &&
            (text.trim().startsWith('{') || text.trim().startsWith('['))
          ) {
            try {
              responseBody = JSON.parse(text);
            } catch {
              responseBody = text;
            }
          } else {
            responseBody = text;
          }
        } catch (e) {
          // Fallback to base64 if it fails to read as text (unlikely for text/ or status >= 400)
          const buffer = await response.arrayBuffer();
          responseBody = Buffer.from(buffer).toString('base64');
        }
      } else {
        // For binary content, return as base64 string
        const buffer = await response.arrayBuffer();
        responseBody = Buffer.from(buffer).toString('base64');
      }

      const result: ApiResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        responseTime,
      };

      if (!response.ok) {
        logger.error(`API Error: ${response.status} ${response.statusText}`, {
          url,
          status: response.status,
          statusText: response.statusText,
          responseTime,
        });
      } else {
        logger.info(`API Success: ${response.status} ${response.statusText}`, {
          url,
          responseTime,
        });
      }

      return result;
    } catch (err: any) {
      if (options.transactionId) {
        this.activeRequests.delete(options.transactionId);
      }
      const responseTime = Date.now() - startTime;

      if (err.name === 'AbortError' || isTimeout) {
        const message = isTimeout
          ? `Request timeout after ${options.timeout || 30000}ms`
          : 'Request cancelled by user';
        logger.error(message, { responseTime });
        throw new Error(message);
      }

      let errorMessage = err.message;
      if (err.message === 'fetch failed' && err.cause) {
        errorMessage = `fetch failed: ${err.cause.message || err.cause}`;
      }

      logger.error(`Request failed for ${url}`, {
        error: errorMessage,
        cause: err.cause,
        responseTime,
      });
      throw new Error(errorMessage);
    } finally {
      // Ensure no stale restricted-header entry lingers (e.g. if the request
      // errored before the webRequest hook fired).
      if (markerId) {
        pendingRestrictedHeaders.delete(markerId);
      }
    }
  }

  async getJson(
    url: string,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<ApiResponse> {
    return this.request(url, { method: 'GET', headers, timeout });
  }

  async postJson(
    url: string,
    data: any,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<ApiResponse> {
    return this.request(url, {
      method: 'POST',
      body: data,
      headers,
      isJson: true,
      timeout,
    });
  }

  async putJson(
    url: string,
    data: any,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<ApiResponse> {
    return this.request(url, {
      method: 'PUT',
      body: data,
      headers,
      isJson: true,
      timeout,
    });
  }

  async patchJson(
    url: string,
    data: any,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<ApiResponse> {
    return this.request(url, {
      method: 'PATCH',
      body: data,
      headers,
      isJson: true,
      timeout,
    });
  }

  async deleteJson(
    url: string,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<ApiResponse> {
    return this.request(url, { method: 'DELETE', headers, timeout });
  }

  async headJson(
    url: string,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<ApiResponse> {
    return this.request(url, { method: 'HEAD', headers, timeout });
  }

  async optionsJson(
    url: string,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<ApiResponse> {
    return this.request(url, { method: 'OPTIONS', headers, timeout });
  }

  async postForm(
    url: string,
    formData: URLSearchParams,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<ApiResponse> {
    return this.request(url, {
      method: 'POST',
      body: formData,
      headers,
      timeout,
    });
  }

  async downloadFile(
    url: string,
    headers?: Record<string, string>,
    timeout?: number
  ): Promise<Buffer | null> {
    try {
      const response = await this.request(url, {
        method: 'GET',
        headers,
        timeout,
      });
      if (response.body && typeof response.body === 'string') {
        return Buffer.from(response.body, 'base64');
      }
      return null;
    } catch (err) {
      logger.error(`Download failed for ${url}`, err);
      return null;
    }
  }

  async testConnection(url: string, timeout?: number): Promise<boolean> {
    try {
      const response = await this.request(url, {
        method: 'GET',
        timeout: timeout || 5000,
      });
      return response.status < 500;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
