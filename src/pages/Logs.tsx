import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Trash2, Download, RefreshCw } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  module?: string;
  [key: string]: any;
}

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { success, error } = useToast();

  const loadLogs = async () => {
    try {
      const logsPath = await window.electronAPI.app.getPath('userData');
      const combinedLogPath = `${logsPath}/logs/combined.log`;
      const result = await window.electronAPI.file.readFile(combinedLogPath);
      
      if (result.success) {
        const lines = result.content.split('\n').filter((line: string) => line.trim());
        
        // OPTIMIZATION: Only load last 1000 lines to prevent memory issues
        const recentLines = lines.slice(-1000);
        
        const parsedLogs = recentLines.map((line: string) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean) as LogEntry[];
        
        setLogs(parsedLogs.reverse()); // Most recent first
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  useEffect(() => {
    loadLogs();
    
    if (autoRefresh) {
      // OPTIMIZATION: Increased interval from 2s to 5s to reduce I/O
      const interval = setInterval(loadLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Filter by module
    if (moduleFilter !== 'all') {
      filtered = filtered.filter(log => log.module === moduleFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, moduleFilter]);

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs?')) return;
    
    try {
      const logsPath = await window.electronAPI.app.getPath('userData');
      const combinedLogPath = `${logsPath}/logs/combined.log`;
      await window.electronAPI.file.writeFile(combinedLogPath, '');
      setLogs([]);
      setFilteredLogs([]);
      success('Logs cleared', 'All logs have been cleared');
    } catch (e: any) {
      console.error('Failed to clear logs:', e);
      error('Clear failed', 'Failed to clear logs. Please try again.');
    }
  };

  const exportLogs = async () => {
    try {
      const content = filteredLogs.map(log => JSON.stringify(log)).join('\n');
      await window.electronAPI.file.saveFile('logs-export.log', content);
      success('Logs exported', 'Filtered logs exported to logs-export.log');
    } catch (e: any) {
      console.error('Failed to export logs:', e);
      error('Export failed', 'Could not export logs');
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400';
    }
  };

  const uniqueModules = Array.from(new Set(logs.map(log => log.module).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Application Logs</h1>
        <p className="mt-2 text-muted-foreground">
          View detailed logs of all API requests and application events
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="all">All Modules</option>
              {uniqueModules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-primary text-primary-foreground' : ''}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={loadLogs}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(l => l.level === 'error').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredLogs.filter(l => l.level === 'warn').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredLogs.filter(l => l.message?.includes('API Request')).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No logs found
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-auto">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className="rounded-md border p-3 text-sm font-mono hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${getLogLevelColor(
                            log.level
                          )}`}
                        >
                          {log.level}
                        </span>
                        {log.module && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800">
                            {log.module}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-foreground">{log.message}</div>
                      {Object.keys(log).filter(
                        key => !['timestamp', 'level', 'message', 'module'].includes(key)
                      ).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            Show details
                          </summary>
                          <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                            {JSON.stringify(
                              Object.fromEntries(
                                Object.entries(log).filter(
                                  ([key]) => !['timestamp', 'level', 'message', 'module'].includes(key)
                                )
                              ),
                              null,
                              2
                            )}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
