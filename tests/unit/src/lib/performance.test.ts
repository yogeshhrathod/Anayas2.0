import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getPerformanceSnapshot,
    measureAsyncExecution,
    measureExecution,
    trackFeatureLoad
} from '../../../../src/lib/performance';

// Mock logger
vi.mock('../../../../src/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Partially mock performance.now and memory if needed, 
    // but vitest's default environment usually has performance.now()
  });

  describe('trackFeatureLoad', () => {
    it('should track and return metrics on end()', () => {
      const tracker = trackFeatureLoad('TestFeature');
      const metrics = tracker.end();
      
      expect(metrics.feature).toBe('TestFeature');
      expect(metrics.loadTime).toBeGreaterThanOrEqual(0);
      expect(metrics.timestamp).toBeDefined();
    });

    it('should throw error if end() called twice', () => {
      const tracker = trackFeatureLoad('TestFeature');
      tracker.end();
      expect(() => tracker.end()).toThrow('Tracker already ended');
    });

    it('should not throw if cancel() is called', () => {
      const tracker = trackFeatureLoad('TestFeature');
      tracker.cancel();
      expect(() => tracker.end()).toThrow('Tracker already ended');
    });
  });

  describe('getPerformanceSnapshot', () => {
    it('should return relative memory usage', () => {
      const snapshot = getPerformanceSnapshot();
      expect(snapshot.memory).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
    });
  });

  describe('measureExecution', () => {
    it('should measure sync function', () => {
      const result = measureExecution(() => {
        let sum = 0;
        for(let i=0; i<100; i++) sum += i;
        return sum;
      }, 'SyncOp');
      expect(result).toBe(4950);
    });
  });

  describe('measureAsyncExecution', () => {
    it('should measure async function', async () => {
      const result = await measureAsyncExecution(async () => {
        return new Promise(resolve => setTimeout(() => resolve('done'), 10));
      }, 'AsyncOp');
      expect(result).toBe('done');
    });
  });
});
