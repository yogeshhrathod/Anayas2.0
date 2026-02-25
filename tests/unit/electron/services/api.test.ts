import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from '../../../../electron/services/api';

// Mock the logger to avoid polluting test output
vi.mock('../../../../electron/services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('ApiService', () => {
  let apiService: ApiService;
  let fetchMock: any;

  beforeEach(() => {
    apiService = new ApiService();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockResponse = (body: any, options: { status?: number, statusText?: string, contentType?: string } = {}) => {
    return {
      ok: options.status ? options.status >= 200 && options.status < 300 : true,
      status: options.status || 200,
      statusText: options.statusText || 'OK',
      headers: {
        forEach: (cb: (value: string, key: string) => void) => {
          if (options.contentType) {
            cb(options.contentType, 'content-type');
          }
        },
        get: (key: string) => {
          if (key.toLowerCase() === 'content-type') return options.contentType;
          return null;
        }
      },
      json: vi.fn().mockResolvedValue(body),
      text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    };
  };

  it('should make a successful GET request', async () => {
    fetchMock.mockResolvedValue(createMockResponse({ message: 'success' }, { contentType: 'application/json' }));

    const result = await apiService.getJson('https://api.example.com/data');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/data', expect.objectContaining({
      method: 'GET',
    }));
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ message: 'success' });
  });

  it('should make a POST request with JSON body', async () => {
    fetchMock.mockResolvedValue(createMockResponse({ id: 1 }, { contentType: 'application/json' }));

    const data = { name: 'Test' };
    const result = await apiService.postJson('https://api.example.com/users', data);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/users', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(data),
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
    }));
    expect(result.status).toBe(200);
  });

  it('should handle request cancellation', async () => {
    // We mock fetch to never resolve so we can abort it, and listen for the abort signal
    fetchMock.mockImplementation((url: string, options: any) => new Promise((resolve, reject) => {
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          const error = new Error('The user aborted a request.');
          error.name = 'AbortError';
          reject(error);
        });
      }
    }));

    const transactionId = 'tx-123';
    
    // Start request without awaiting
    const requestPromise = apiService.request('https://api.example.com/delayed', {
      method: 'GET',
      transactionId,
    });

    // Cancel immediately
    const cancelResult = apiService.cancelRequest(transactionId);
    expect(cancelResult).toBe(true);

    try {
      await requestPromise;
      expect.fail('Should have thrown an AbortError');
    } catch (e: any) {
      expect(e.message).toContain('Request cancelled');
    }
  });

  it('should handle timeout correctly', async () => {
    // Mock fetch to never resolve but respect signal abortion 
    fetchMock.mockImplementation((url: string, options: any) => new Promise((resolve, reject) => {
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
        timeout: 10, // 10ms timeout
      });
      expect.fail('Should have thrown a timeout error');
    } catch (e: any) {
      expect(e.message).toContain('timeout');
    }
  });

  it('should parse form-urlencoded body correctly', async () => {
    fetchMock.mockResolvedValue(createMockResponse({ success: true }, { contentType: 'application/json' }));

    const urlEncodedData = JSON.stringify({ key1: 'value1', key2: 'value2' });
    
    await apiService.request('https://api.example.com/form', {
      method: 'POST',
      body: urlEncodedData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const callArgs = fetchMock.mock.calls[0][1];
    expect(callArgs.body).toBe('key1=value1&key2=value2');
  });

  it('should test connection successfully', async () => {
    fetchMock.mockResolvedValue(createMockResponse({}, { status: 200 }));
    
    const isConnected = await apiService.testConnection('https://api.example.com/ping');
    expect(isConnected).toBe(true);
  });

  it('should return false for failed connection test', async () => {
    fetchMock.mockResolvedValue(createMockResponse({}, { status: 500 }));
    
    const isConnected = await apiService.testConnection('https://api.example.com/ping');
    expect(isConnected).toBe(false);
  });

  it('catch fetching error and return false for connection test', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));
    
    const isConnected = await apiService.testConnection('https://api.example.com/ping');
    expect(isConnected).toBe(false);
  });
});
