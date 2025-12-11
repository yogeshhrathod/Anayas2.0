/**
 * Postman Collection v1 Parser
 *
 * Parses legacy Postman Collection v1 format into normalized ImportResult.
 * Note: v1 format has flat folder structure (no nesting).
 */

import { BaseImportStrategy } from './import-strategy';
import type {
  ImportResult,
  ParsedAuth,
  ParsedFolder,
  ParsedRequest,
  QueryParam,
} from './types';

// ============================================================================
// Postman v1 Types (for parsing)
// ============================================================================

interface PostmanV1Collection {
  id: string;
  name: string;
  description?: string;
  timestamp?: number;
  folders?: PostmanV1Folder[];
  requests?: PostmanV1Request[];
}

interface PostmanV1Folder {
  id: string;
  name: string;
  description?: string;
  order?: string[];
}

interface PostmanV1Request {
  id: string;
  name: string;
  description?: string;
  url: string;
  method: string;
  headers?: string;
  data?: string | PostmanV1DataParam[];
  dataMode?: string;
  folder?: string;
  currentHelper?: string;
  helperAttributes?: PostmanV1HelperAttributes;
}

interface PostmanV1DataParam {
  key: string;
  value: string;
  enabled?: boolean;
}

interface PostmanV1HelperAttributes {
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  headerName?: string;
}

// ============================================================================
// Parser Implementation
// ============================================================================

export class PostmanV1Parser extends BaseImportStrategy {
  readonly formatName = 'postman-v1';
  readonly displayName = 'Postman Collection v1 (Legacy)';
  readonly fileExtensions = ['.json'];
  readonly mimeTypes = ['application/json'];

  /**
   * Detect if content is Postman v1 format.
   */
  detect(content: string): boolean {
    const data = this.safeParseJson(content);
    if (!data) return false;

    // v1 has id, name, and requests at root level
    // v1 does NOT have info object (that's v2)
    return (
      data.id &&
      data.name &&
      !data.info &&
      (Array.isArray(data.requests) || Array.isArray(data.folders))
    );
  }

