import fs from 'fs';
import path from 'path';
import { createLogger } from './logger';

const logger = createLogger('api');

interface FetchOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  isJson?: boolean;
  timeout?: number;
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

    try {
      const headers: Record<string, string> = {};
      let hasContentType = false;
      let contentTypeValue = '';
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          headers[key] = value;
          if (key.toLowerCase() === 'content-type') {
            hasContentType = true;
            contentTypeValue = value.toLowerCase();
          }
        }
      }

      let body = options.body;

      if (contentTypeValue.includes('multipart/form-data') && typeof body === 'string') {
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
          const contentTypesKeys = Object.keys(headers).filter(k => k.toLowerCase() === 'content-type');
          contentTypesKeys.forEach(k => delete headers[k]); 
        } catch (e) {
          logger.error('Failed to parse multipart/form-data body', { error: e });
        }
      } else if (contentTypeValue.includes('application/x-www-form-urlencoded') && typeof body === 'string') {
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
      const timeoutId = setTimeout(
        () => {
          isTimeout = true;
          controller.abort();
        },
        options.timeout || 30000
      );

      const response = await fetch(url, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      });

      if (options.transactionId) {
        this.activeRequests.delete(options.transactionId);
      }
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseBody: any;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        try {
          responseBody = await response.json();
        } catch (e) {
          responseBody = await response.text();
        }
      } else if (contentType.includes('text/')) {
        responseBody = await response.text();
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
        const message = isTimeout ? `Request timeout after ${options.timeout || 30000}ms` : 'Request cancelled by user';
        logger.error(message, { responseTime });
        throw new Error(message);
      }

      logger.error(`Request failed for ${url}`, {
        error: err.message,
        responseTime,
      });
      throw err;
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
