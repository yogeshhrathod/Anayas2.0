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
  private async request(
    _url: string,
    options: FetchOptions
  ): Promise<ApiResponse> {
    const startTime = Date.now();

    try {
      const headers = { ...options.headers };
      let body = options.body;

      if (options.isJson && body) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      } else if (body instanceof URLSearchParams) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      logger.info(`API Request: ${options.method} ${url}`, { headers });

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || 30000
      );

      const response = await fetch(url, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      });

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
        } catch {
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
      const responseTime = Date.now() - startTime;

      if (err.name === 'AbortError') {
        logger.error(`Request timeout for ${url}`, { responseTime });
        throw new Error(`Request timeout after ${options.timeout || 30000}ms`);
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
