import { describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../../../electron/services/logger';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp/user-data')
  }
}));

describe('logger', () => {
  it('should create a logger for a module', () => {
    const logger = createLogger('test-module');
    expect(logger).toBeDefined();
    expect(logger.defaultMeta.module).toBe('test-module');
  });

  it('should log messages without throwing', () => {
    const logger = createLogger('test-log');
    expect(() => logger.info('test message')).not.toThrow();
    expect(() => logger.error('error message')).not.toThrow();
  });
});
