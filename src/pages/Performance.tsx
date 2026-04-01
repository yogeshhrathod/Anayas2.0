import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  AlertCircle,
  ArrowLeft,
  Settings2,
  TrendingUp,
  Globe,
  Gauge,
  Timer,
  Info,
  Zap,
  BarChart3,
  Clock,
  Wifi,
  Hash,
  Server,
  XCircle,
  Loader2,
  Search,
  Terminal,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Area,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
} from 'recharts';
import { useStore, PerformanceResult, PerformanceReport } from '../store/useStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { cn } from '../lib/utils';
import logger from '../lib/logger';

// ─── Helpers ───────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return Math.round(n).toLocaleString();
}

function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ─── Stat Card ─────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  pulse?: boolean;
}> = ({ icon, label, value, subtitle, color = 'text-foreground', pulse }) => (
  <motion.div
    whileHover={{ y: -2, scale: 1.01 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className="relative group h-full"
  >
    <div className="h-full p-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/10 shadow-lg overflow-hidden flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex items-start justify-between relative mb-2">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">
          {label}
        </span>
        <div className={cn(
          'flex items-center justify-center p-2 rounded-xl transition-all',
          pulse ? 'bg-primary/20 animate-pulse' : 'bg-muted/40'
        )}>
          {React.cloneElement(icon as React.ReactElement, { className: 'h-3.5 w-3.5' })}
        </div>
      </div>
      <div className="relative">
        <motion.p
          key={value}
          initial={{ opacity: 0.6, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('text-xl font-black tabular-nums tracking-tighter leading-none', color)}
        >
          {value}
        </motion.p>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground/50 mt-1 block font-medium">{subtitle}</span>
        )}
      </div>
    </div>
  </motion.div>
);

// ─── Scanning Animation ───────────────────────────────────────────
const ScanningAnimation: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-6 py-16">
    <div className="relative">
      <div className="w-20 h-20 rounded-full border-2 border-primary/20 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          </div>
        </div>
      </div>
      <motion.div
        className="absolute inset-0 rounded-full border-t-2 border-primary"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
    <div className="text-center space-y-1">
      <p className="text-sm font-bold text-foreground">Initiating Test...</p>
      <p className="text-xs text-muted-foreground font-medium">Priming connections & buffers</p>
    </div>
  </div>
);

// ─── Empty State ───────────────────────────────────────────────────
const EmptyChartState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4 py-12 opacity-50">
    <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
    <div className="text-center space-y-1">
      <p className="text-sm font-bold text-muted-foreground">Chart Ready</p>
      <p className="text-xs text-muted-foreground/60">Live results will stream here</p>
    </div>
  </div>
);

// ─── Progress Bar ──────────────────────────────────────────────────
const LiveProgress: React.FC<{ elapsed: number; total: number; running: boolean }> = ({
  elapsed,
  total,
  running,
}) => {
  const pct = total > 0 ? Math.min((elapsed / total) * 100, 100) : 0;
  if (!running) return null;

  return (
    <div className="w-full space-y-2 mb-8 mt-4">
      <div className="flex items-center justify-between text-[10px] uppercase font-black text-muted-foreground tracking-widest">
        <span className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
          Benchmarking Active
        </span>
        <span className="tabular-nums font-mono">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden border border-white/[0.03]">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-primary to-indigo-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </div>
    </div>
  );
};

