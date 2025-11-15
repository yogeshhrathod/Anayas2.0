/**
 * Execution trace utilities
 */

export interface TraceEntry {
  step: string;
  data?: any;
  timestamp: number;
  duration?: number;
}

class ExecutionTracer {
  private traces: TraceEntry[] = [];
  private stepStartTimes: Map<string, number> = new Map();

  /**
   * Start tracing a step
   */
  start(step: string, data?: any): void {
    this.stepStartTimes.set(step, Date.now());
    this.traces.push({
      step,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * End tracing a step
   */
  end(step: string, data?: any): void {
    const startTime = this.stepStartTimes.get(step);
    if (startTime) {
      const duration = Date.now() - startTime;
      const trace = this.traces.find(t => t.step === step && !t.duration);
      if (trace) {
        trace.duration = duration;
        trace.data = { ...trace.data, ...data };
      }
      this.stepStartTimes.delete(step);
    }
  }

  /**
   * Add trace entry
   */
  add(step: string, data?: any): void {
    this.traces.push({
      step,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get all traces
   */
  getTraces(): TraceEntry[] {
    return [...this.traces];
  }

  /**
   * Get traces as JSON string
   */
  getTracesAsJSON(): string {
    return JSON.stringify(this.traces, null, 2);
  }

  /**
   * Clear all traces
   */
  clear(): void {
    this.traces = [];
    this.stepStartTimes.clear();
  }

  /**
   * Get trace summary
   */
  getSummary(): { totalSteps: number; totalDuration: number; steps: Array<{ step: string; duration: number }> } {
    const stepsWithDuration = this.traces
      .filter(t => t.duration)
      .map(t => ({ step: t.step, duration: t.duration! }));
    
    const totalDuration = stepsWithDuration.reduce((sum, s) => sum + s.duration, 0);
    
    return {
      totalSteps: this.traces.length,
      totalDuration,
      steps: stepsWithDuration,
    };
  }
}

// Export singleton instance
export const tracer = new ExecutionTracer();

