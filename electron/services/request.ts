import { apiService } from './api';
import { createLogger } from './logger';
import { BrowserWindow } from 'electron';

const logger = createLogger('request');

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  auth?: any;
}

export interface RequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  size: number;
}

export class RequestService {
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private sendProgress(step: string, message: string, progress: number, extra?: any) {
    const progressData = {
      step,
      message,
      progress,
      ...extra,
    };
    console.log('[RequestService] Sending progress:', progressData);
    if (this.mainWindow) {
      console.log('[RequestService] MainWindow exists, sending to webContents');
      this.mainWindow.webContents.send('request:progress', progressData);
    } else {
      console.log('[RequestService] ERROR: No mainWindow!');
    }
    logger.info(`Progress: ${step} - ${message}`, { progress, ...extra });
  }

  async sendRequest(options: RequestOptions): Promise<RequestResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Prepare request
      this.sendProgress('prepare', 'Preparing request...', 10);
      
      // Step 2: Send request
      this.sendProgress('sending', 'Sending request...', 30);
      
      let result: any;
      let status = 200;
      let statusText = 'OK';
      const headers: Record<string, string> = {};
      let data: any = null;

      try {
        switch (options.method) {
          case 'GET':
            result = await apiService.getJson(options.url, options.headers);
            break;
          case 'POST':
            result = await apiService.postJson(options.url, options.body, options.headers);
            break;
          case 'PUT':
            result = await apiService.putJson(options.url, options.body, options.headers);
            break;
          case 'PATCH':
            result = await apiService.patchJson(options.url, options.body, options.headers);
            break;
          case 'DELETE':
            result = await apiService.deleteJson(options.url, options.headers);
            break;
          case 'HEAD':
            result = await apiService.headJson(options.url, options.headers);
            break;
          case 'OPTIONS':
            result = await apiService.optionsJson(options.url, options.headers);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${options.method}`);
        }
        
        data = result;
      } catch (err: unknown) {
        // Handle HTTP errors
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (err instanceof Error && err.message.includes('API Error:')) {
          const statusMatch = err.message.match(/API Error: (\d+)/);
          status = statusMatch ? parseInt(statusMatch[1]) : 500;
          statusText = err.message;
        } else {
          status = 0; // Network error
          statusText = errorMessage;
        }
        data = { error: errorMessage };
      }

      const responseTime = Date.now() - startTime;
      const responseSize = JSON.stringify(data).length;

      // Step 3: Complete
      this.sendProgress('complete', 'Request completed', 100, { 
        status, 
        responseTime,
        size: responseSize 
      });

      return {
        status,
        statusText,
        headers,
        data,
        responseTime,
        size: responseSize,
      };
    } catch (error: unknown) {
      this.sendProgress('error', error instanceof Error ? error.message : 'Request failed', 0);
      throw error;
    }
  }

  async testConnection(url: string): Promise<boolean> {
    try {
      const result = await apiService.testConnection(url);
      return result;
    } catch (error: unknown) {
      logger.error('Connection test failed', error);
      return false;
    }
  }
}

export const requestService = new RequestService();
