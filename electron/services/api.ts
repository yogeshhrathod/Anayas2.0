import { createLogger } from './logger';

const logger = createLogger('api');

interface FetchOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  isJson?: boolean;
}

export class ApiService {
  private async request<T>(url: string, options: FetchOptions): Promise<T | null> {
    try {
      const headers = { ...options.headers };
      let body = options.body;

      if (options.isJson) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      } else if (body instanceof URLSearchParams) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      logger.info(`API Request: ${options.method} ${url}`);

      const response = await fetch(url, { method: options.method, headers, body });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`API Error: ${response.status} ${response.statusText}`, { url, error: errorText });
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      if (response.headers.get('content-type')?.includes('application/json')) {
        return response.json() as Promise<T>;
      }

      return response as T;
    } catch (err) {
      logger.error(`Request failed for ${url}`, err);
      throw err;
    }
  }

  putJson<T>(url: string, data: any, headers?: Record<string, string>): Promise<T | null> {
    return this.request<T>(url, { method: 'PUT', body: data, headers, isJson: true });
  }

  postJson<T>(url: string, data: any, headers?: Record<string, string>): Promise<T | null> {
    return this.request<T>(url, { method: 'POST', body: data, headers, isJson: true });
  }

  getJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  deleteJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }

  patchJson<T>(url: string, data: any, headers?: Record<string, string>): Promise<T | null> {
    return this.request<T>(url, { method: 'PATCH', body: data, headers, isJson: true });
  }

  headJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
    return this.request<T>(url, { method: 'HEAD', headers });
  }

  optionsJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
    return this.request<T>(url, { method: 'OPTIONS', headers });
  }

  postForm<T>(url: string, formData: URLSearchParams, headers?: Record<string, string>): Promise<T | null> {
    return this.request<T>(url, { method: 'POST', body: formData, headers });
  }

  async downloadFile(url: string, headers?: Record<string, string>): Promise<Buffer | null> {
    const response = await this.request<Response>(url, { method: 'GET', headers });
    if (response) {
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    }
    return null;
  }

  async testConnection(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'GET' });
      return response.ok || response.status < 500;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
