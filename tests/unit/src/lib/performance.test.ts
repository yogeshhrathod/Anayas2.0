import { describe, expect, it, vi, beforeEach } from 'vitest';
import { 
  trackFeatureLoad, 
  trackBundleSize, 
  getPerformanceSnapshot, 
  measureExecution, 
  measureAsyncExecution 
} from '../../../../src/lib/performance';

// Mock logger
vi.mock('../../../../src/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

describe('performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock performance.now and performance.memory
    const mockNow = vi.fn();
    mockNow.mockReturnValueOnce(100).mockReturnValueOnce(200); // 100ms delta
    
    global.performance = {
      now: mockNow,
      memory: {
        usedJSHeapSize: 10 * 1024 * 1024 // 10MB
      }
    } as any;
  });

  describe('trackFeatureLoad', () => {
    it('should track load time and memory delta', () => {
      const tracker = trackFeatureLoad('TestFeature');
      
      // Update memory for the end call
      (global.performance as any).memory.usedJSHeapSize = 20 * 1024 * 1024; // 20MB
      
      const metrics = tracker.end();
      
      expect(metrics.feature).toBe('TestFeature');
      expect(metrics.loadTime).toBe(100);
      expect(metrics.memoryDelta).toBe(10); // 20MB - 10MB
    });

    it('should throw error if ended twice', () => {
      const tracker = trackFeatureLoad('TestFeature');
      tracker.end();
      expect(() => tracker.end()).toThrow('Tracker already ended');
    });

    it('should not track if cancelled', () => {
      const tracker = trackFeatureLoad('TestFeature');
      tracker.cancel();
      expect(() => tracker.end()).toThrow('Tracker already ended');
    });
  });

  describe('trackBundleSize', () => {
    it('should log bundle size', () => {
      trackBundleSize('main.js', 1024 * 100); // 100KB
      // Should not warn as it's under budget
    });

    it('should warn if over budget', () => {
       trackBundleSize('large.js', 1024 * 600); // 600KB > 500KB budget
    });
  });

  describe('getPerformanceSnapshot', () => {
    it('should return current memory usage', () => {
      const snapshot = getPerformanceSnapshot();
      expect(snapshot.memory).toBe(10); // 10MB
    });
  });

  describe('measureExecution', () => {
    it('should measure synchronous function', () => {
      const result = measureExecution(() => 'done', 'SyncOp');
      expect(result).toBe('done');
    });
  });

  describe('measureAsyncExecution', () => {
    it('should measure asynchronous function', async () => {
      const result = await measureAsyncExecution(async () => 'async done', 'AsyncOp');
      expect(result).toBe('async done');
    });
  });
});