  /**
   * Get confidence score for format detection.
   */
  getConfidence(content: string): number {
    const data = this.safeParseJson(content);
    if (!data) return 0;

    let confidence = 0;

    // Must have id
    if (data.id && typeof data.id === 'string') {
      confidence += 0.3;
    }

    // Must have name
    if (data.name && typeof data.name === 'string') {
      confidence += 0.2;
    }

    // Must NOT have info (v2 indicator)
    if (!data.info) {
      confidence += 0.2;
    }

    // Should have requests or folders array
    if (Array.isArray(data.requests)) {
      confidence += 0.2;
    }

    if (Array.isArray(data.folders)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  /**
   * Get detected version.
   */
  getVersion(content: string): string | undefined {
    const data = this.safeParseJson(content);
    if (!data) return undefined;

    // v1 doesn't have explicit version, but we can detect it
    if (data.id && !data.info) {
      return '1.0.0';
    }
    return undefined;
  }

  /**
   * Parse Postman v1 collection.
   */
  async parse(content: string): Promise<ImportResult> {
    const data = this.safeParseJson(content) as PostmanV1Collection;

    if (!data) {
      throw new Error('Invalid JSON content');
    }

    if (!data.name) {
      throw new Error('Collection name not found');
    }

    const result = this.createEmptyResult(data.name, this.formatName);

    // Set source info
    result.source.version = '1.0.0';
    result.source.originalName = data.name;

    // Parse collection metadata
    result.collection = {
      name: data.name,
      description: data.description,
    };

    // Create folder lookup map
    const folderMap = new Map<string, ParsedFolder>();

    // Parse folders
    if (data.folders && Array.isArray(data.folders)) {
      data.folders.forEach((folder, index) => {
        const parsedFolder = this.parseFolder(folder, index);
        result.folders.push(parsedFolder);
        folderMap.set(folder.id, parsedFolder);
      });
    }

    // Parse requests
    if (data.requests && Array.isArray(data.requests)) {
      // Group requests by folder for ordering
      const requestsByFolder = new Map<string | null, PostmanV1Request[]>();

      for (const req of data.requests) {
        const folderId = req.folder || null;
        if (!requestsByFolder.has(folderId)) {
          requestsByFolder.set(folderId, []);
        }
        requestsByFolder.get(folderId)!.push(req);
      }

      // Parse requests maintaining order within folders
      for (const [folderId, requests] of requestsByFolder) {
        const folderTempId = folderId
          ? folderMap.get(folderId)?.tempId || null
          : null;

        requests.forEach((req, index) => {
          const parsedRequest = this.parseRequest(req, folderTempId, index);
          if (parsedRequest) {
            result.requests.push(parsedRequest);
          } else {
            result.stats.skippedItems++;
          }
        });
      }
    }

    // Update stats
    result.stats.totalFolders = result.folders.length;
    result.stats.totalRequests = result.requests.length;

    // Add warning about v1 format
    result.warnings.push({
      code: 'LEGACY_FORMAT',
      message:
        'This is a Postman v1 collection. Some features may not be fully supported.',
    });

    return result;
  }

  /**
   * Parse a v1 folder.
   */
  private parseFolder(folder: PostmanV1Folder, order: number): ParsedFolder {
    const tempId = this.generateTempId();

    return {
      tempId,
      name: folder.name || 'Unnamed Folder',
      description: folder.description,
      path: folder.name || 'Unnamed Folder',
      parentTempId: null, // v1 folders are flat
      order,
    };
  }

  /**
   * Parse a v1 request.
   */
  private parseRequest(
    req: PostmanV1Request,
    folderTempId: string | null,
    order: number
  ): ParsedRequest | null {
    if (!req.url) {
      return null;
    }

    // Parse headers from string format
    const headers = this.parseHeaders(req.headers);

    // Parse body
    const { body, bodyType } = this.parseBody(req.data, req.dataMode);

    // Parse query params from URL
    const { url, queryParams } = this.parseUrlAndQueryParams(req.url);

    // Parse auth
    const auth = this.parseAuth(req.currentHelper, req.helperAttributes);

    return {
      name: req.name || 'Unnamed Request',
      method: this.normalizeMethod(req.method),
      url,
      headers,
      body,
      bodyType,
      queryParams,
      auth,
      description: req.description,
      folderTempId,
      order,
    };
  }

  /**
   * Parse headers from v1 string format.
   * v1 format: "Content-Type: application/json\nAuthorization: Bearer token"
   */
  private parseHeaders(
    headersString: string | undefined
  ): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!headersString || typeof headersString !== 'string') {
      return headers;
    }

    const lines = headersString.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key) {
          headers[key] = value;
        }
      }
    }

    return headers;
  }

  /**
   * Parse body from v1 format.
   */
  private parseBody(
    data: string | PostmanV1DataParam[] | undefined,
    dataMode: string | undefined
  ): { body: string; bodyType?: ParsedRequest['bodyType'] } {
    if (!data) {
      return { body: '', bodyType: 'none' };
    }

    if (typeof data === 'string') {
      // Raw body
      const bodyType = this.detectBodyType(data, dataMode);
      return { body: data, bodyType };
    }

    if (Array.isArray(data)) {
      // Form data
      switch (dataMode) {
        case 'urlencoded':
          const urlEncoded = data
            .filter(p => p.enabled !== false)
            .map(
              p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
            )
            .join('&');
          return { body: urlEncoded, bodyType: 'x-www-form-urlencoded' };

        case 'params':
        case 'formdata':
          const formData: Record<string, string> = {};
          for (const item of data) {
            if (item.enabled !== false) {
              formData[item.key] = item.value;
            }
          }
          return {
            body: JSON.stringify(formData, null, 2),
            bodyType: 'form-data',
          };

        default:
          return { body: '', bodyType: 'none' };
      }
    }

    return { body: '', bodyType: 'none' };
  }

  /**
   * Detect body type from content.
   */
  private detectBodyType(
    body: string,
    dataMode: string | undefined
  ): ParsedRequest['bodyType'] {
    if (dataMode === 'raw') {
      const trimmed = body.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return 'json';
      }
      if (trimmed.startsWith('<')) {
        return 'xml';
      }
      return 'text';
    }

    if (dataMode === 'urlencoded') {
      return 'x-www-form-urlencoded';
    }

    if (dataMode === 'params' || dataMode === 'formdata') {
      return 'form-data';
    }

    return 'text';
  }

  /**
   * Parse URL and extract query parameters.
   */
  private parseUrlAndQueryParams(rawUrl: string): {
    url: string;
    queryParams: QueryParam[];
  } {
    const queryParams: QueryParam[] = [];
    let url = rawUrl;

    try {
      const urlObj = new URL(rawUrl);
      url = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

      urlObj.searchParams.forEach((value, key) => {
        queryParams.push({ key, value, enabled: true });
      });
    } catch {
      // URL might have variables, parse manually
      const queryIndex = rawUrl.indexOf('?');
      if (queryIndex > -1) {
        url = rawUrl.substring(0, queryIndex);
        const queryString = rawUrl.substring(queryIndex + 1);
        const pairs = queryString.split('&');

        for (const pair of pairs) {
          const [key, ...valueParts] = pair.split('=');
          if (key) {
            queryParams.push({
              key,
              value: valueParts.join('='),
              enabled: true,
            });
          }
        }
      }
    }

    return { url, queryParams };
  }

  /**
   * Parse v1 authentication.
   */
  private parseAuth(
    currentHelper: string | undefined,
    helperAttributes: PostmanV1HelperAttributes | undefined
  ): ParsedAuth {
    if (!currentHelper || currentHelper === 'normal') {
      return { type: 'none' };
    }

    switch (currentHelper) {
      case 'basicAuth':
        return {
          type: 'basic',
          username: helperAttributes?.username || '',
          password: helperAttributes?.password || '',
        };

      case 'bearerAuth':
        return {
          type: 'bearer',
          token: helperAttributes?.token || '',
        };

      case 'apiKeyAuth':
        return {
          type: 'apikey',
          apiKey: helperAttributes?.apiKey || '',
          apiKeyHeader: helperAttributes?.headerName || 'X-API-Key',
        };

      default:
        return { type: 'none' };
    }
  }
}
