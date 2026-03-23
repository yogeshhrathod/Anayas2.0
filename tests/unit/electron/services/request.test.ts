import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RequestService, RequestOptions } from '../../../../electron/services/request';
import { apiService } from '../../../../electron/services/api';

vi.mock('../../../../electron/services/api', () => ({
  apiService: {
    getJson: vi.fn(),
    postJson: vi.fn(),
    putJson: vi.fn(),
    patchJson: vi.fn(),
    deleteJson: vi.fn(),
    headJson: vi.fn(),
    optionsJson: vi.fn(),
    testConnection: vi.fn(),
  },
}));

vi.mock('../../../../electron/services/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('RequestService', () => {
  let requestService: RequestService;
  let mockWindow: any;

  beforeEach(() => {
    vi.clearAllMocks();
    requestService = new RequestService();
    mockWindow = {
      webContents: {
        send: vi.fn(),
      },
    };
  });

  it('should send progress updates if mainWindow is set', async () => {
    requestService.setMainWindow(mockWindow);
    vi.mocked(apiService.getJson).mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, body: { success: true }, responseTime: 100 });


    const options: RequestOptions = { method: 'GET', url: 'https://api.example.com' };
    await requestService.sendRequest(options);

    expect(mockWindow.webContents.send).toHaveBeenCalledWith('request:progress', expect.objectContaining({ step: 'prepare' }));
    expect(mockWindow.webContents.send).toHaveBeenCalledWith('request:progress', expect.objectContaining({ step: 'sending' }));
    expect(mockWindow.webContents.send).toHaveBeenCalledWith('request:progress', expect.objectContaining({ step: 'complete' }));
  });

  it('should handle all HTTP methods', async () => {
    const response = { status: 200, statusText: 'OK', headers: {}, body: { success: true }, responseTime: 100 };
    vi.mocked(apiService.getJson).mockResolvedValue(response);
    vi.mocked(apiService.postJson).mockResolvedValue(response);
    vi.mocked(apiService.putJson).mockResolvedValue(response);
    vi.mocked(apiService.patchJson).mockResolvedValue(response);
    vi.mocked(apiService.deleteJson).mockResolvedValue(response);
    vi.mocked(apiService.headJson).mockResolvedValue(response);
    vi.mocked(apiService.optionsJson).mockResolvedValue(response);


    const methods: Array<RequestOptions['method']> = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    
    for (const method of methods) {
      const options: RequestOptions = { method, url: 'https://api.example.com', body: '{}' };
      const result = await requestService.sendRequest(options);
      expect(result.status).toBe(200);
      
      const mockMethod = method === 'GET' ? apiService.getJson :
                         method === 'POST' ? apiService.postJson :
                         method === 'PUT' ? apiService.putJson :
                         method === 'PATCH' ? apiService.patchJson :
                         method === 'DELETE' ? apiService.deleteJson :
                         method === 'HEAD' ? apiService.headJson :
                         apiService.optionsJson;
      
      expect(mockMethod).toHaveBeenCalled();
    }
  });

  it('should handle unsupported method by returning error in response', async () => {
    const options = { method: 'INVALID' as any, url: '...' };
    const result = await requestService.sendRequest(options);
    expect(result.status).toBe(0);
    expect(result.data.error).toContain('Unsupported HTTP method');
  });


  it('should handle API errors', async () => {
    vi.mocked(apiService.getJson).mockRejectedValue(new Error('API Error: 404 Not Found'));
    const options: RequestOptions = { method: 'GET', url: 'https://api.example.com/404' };
    
    const result = await requestService.sendRequest(options);
    expect(result.status).toBe(404);
    expect(result.data.error).toContain('404');
  });

  it('should handle network errors', async () => {
    vi.mocked(apiService.getJson).mockRejectedValue(new Error('Network error'));
    const options: RequestOptions = { method: 'GET', url: 'https://api.example.com' };
    
    const result = await requestService.sendRequest(options);
    expect(result.status).toBe(0);
    expect(result.data.error).toBe('Network error');
  });

  it('should test connection', async () => {
    vi.mocked(apiService.testConnection).mockResolvedValue(true);
    expect(await requestService.testConnection('url')).toBe(true);

    vi.mocked(apiService.testConnection).mockRejectedValue(new Error('fail'));
    expect(await requestService.testConnection('url')).toBe(false);
  });
});
