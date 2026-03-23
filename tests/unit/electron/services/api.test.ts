import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from '../../../../electron/services/api';
import fs from 'fs';
import path from 'path';

// Mock the logger to avoid polluting test output
vi.mock('../../../../electron/services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock fs and path
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  }
}));

const mockFetch = vi.fn();
const mockSetCertificateVerifyProc = vi.fn();
vi.mock('electron', () => ({
  net: {
    fetch: (...args: any[]) => mockFetch(...args),
  },
  session: {
    fromPartition: vi.fn().mockReturnValue({
      setCertificateVerifyProc: mockSetCertificateVerifyProc,
    }),
  },
}));

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService();
    mockFetch.mockReset();
    mockSetCertificateVerifyProc.mockReset();
    vi.mocked(fs.existsSync).mockReset();
    vi.mocked(fs.readFileSync).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockResponse = (body: any, options: { status?: number, statusText?: string, contentType?: string, headers?: Record<string, string> } = {}) => {
    const headersMap = new Map<string, string>();
    if (options.contentType) headersMap.set('content-type', options.contentType);
    if (options.headers) {
      Object.entries(options.headers).forEach(([k, v]) => headersMap.set(k.toLowerCase(), v));
    }

    const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
    const bodyBuffer = Buffer.from(bodyText);

    return {
      ok: options.status ? options.status >= 200 && options.status < 300 : true,
      status: options.status || 200,
      statusText: options.statusText || 'OK',
      headers: {
        forEach: (cb: (value: string, key: string) => void) => {
          headersMap.forEach((v, k) => cb(v, k));
        },
        get: (key: string) => headersMap.get(key.toLowerCase()) || null,
      },
      json: vi.fn().mockResolvedValue(body),
      text: vi.fn().mockResolvedValue(bodyText),
      arrayBuffer: vi.fn().mockResolvedValue(bodyBuffer.buffer.slice(bodyBuffer.byteOffset, bodyBuffer.byteOffset + bodyBuffer.byteLength)),
    };
  };


  it('should make a successful GET request', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ message: 'success' }, { contentType: 'application/json' }));

    const result = await apiService.getJson('https://api.example.com/data');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', expect.objectContaining({
      method: 'GET',
    }));
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ message: 'success' });
  });

  it('should handle convenience methods correctly', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true }, { contentType: 'application/json' }));
    
    await apiService.putJson('https://api.example.com', { a: 1 });
    expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: 'PUT' }));

    await apiService.patchJson('https://api.example.com', { a: 1 });
    expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: 'PATCH' }));

    await apiService.deleteJson('https://api.example.com');
    expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE' }));

    await apiService.headJson('https://api.example.com');
    expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: 'HEAD' }));

    await apiService.optionsJson('https://api.example.com');
    expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: 'OPTIONS' }));
  });

  it('should make a POST request with JSON body', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ id: 1 }, { contentType: 'application/json' }));

    const data = { name: 'Test' };
    const result = await apiService.postJson('https://api.example.com/users', data);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(data),
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
    }));
    expect(result.status).toBe(200);
  });

  it('should handle multipart/form-data with files', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true }, { contentType: 'application/json' }));
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('file content'));

    const body = JSON.stringify({
      field1: 'value1',
      file1: 'FILE::/path/to/test.txt'
    });

    await apiService.request('https://api.example.com/upload', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.body).toBeInstanceOf(FormData);
    expect(callArgs.headers['Content-Type']).toBeUndefined(); // Should be deleted to let fetch set boundary
  });

  it('should handle SSL verification disabled', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true }));
    
    await apiService.request('https://api.example.com', {
      method: 'GET',
      sslVerification: false
    });

    expect(mockSetCertificateVerifyProc).toHaveBeenCalled();
  });

  it('should handle downloadFile', async () => {
    mockFetch.mockResolvedValue(createMockResponse('hello world', { contentType: 'application/octet-stream' }));

    const result = await apiService.downloadFile('https://api.example.com/file');
    expect(result?.toString()).toBe('hello world');
  });


  it('should handle request cancellation', async () => {
    mockFetch.mockImplementation((url: string, options: any) => new Promise((resolve, reject) => {
      if (options?.signal?.aborted) {
        const error = new Error('The user aborted a request.');
        error.name = 'AbortError';
        return reject(error);
      }
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          const error = new Error('The user aborted a request.');
          error.name = 'AbortError';
          reject(error);
        });
      }
    }));

    const transactionId = 'tx-123';
    const requestPromise = apiService.request('https://api.example.com/delayed', {
      method: 'GET',
      transactionId,
    });

    const cancelResult = apiService.cancelRequest(transactionId);
    expect(cancelResult).toBe(true);
    expect(apiService.cancelRequest('non-existent')).toBe(false);

    try {
      await requestPromise;
      expect.fail('Should have thrown an AbortError');
    } catch (e: any) {
      expect(e.message).toContain('Request cancelled');
    }
  });

  it('should handle timeout correctly', async () => {
    mockFetch.mockImplementation((url: string, options: any) => new Promise((resolve, reject) => {
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          const error = new Error('Timeout aborted');
          error.name = 'AbortError';
          reject(error);
        });
      }
    }));

    try {
      await apiService.request('https://api.example.com/timeout', {
        method: 'GET',
        timeout: 10,
      });
      expect.fail('Should have thrown a timeout error');
    } catch (e: any) {
      expect(e.message).toContain('timeout');
    }
  });

  it('should parse form-urlencoded body correctly', async () => {
    mockFetch.mockResolvedValue(createMockResponse({ success: true }, { contentType: 'application/json' }));
    const urlEncodedData = JSON.stringify({ key1: 'value1', key2: 'value2' });
    
    await apiService.request('https://api.example.com/form', {
      method: 'POST',
      body: urlEncodedData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.body).toBe('key1=value1&key2=value2');
  });

  it('should test connection successfully', async () => {
    mockFetch.mockResolvedValue(createMockResponse({}, { status: 200 }));
    const isConnected = await apiService.testConnection('https://api.example.com/ping');
    expect(isConnected).toBe(true);
  });

  it('should return false for failed connection test', async () => {
    mockFetch.mockResolvedValue(createMockResponse({}, { status: 500 }));
    const isConnected = await apiService.testConnection('https://api.example.com/ping');
    expect(isConnected).toBe(false);
  });

  it('catch fetching error and return false for connection test', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const isConnected = await apiService.testConnection('https://api.example.com/ping');
    expect(isConnected).toBe(false);
  });

  it('should handle fetch errors with cause', async () => {
    const error = new Error('fetch failed') as any;
    error.cause = { message: 'connection refused' };
    mockFetch.mockRejectedValue(error);

    try {
      await apiService.request('https://api.example.com', { method: 'GET' });
      expect.fail('Should have thrown');
    } catch (e: any) {
      expect(e.message).toContain('connection refused');
    }
  });
});

