/**
 * Postman Collection v2.x Parser
 *
 * Parses Postman Collection v2.0 and v2.1 formats into normalized ImportResult.
 * Handles nested folders, all auth types, and environment variables.
 */

import { BaseImportStrategy } from './import-strategy';
import type {
  ImportResult,
  ParsedAuth,
  ParsedEnvironment,
  ParsedFolder,
  ParsedRequest,
  QueryParam,
} from './types';

// ============================================================================
// Postman v2 Types (for parsing)
// ============================================================================

interface PostmanV2Collection {
  info: {
    _postman_id?: string;
    name: string;
    description?: string;
    schema: string;
  };
  item?: PostmanV2Item[];
  variable?: PostmanV2Variable[];
  auth?: PostmanV2Auth;
}

interface PostmanV2Item {
  name: string;
  description?: string;
  item?: PostmanV2Item[]; // Folder has nested items
  request?: PostmanV2Request; // Request has request object
}

interface PostmanV2Request {
  method?: string;
  url?: string | PostmanV2Url;
  header?: PostmanV2Header[];
  body?: PostmanV2Body;
  auth?: PostmanV2Auth;
  description?: string;
}

interface PostmanV2Url {
  raw?: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: PostmanV2Query[];
}

interface PostmanV2Header {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanV2Query {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanV2Body {
  mode?: string;
  raw?: string;
  urlencoded?: PostmanV2UrlEncoded[];
  formdata?: PostmanV2FormData[];
  options?: {
    raw?: {
      language?: string;
    };
  };
}

interface PostmanV2UrlEncoded {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanV2FormData {
  key: string;
  value: string;
  type?: string;
  disabled?: boolean;
}

interface PostmanV2Auth {
  type: string;
  bearer?: PostmanV2AuthParam[];
  basic?: PostmanV2AuthParam[];
  apikey?: PostmanV2AuthParam[];
}

interface PostmanV2AuthParam {
  key: string;
  value: string;
}

interface PostmanV2Variable {
  key: string;
  value: string;
  disabled?: boolean;
}

// ============================================================================
// Parser Implementation
// ============================================================================

export class PostmanV2Parser extends BaseImportStrategy {
  readonly formatName = 'postman-v2';
  readonly displayName = 'Postman Collection v2';
  readonly fileExtensions = ['.json'];
  readonly mimeTypes = ['application/json'];

  /**
   * Detect if content is Postman v2 format.
   */
  detect(content: string): boolean {
    const data = this.safeParseJson(content);
    if (!data) return false;

    // Check for v2 indicators
    return (
      data.info &&
      typeof data.info === 'object' &&
      data.info.schema &&
      typeof data.info.schema === 'string' &&
      data.info.schema.includes('schema.getpostman.com')
    );
  }

  /**
   * Get confidence score for format detection.
   */
  getConfidence(content: string): number {
    const data = this.safeParseJson(content);
    if (!data) return 0;

    let confidence = 0;

    // Check for schema URL
    if (data.info?.schema?.includes('schema.getpostman.com')) {
      confidence += 0.5;
    }

    // Check for _postman_id
    if (data.info?._postman_id) {
      confidence += 0.2;
    }

    // Check for info.name
    if (data.info?.name) {
      confidence += 0.1;
    }

    // Check for item array
    if (Array.isArray(data.item)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1);
  }

  /**
   * Get detected version.
   */
  getVersion(content: string): string | undefined {
    const data = this.safeParseJson(content);
    if (!data?.info?.schema) return undefined;

    // Extract version from schema URL
    const match = data.info.schema.match(/v(\d+\.\d+\.\d+)/);
    return match ? match[1] : undefined;
  }

  /**
   * Parse Postman v2 collection.
   */
  async parse(content: string): Promise<ImportResult> {
    console.log('[PostmanV2Parser] Starting parse...');
    const data = this.safeParseJson(content) as PostmanV2Collection;

    if (!data) {
      throw new Error('Invalid JSON content');
    }

    if (!data.info?.name) {
      throw new Error('Collection name not found');
    }

    console.log('[PostmanV2Parser] Collection name:', data.info.name);
    const result = this.createEmptyResult(data.info.name, this.formatName);

    // Set source info
    result.source.version = this.getVersion(content);
    result.source.originalName = data.info.name;

    // Parse collection metadata
    result.collection = {
      name: data.info.name,
      description: data.info.description,
    };

    // Parse items (folders and requests)
    if (data.item && Array.isArray(data.item)) {
      console.log('[PostmanV2Parser] Parsing', data.item.length, 'items...');
      this.parseItems(data.item, result, null, '', 0);
    }

    // Parse collection-level variables as environment
    if (data.variable && Array.isArray(data.variable)) {
      const env = this.parseVariables(data.variable, data.info.name);
      if (env) {
        result.environments = [env];
        result.stats.totalEnvironments = 1;
      }
    }

    // Update stats
    result.stats.totalFolders = result.folders.length;
    result.stats.totalRequests = result.requests.length;

    console.log(
      '[PostmanV2Parser] Parse complete:',
      result.stats.totalRequests,
      'requests,',
      result.stats.totalFolders,
      'folders'
    );

    return result;
  }