// ─── Resolve CSS variables for chart (Recharts SVG doesn't resolve vars) ──
function useCssVar(variable: string): string {
  const [value, setValue] = React.useState('');

  useEffect(() => {
    const update = () => {
      let val = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
      // If it's a raw HSL string (like "215.4 16.3% 46.9%"), wrap it for SVG stroke/fill
      if (val && !val.startsWith('#') && !val.startsWith('rgb') && !val.startsWith('hsl')) {
          val = `hsl(${val})`;
      }
      setValue(val);
    };
    update();
    // Re-read when theme changes
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, [variable]);

  return value;
}

// ─── Custom Tooltip ────────────────────────────────────────────────
const ChartTooltipContent: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-4 py-3 rounded-2xl bg-card border border-border shadow-2xl text-[10px] font-bold space-y-1">
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground uppercase tracking-wider">{entry.name}:</span>
          <span className="tabular-nums text-foreground">
            {entry.name === 'Latency' ? `${entry.value.toFixed(1)}ms` : entry.name === 'Throughput KB/s' ? `${entry.value.toFixed(1)} KB/s` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────
const PerformancePage: React.FC = () => {
  const setCurrentPage = useStore(s => s.setCurrentPage);
  const requests = useStore(s => s.requests);
  const collections = useStore(s => s.collections);
  const currentEnvironment = useStore(s => s.currentEnvironment);

  const performanceRunning = useStore(s => s.performanceRunning);
  const setPerformanceRunning = useStore(s => s.setPerformanceRunning);
  const performanceProgress = useStore(s => s.performanceProgress);
  const addPerformanceProgress = useStore(s => s.addPerformanceProgress);
  const performanceReport = useStore(s => s.performanceReport);
  const setPerformanceReport = useStore(s => s.setPerformanceReport);
  const clearPerformanceData = useStore(s => s.clearPerformanceData);

  const performanceTargetRequestId = useStore(s => s.performanceTargetRequestId);
  const setPerformanceTargetRequestId = useStore(s => s.setPerformanceTargetRequestId);

  // Theme-aware chart colors (resolved from CSS variables at render time)
  const chartMuted = useCssVar('--muted-foreground');
  const chartBorder = useCssVar('--border');


  // Form state
  const [selectedRequestId, setSelectedRequestId] = useState<string | number>('');
  const [connections, setConnections] = useState(10);
  const [pipelining, setPipelining] = useState(1);
  const [duration, setDuration] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [requestSearch, setRequestSearch] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Ensure search input keeps focus while typing and filtering
  React.useEffect(() => {
    if (searchInputRef.current) {
        searchInputRef.current.focus();
    }
  });

  // ── Auto-select from target ──
  useEffect(() => {
    if (performanceTargetRequestId) {
      setSelectedRequestId(String(performanceTargetRequestId));
      setPerformanceTargetRequestId(null);
    }
  }, [performanceTargetRequestId, setPerformanceTargetRequestId]);

  // ── Timer for progress bar ──
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (performanceRunning) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [performanceRunning]);

  const filteredCollections = useMemo(() => {
    return collections.map(c => ({
      ...c,
      requests: requests.filter(r => r.collectionId === c.id && (
        !requestSearch.trim() ||
        r.name.toLowerCase().includes(requestSearch.toLowerCase()) ||
        r.url.toLowerCase().includes(requestSearch.toLowerCase())
      ))
    })).filter(c => c.requests.length > 0);
  }, [collections, requests, requestSearch]);

  const selectedRequest = useMemo(
    () => requests.find(r => String(r.id) === String(selectedRequestId)),
    [requests, selectedRequestId]
  );

  // ── IPC progress listener ──
  useEffect(() => {
    const unsub = window.electronAPI.performance.onProgress((data: PerformanceResult) => {
      // logger.debug('Perf progress received', data); // Silent debug
      addPerformanceProgress(data);
    });
    return () => unsub();
  }, [addPerformanceProgress]);

  const handleStart = useCallback(async () => {
    if (!selectedRequest) {
      setError('Please select a target request');
      return;
    }
    setError(null);
    clearPerformanceData();
    setPerformanceRunning(true);

    try {
      const result = await window.electronAPI.performance.run({
        url: selectedRequest.url,
        method: selectedRequest.method,
        headers: selectedRequest.headers || {},
        body: selectedRequest.body || '',
        connections,
        pipelining,
        duration,
        environmentId: currentEnvironment?.id,
        collectionId: selectedRequest.collectionId,
      });
      if (result.success) {
        setPerformanceReport(result.result as PerformanceReport);
      } else {
        setError(result.error || 'Diagnostic: Runner instance crashed');
      }
    } catch (err: any) {
      setError(err.message || 'System fault');
      logger.error('Perf test fail', { error: err });
    } finally {
      setPerformanceRunning(false);
    }
  }, [selectedRequest, connections, pipelining, duration, currentEnvironment, clearPerformanceData, setPerformanceRunning, setPerformanceReport]);

  const handleStop = useCallback(async () => {
    await window.electronAPI.performance.stop();
    setPerformanceRunning(false);
  }, [setPerformanceRunning]);

  // ── Live stats ──
  const liveStats = useMemo(() => {
    if (performanceProgress.length === 0)
      return { rps: 0, latency: 0, throughput: 0, errors: 0, timeouts: 0, statusCodes: {} as Record<number, number> };
    
    // We want to show the current rate of change for some stats
    const last = performanceProgress[performanceProgress.length - 1];
    // requests field now = RPS for the last second (set in the main process)
    return {
      rps: last.requests,
      latency: last.latency,
      throughput: last.throughput,
      errors: last.errors,
      timeouts: last.timeouts,
      statusCodes: last.statusCodes || {},
    };
  }, [performanceProgress]);

  // ── Chart mapping ──
  const chartData = useMemo(() => 
    performanceProgress.slice(-60).map((p, i) => ({
      tick: i,
      rps: p.requests,   // per-second RPS
      latency: p.latency,
      throughput: p.throughput / 1024, // bytes → KB
    })),
  [performanceProgress]);

  const latencyBars = useMemo(() => {
    if (!performanceReport) return [];
    const l = performanceReport.latency;
    return [
      { name: 'p50', value: l.p50, color: 'var(--primary)' },
      { name: 'p75', value: l.p75, color: '#6366f1' },
      { name: 'p90', value: l.p90, color: '#8b5cf6' },
      { name: 'p99', value: l.p99, color: '#d946ef' },
      { name: 'p99.9', value: l.p99_9, color: '#f43f5e' },
    ];
  }, [performanceReport]);

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto custom-scrollbar relative">
        {/* ── Background Aesthetics ── */}
        <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.08),transparent_60%)]" />
        
        <div className="flex flex-col max-w-7xl mx-auto w-full px-6 py-8 space-y-4">
          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage('home')}
                  className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Editor
                </Button>
                <Badge variant="outline" className="text-[9px] font-black tracking-widest px-2 py-0.5 border-indigo-500/30 text-indigo-500/80 uppercase">Benchmark Mode</Badge>
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-foreground drop-shadow-sm">Performance Benchmark</h1>
                <p className="text-sm text-muted-foreground font-medium mt-1">Industrial-strength pressure testing for your APIs</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {performanceRunning ? (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleStop}
                  className="h-12 px-8 rounded-2xl shadow-xl shadow-destructive/20 font-black uppercase text-xs tracking-widest border-2 border-white/5 active:scale-95 transition-all"
                >
                  <Square className="h-4 w-4 mr-2 fill-white animate-pulse" />
                  Terminate
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={!selectedRequestId}
                  className="h-12 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/25 font-black uppercase text-xs tracking-widest border-2 border-white/5 active:scale-95 transition-all"
                >
                  <Play className="h-4 w-4 mr-3 fill-white" />
                  Initialize Stress Test
                </Button>
              )}
            </div>
          </div>

          {/* ── Progress ── */}
          <LiveProgress elapsed={elapsedSeconds} total={duration} running={performanceRunning} />

          {/* ── Error Notification ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-destructive/10 border-2 border-destructive/20 flex items-center gap-4 shadow-lg mb-4"
              >
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive font-bold">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Dashboard Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Configuration Bar (Horizontal) */}
            <div className="col-span-12">
              <Card className="bg-card/30 backdrop-blur-3xl border-border/10 shadow-2xl rounded-[1.5rem] overflow-hidden">
                <CardContent className="p-4 flex flex-wrap lg:flex-nowrap items-center gap-6">
                  {/* Target Selection */}
                  <div className="flex-[2] min-w-[280px] space-y-1.5 pl-2">
                    <Label className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                      <Settings2 className="h-3 w-3" /> Target Endpoint
                    </Label>
                    <Select
                      value={String(selectedRequestId)}
                      onValueChange={setSelectedRequestId}
                    >
                      <SelectTrigger className="bg-background/40 border-border/10 h-10 rounded-xl text-xs font-bold shadow-sm hover:bg-background/60 transition-colors">
                        <SelectValue placeholder="Select Target" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[350px] rounded-2xl border-border/10 p-0 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-border/10 sticky top-0 bg-popover/95 backdrop-blur-sm z-10">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                            <Input 
                              ref={searchInputRef}
                              placeholder="Search endpoints..." 
                              className="pl-8 h-8 rounded-lg bg-background/50 border-border/10 text-xs focus-visible:ring-primary/20"
                              value={requestSearch}
                              onChange={e => setRequestSearch(e.target.value)}
                              onKeyDown={e => {
                                e.stopPropagation();
                                if (e.key === ' ') e.stopPropagation();
                              }}
                              onPointerDown={e => e.stopPropagation()}
                              onMouseDown={e => e.stopPropagation()}
                              onSelect={e => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-[250px] custom-scrollbar">
                          {(filteredCollections as any[]).map(c => (
                            <React.Fragment key={c.id}>
                              <div className="px-3 py-1.5 text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest bg-muted/5">{c.name}</div>
                              {c.requests.map((r: any) => (
                                <SelectItem key={r.id} value={String(r.id)} className="pl-6 text-xs font-semibold py-2 cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <span className={cn(
                                      'text-[8px] font-black w-8 shrink-0 px-1 py-0.5 rounded text-center ring-1 ring-inset',
                                      r.method === 'GET' ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/30' :
                                      r.method === 'POST' ? 'bg-blue-500/10 text-blue-500 ring-blue-500/30' :
                                      'bg-indigo-500/10 text-indigo-500 ring-indigo-500/30'
                                    )}>{r.method}</span>
                                    <span className="truncate opacity-80">{r.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </React.Fragment>
                          ))}
                          {filteredCollections.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground italic">No matches found</div>}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator orientation="vertical" className="h-10 hidden lg:block opacity-20" />

                  {/* Config Parameters Row */}
                  <div className="flex flex-1 items-center gap-4 min-w-[400px]">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                        Streams
                        <UiTooltip>
                          <TooltipTrigger asChild><Info className="h-2.5 w-2.5 opacity-30" /></TooltipTrigger>
                          <TooltipContent className="text-[10px] font-bold">Connections</TooltipContent>
                        </UiTooltip>
                      </Label>
                      <Input
                        type="number"
                        value={connections}
                        onChange={e => setConnections(Number(e.target.value))}
                        className="bg-background/40 border-border/10 h-10 rounded-xl font-mono text-center font-bold shadow-sm"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                         Pipelining
                      </Label>
                      <Input
                        type="number"
                        value={pipelining}
                        onChange={e => setPipelining(Number(e.target.value))}
                        className="bg-background/40 border-border/10 h-10 rounded-xl font-mono text-center font-bold shadow-sm"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                        Duration (s)
                      </Label>
                      <Input
                        type="number"
                        value={duration}
                        onChange={e => setDuration(Number(e.target.value))}
                        className="bg-background/40 border-border/10 h-10 rounded-xl font-mono text-center font-bold shadow-sm"
                      />
                    </div>
                  </div>

                  <Separator orientation="vertical" className="h-10 hidden xl:block opacity-20" />

                  {/* Context/Env */}
                  <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 min-w-[180px]">
                    <Globe className="h-3 w-3 text-indigo-500/60" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] text-muted-foreground/60 font-black uppercase tracking-widest">Context</span>
                      <span className="text-[11px] font-black truncate max-w-[120px] opacity-80">{currentEnvironment?.name || 'Local'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats & Charts Area (Full Width) */}
            <div className="col-span-12 flex flex-col gap-6">
              
              {/* Live Monitoring Row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  icon={<Zap />}
                  label="Req / sec"
                  value={formatNumber(liveStats.rps)}
                  color="text-indigo-500"
                  pulse={performanceRunning}
                />
                <StatCard
                  icon={<Timer />}
                  label="Latency"
                  value={formatDuration(liveStats.latency)}
                  color="text-primary"
                  pulse={performanceRunning}
                />
                <StatCard
                  icon={<Wifi />}
                  label="Bandwidth"
                  value={formatBytes(liveStats.throughput) + '/s'}
                  color="text-sky-500"
                  pulse={performanceRunning}
                />
                <StatCard
                  icon={<XCircle />}
                  label="Errors"
                  value={String(liveStats.errors)}
                  color={liveStats.errors > 0 ? 'text-rose-500' : 'text-muted-foreground/30'}
                />
                <StatCard
                  icon={<Clock />}
                  label="Timeouts"
                  value={String(liveStats.timeouts)}
                  color={liveStats.timeouts > 0 ? 'text-amber-500' : 'text-muted-foreground/30'}
                />
              </div>

              {/* Performance Timeline */}
              <Card className="bg-card/40 backdrop-blur-2xl border-border/10 shadow-2xl rounded-[2.5rem] overflow-hidden flex-1 flex flex-col min-h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between px-8 py-6">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-500" />
                      Stream Timeline
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-muted-foreground/60">
                      Real-time traffic telemetry and system pressure
                    </CardDescription>
                  </div>
                  {performanceRunning && (
                    <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/30 animate-pulse text-[9px] font-black tracking-widest uppercase">
                      Telemetric Stream Active
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex-1 p-0 px-6 pb-8 min-h-0 relative">
                  <div className="h-full w-full min-h-[300px]">
                    {performanceRunning && chartData.length < 2 ? (
                      <ScanningAnimation />
                    ) : chartData.length === 0 ? (
                      <EmptyChartState />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                          <CartesianGrid
                            vertical={false}
                            stroke={chartBorder || '#e5e7eb'}
                            strokeDasharray="3 3"
                            opacity={0.3}
                          />
                          <XAxis hide dataKey="tick" />
                          <YAxis
                            yAxisId="rps"
                            orientation="left"
                            tick={{ fill: chartMuted || '#6b7280', fontSize: 9, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={v => formatNumber(v)}
                            width={40}
                            domain={[0, 'auto']}
                          />
                          <YAxis
                            yAxisId="latency"
                            orientation="right"
                            tick={{ fill: chartMuted || '#6b7280', fontSize: 9, fontWeight: 700 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={v => `${v}ms`}
                            width={45}
                            domain={[0, 'auto']}
                          />
                          <ChartTooltip
                            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                            content={<ChartTooltipContent />}
                          />
                          <defs>
                            <linearGradient id="rpsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area
                            yAxisId="rps"
                            isAnimationActive={false}
                            type="monotone"
                            dataKey="rps"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            fill="url(#rpsGrad)"
                            fillOpacity={1}
                            name="RPS"
                          />
                          <Line
                            yAxisId="latency"
                            isAnimationActive={false}
                            type="monotone"
                            dataKey="latency"
                            stroke="#a78bfa"
                            strokeWidth={2}
                            strokeDasharray="6 3"
                            dot={false}
                            name="Latency"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Post-Test Report Panel */}
              <AnimatePresence>
                {performanceReport && !performanceRunning && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="space-y-6 pb-12"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-6 w-1.5 bg-indigo-600 rounded-full" />
                      <h2 className="text-2xl font-black tracking-tight uppercase tracking-widest">Analytics Digest</h2>
                      <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 font-black text-[10px] px-3">{performanceReport.duration}s Sequence</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={<Hash />}
                        label="Total Requests"
                        value={formatNumber(performanceReport.requests.total)}
                        subtitle={`${formatNumber(performanceReport.requests.sent)} total streams`}
                      />
                      <StatCard
                        icon={<Zap />}
                        label="Avg Flux"
                        value={formatNumber(performanceReport.requests.average)}
                        subtitle={`Peak: ${formatNumber(performanceReport.requests.max)} RPS`}
                        color="text-indigo-500"
                      />
                      <StatCard
                        icon={<Server />}
                        label="Data Out"
                        value={formatBytes(performanceReport.throughput.total)}
                        subtitle={`Peak: ${formatBytes(performanceReport.throughput.max)}/s`}
                        color="text-sky-500"
                      />
                      <StatCard
                        icon={<Timer />}
                        label="Avg Latency"
                        value={formatDuration(performanceReport.latency.average)}
                        subtitle={`p50: ${formatDuration(performanceReport.latency.p50)}`}
                        color="text-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                      {/* Percentile Distribution */}
                      <Card className="bg-card/40 border-border/10 rounded-[2rem] overflow-hidden flex flex-col">
                        <CardHeader className="pb-2 pt-8 px-8">
                          <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex gap-2">
                            <Gauge className="h-4 w-4" /> Percentile Matrix
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-8 h-[250px] flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={latencyBars}>
                              <CartesianGrid vertical={false} stroke={chartBorder} opacity={0.1} />
                              <XAxis
                                dataKey="name"
                                stroke={chartMuted}
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                padding={{ left: 20, right: 20 }}
                                tick={{ fill: chartMuted, fontSize: 10, fontWeight: 700 }}
                              />
                              <YAxis
                                stroke={chartMuted}
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={v => `${v}ms`}
                                tick={{ fill: chartMuted, fontSize: 9, fontWeight: 700 }}
                              />
                              <Bar dataKey="value" radius={[12, 12, 4, 4]} barSize={40}>
                                {latencyBars.map((entry, idx) => (
                                  <Cell key={idx} fill={entry.color} fillOpacity={0.8} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Response Matrix (Status Codes) */}
                      <Card className="bg-card/40 border-border/10 rounded-[2rem] overflow-hidden flex flex-col">
                        <CardHeader className="pb-4 px-8 pt-8">
                          <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex gap-2">
                            <Hash className="h-4 w-4" /> Response Matrix
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 flex-1 overflow-y-auto">
                          <div className="space-y-4">
                            {performanceReport.statusCodes && Object.keys(performanceReport.statusCodes).length > 0 ? (
                               Object.entries(performanceReport.statusCodes)
                                 .sort((a, b) => Number(a[0]) - Number(b[0]))
                                 .map(([code, count]) => (
                                   <div key={code} className="flex items-center justify-between group py-1 border-b border-border/5 last:border-0 hover:bg-muted/5 transition-colors px-2 -mx-2 rounded-lg">
                                     <div className="flex items-center gap-3">
                                       <Badge 
                                         className={cn(
                                           "px-2 py-0.5 font-black font-mono text-[10px] rounded-md",
                                           code.startsWith('2') ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                           code.startsWith('3') ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                           code.startsWith('4') ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                           "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                         )}
                                       >
                                         {code}
                                       </Badge>
                                       <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                         {Number(code) >= 500 ? 'Server Err' : Number(code) >= 400 ? 'Client Err' : Number(code) >= 300 ? 'Redirect' : 'Success'}
                                       </span>
                                     </div>
                                     <div className="flex items-center gap-4">
                                       <div className="flex flex-col items-end">
                                         <span className="text-xs font-black tabular-nums">{formatNumber(count as number)}</span>
                                         <span className="text-[9px] font-bold text-muted-foreground/30">
                                           {((Number(count) / performanceReport.requests.total) * 100).toFixed(1)}%
                                         </span>
                                       </div>
                                     </div>
                                   </div>
                                 ))
                            ) : (
                               <div className="flex flex-col items-center justify-center py-12 opacity-40">
                                  <Terminal className="h-8 w-8 mb-2" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">No Telemetry</span>
                               </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PerformancePage;
export { PerformancePage as Performance };
