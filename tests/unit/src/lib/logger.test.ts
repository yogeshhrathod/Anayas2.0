import { describe, expect, it, vi, beforeEach } from 'vitest';
import logger from '../../../../src/lib/logger';

describe('logger-renderer', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      electronAPI: {
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn()
        }
      }
    });

    vi.stubGlobal('console', {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    });
  });

  it('should call electronAPI and console on info', () => {
    logger.info('test', { a: 1 });
    expect((window as any).electronAPI.logger.info).toHaveBeenCalledWith('test', { a: 1 });
  });

  it('should call electronAPI and console on error', () => {
    logger.error('test error');
    expect((window as any).electronAPI.logger.error).toHaveBeenCalledWith('test error');
  });

  it('should call electronAPI and console on warn', () => {
    logger.warn('test warn');
    expect((window as any).electronAPI.logger.warn).toHaveBeenCalledWith('test warn');
  });

  it('should call electronAPI and console on debug in development', () => {
    vi.stubGlobal('process', { env: { NODE_ENV: 'development' } });
    logger.debug('test debug');
    expect((window as any).electronAPI.logger.debug).toHaveBeenCalledWith('test debug');
    expect(console.debug).toHaveBeenCalled();
  });

  it('should not call console on info in production', () => {
    vi.stubGlobal('process', { env: { NODE_ENV: 'production' } });
    logger.info('test production');
    expect((window as any).electronAPI.logger.info).toHaveBeenCalledWith('test production');
    expect(console.info).not.toHaveBeenCalled();
  });
});