  /**
   * Recursively parse items (folders and requests).
   */
  private parseItems(
    items: PostmanV2Item[],
    result: ImportResult,
    parentTempId: string | null,
    parentPath: string,
    depth: number
  ): void {
    // Prevent infinite recursion
    if (depth > 20) {
      result.warnings.push({
        code: 'DEEP_NESTING',
        message: 'Folder nesting exceeds maximum depth (20)',
      });
      return;
    }

    items.forEach((item, index) => {
      if (item.item && Array.isArray(item.item)) {
        // This is a folder
        const folder = this.parseFolder(item, parentTempId, parentPath, index);
        result.folders.push(folder);

        // Recursively parse nested items
        this.parseItems(
          item.item,
          result,
          folder.tempId,
          folder.path,
          depth + 1
        );
      } else if (item.request) {
        // This is a request
        const request = this.parseRequest(item, parentTempId, index);
        if (request) {
          result.requests.push(request);
        } else {
          result.stats.skippedItems++;
        }
      }
    });
  }

  /**
   * Parse a folder item.
   */
  private parseFolder(
    item: PostmanV2Item,
    parentTempId: string | null,
    parentPath: string,
    order: number
  ): ParsedFolder {
    const tempId = this.generateTempId();
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;

    return {
      tempId,
      name: item.name || 'Unnamed Folder',
      description: item.description,
      path,
      parentTempId,
      order,
    };
  }

  /**
   * Parse a request item.
   */
  private parseRequest(
    item: PostmanV2Item,
    folderTempId: string | null,
    order: number
  ): ParsedRequest | null {
    const req = item.request;
    if (!req) return null;

    // Parse URL
    const url = this.parseUrl(req.url);

    // Parse headers
    const headers = this.parseHeaders(req.header);

    // Parse body
    const { body, bodyType } = this.parseBody(req.body);

    // Parse query params
    const queryParams = this.parseQueryParams(req.url);

    // Parse auth
    const auth = this.parseAuth(req.auth);

    return {
      name: item.name || 'Unnamed Request',
      method: this.normalizeMethod(req.method),
      url,
      headers,
      body,
      bodyType,
      queryParams,
      auth,
      description: req.description || item.description,
      folderTempId,
      order,
    };
  }

  /**
   * Parse URL from string or object format.
   */
  private parseUrl(url: string | PostmanV2Url | undefined): string {
    if (!url) return '';

    if (typeof url === 'string') {
      return url;
    }

    // Object format
    if (url.raw) {
      return url.raw;
    }

    // Build from parts
    let result = '';

    if (url.protocol) {
      result += `${url.protocol}://`;
    }

    if (url.host && Array.isArray(url.host)) {
      result += url.host.join('.');
    }

    if (url.path && Array.isArray(url.path)) {
      result += '/' + url.path.join('/');
    }

    return result || '';
  }

  /**
   * Parse headers array to Record.
   */
  private parseHeaders(
    headers: PostmanV2Header[] | undefined
  ): Record<string, string> {
    const result: Record<string, string> = {};

    if (!headers || !Array.isArray(headers)) {
      return result;
    }

    for (const header of headers) {
      if (header.key && !header.disabled) {
        result[header.key] = header.value || '';
      }
    }

    return result;
  }

  /**
   * Parse body content.
   */
  private parseBody(body: PostmanV2Body | undefined): {
    body: string;
    bodyType?: ParsedRequest['bodyType'];
  } {
    if (!body) {
      return { body: '', bodyType: 'none' };
    }

    switch (body.mode) {
      case 'raw':
        return {
          body: body.raw || '',
          bodyType: this.detectBodyType(body),
        };

      case 'urlencoded':
        if (body.urlencoded && Array.isArray(body.urlencoded)) {
          const params = body.urlencoded
            .filter(p => !p.disabled)
            .map(
              p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
            )
            .join('&');
          return { body: params, bodyType: 'x-www-form-urlencoded' };
        }
        return { body: '', bodyType: 'x-www-form-urlencoded' };

      case 'formdata':
        if (body.formdata && Array.isArray(body.formdata)) {
          // Convert to JSON representation for now
          const data: Record<string, string> = {};
          for (const item of body.formdata) {
            if (!item.disabled && item.type !== 'file') {
              data[item.key] = item.value;
            }
          }
          return { body: JSON.stringify(data, null, 2), bodyType: 'form-data' };
        }
        return { body: '', bodyType: 'form-data' };

      default:
        return { body: '', bodyType: 'none' };
    }
  }

  /**
   * Detect body type from raw options.
   */
  private detectBodyType(body: PostmanV2Body): ParsedRequest['bodyType'] {
    const language = body.options?.raw?.language;

    switch (language) {
      case 'json':
        return 'json';
      case 'xml':
        return 'xml';
      case 'text':
      case 'plain':
        return 'text';
      default:
        // Try to detect from content
        const content = body.raw || '';
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
          return 'json';
        }
        if (content.trim().startsWith('<')) {
          return 'xml';
        }
        return 'text';
    }
  }

  /**
   * Parse query parameters from URL.
   */
  private parseQueryParams(
    url: string | PostmanV2Url | undefined
  ): QueryParam[] {
    const params: QueryParam[] = [];

    if (!url) return params;

    // If object format with query array
    if (typeof url === 'object' && url.query && Array.isArray(url.query)) {
      for (const q of url.query) {
        params.push({
          key: q.key || '',
          value: q.value || '',
          enabled: !q.disabled,
        });
      }
      return params;
    }

    // Parse from URL string
    const urlString = typeof url === 'string' ? url : url.raw || '';

    try {
      const urlObj = new URL(urlString);
      urlObj.searchParams.forEach((value, key) => {
        params.push({ key, value, enabled: true });
      });
    } catch {
      // Try to extract manually if URL is invalid (e.g., has variables)
      const queryIndex = urlString.indexOf('?');
      if (queryIndex > -1) {
        const queryString = urlString.substring(queryIndex + 1);
        const pairs = queryString.split('&');
        for (const pair of pairs) {
          const [key, ...valueParts] = pair.split('=');
          if (key) {
            params.push({
              key,
              value: valueParts.join('='),
              enabled: true,
            });
          }
        }
      }
    }

    return params;
  }

  /**
   * Parse authentication.
   */
  private parseAuth(auth: PostmanV2Auth | undefined): ParsedAuth {
    if (!auth || auth.type === 'noauth') {
      return { type: 'none' };
    }

    switch (auth.type) {
      case 'bearer':
        if (auth.bearer && Array.isArray(auth.bearer)) {
          const tokenParam = auth.bearer.find(p => p.key === 'token');
          return {
            type: 'bearer',
            token: tokenParam?.value || '',
          };
        }
        return { type: 'bearer', token: '' };

      case 'basic':
        if (auth.basic && Array.isArray(auth.basic)) {
          const usernameParam = auth.basic.find(p => p.key === 'username');
          const passwordParam = auth.basic.find(p => p.key === 'password');
          return {
            type: 'basic',
            username: usernameParam?.value || '',
            password: passwordParam?.value || '',
          };
        }
        return { type: 'basic', username: '', password: '' };

      case 'apikey':
        if (auth.apikey && Array.isArray(auth.apikey)) {
          const keyParam = auth.apikey.find(p => p.key === 'key');
          const valueParam = auth.apikey.find(p => p.key === 'value');
          const inParam = auth.apikey.find(p => p.key === 'in');
          return {
            type: 'apikey',
            apiKey: valueParam?.value || '',
            apiKeyHeader:
              keyParam?.value ||
              (inParam?.value === 'header' ? 'X-API-Key' : 'api_key'),
          };
        }
        return { type: 'apikey', apiKey: '', apiKeyHeader: 'X-API-Key' };

      default:
        return { type: 'none' };
    }
  }

  /**
   * Parse collection variables as environment.
   */
  private parseVariables(
    variables: PostmanV2Variable[],
    collectionName: string
  ): ParsedEnvironment | null {
    const vars: Record<string, string> = {};
    let hasVars = false;

    for (const v of variables) {
      if (v.key && !v.disabled) {
        vars[v.key] = v.value || '';
        hasVars = true;
      }
    }

    if (!hasVars) return null;

    return {
      name: `${collectionName} Variables`,
      variables: vars,
    };
  }
}



