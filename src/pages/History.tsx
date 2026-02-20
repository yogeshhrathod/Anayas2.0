import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Filter,
  Group,
  Play,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useToast } from '../components/ui/use-toast';
import { useStore } from '../store/useStore';
import { EntityId, Request } from '../types/entities';

export function History() {
  const {
    requestHistory,
    setRequestHistory,
    currentEnvironment,
    setSelectedRequest,
    setCurrentPage,
    historyFilter,
    setHistoryFilter,
  } = useStore();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [groupByRequest, setGroupByRequest] = useState(false);
  const [selectedRequest, setSelectedRequestDetail] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<
    'request' | 'response' | 'headers'
  >('request');
  const [rerunningRequest, setRerunningRequest] = useState<EntityId | null>(
    null
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearAllFilters = () => {
    setHistoryFilter(null);
    setSearchTerm('');
    setFilterStatus('all');
    setFilterMethod('all');
    setFilterDate('all');
    setGroupByRequest(false);
    success('Filters cleared', 'Showing all request history');
  };

  // Load history on mount and when navigating to this page
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await window.electronAPI.request.history(100);
        setRequestHistory(history);
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };

    loadHistory();
  }, [setRequestHistory]);

  // Listen for history updates
  useEffect(() => {
    const api: any = window.electronAPI;
    if (
      !api ||
      !api.request ||
      typeof api.request.onHistoryUpdated !== 'function'
    ) {
      return;
    }

    const handleHistoryUpdated = async () => {
      try {
        const history = await window.electronAPI.request.history(100);
        setRequestHistory(history);
      } catch (error) {
        console.error('Failed to refresh history:', error);
      }
    };

    const unsubscribe = api.request.onHistoryUpdated(handleHistoryUpdated);
    return () => {
      unsubscribe?.();
    };
  }, [setRequestHistory]);

  // Apply history filter if set (from "Show History" button)
  useEffect(() => {
    if (historyFilter) {
      if (historyFilter.requestId) {
        // For saved requests, filter by requestId
        setSearchTerm('');
        setFilterMethod('all');
      } else if (historyFilter.method && historyFilter.url) {
        // For unsaved requests, filter by method and URL
        // We don't set searchTerm here anymore as it interferes with matchesHistoryFilter
        setSearchTerm('');
        setFilterMethod(historyFilter.method);
      }

      // Auto-enable grouping for a cleaner view when looking at request history
      setGroupByRequest(true);
    }
  }, [historyFilter]);

  const filteredHistory = requestHistory.filter((request: any) => {
    // Apply history filter first (if set)
    let matchesHistoryFilter = true;
    if (historyFilter) {
      if (historyFilter.requestId) {
        // Use loose equality to handle string vs number comparison
        matchesHistoryFilter =
          String(request.requestId) === String(historyFilter.requestId);
      } else if (historyFilter.method && historyFilter.url) {
        // Normalization for better matching
        const normalizeUrl = (u: string) =>
          u.trim().replace(/\/+$/, '').toLowerCase();

        matchesHistoryFilter =
          request.method.toLowerCase() === historyFilter.method.toLowerCase() &&
          (normalizeUrl(request.url).includes(
            normalizeUrl(historyFilter.url)
          ) ||
            normalizeUrl(historyFilter.url).includes(
              normalizeUrl(request.url)
            ));
      }
    }

    const matchesSearch =
      request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'success' && request.status === 200) ||
      (filterStatus === 'error' && request.status !== 200);
    const matchesMethod =
      filterMethod === 'all' ||
      request.method.toLowerCase() === filterMethod.toLowerCase();

    // Date filtering
    let matchesDate = true;
    if (filterDate !== 'all') {
      const requestDate = new Date(request.createdAt);
      const now = new Date();

      switch (filterDate) {
        case 'today':
          matchesDate = requestDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = requestDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = requestDate >= monthAgo;
          break;
      }
    }

    return (
      matchesHistoryFilter &&
      matchesSearch &&
      matchesStatus &&
      matchesMethod &&
      matchesDate
    );
  });

  // Group history by request (saved or unsaved)
  const groupedHistory = useMemo(() => {
    if (!groupByRequest) {
      return { ungrouped: filteredHistory };
    }

    const groups: Record<string, any[]> = {};

    filteredHistory.forEach((item: any) => {
      // Group by requestId if available (saved request)
      // Otherwise group by URL + method (unsaved requests)
      const key = item.requestId
        ? `saved-${item.requestId}`
        : `unsaved-${item.method}-${item.url}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    // Sort groups by most recent
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
    });

    return groups;
  }, [filteredHistory, groupByRequest]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this request from history?'))
      return;

    try {
      await window.electronAPI.request.deleteHistory(id);
      const updatedHistory = await window.electronAPI.request.history(100);
      setRequestHistory(updatedHistory);
      success('Request deleted', 'The request has been removed from history');
    } catch (e: any) {
      console.error('Failed to delete request:', e);
      error('Delete failed', 'Could not delete request from history');
    }
  };

  const handleRerun = async (request: any) => {
    setRerunningRequest(request.id);
    try {
      const headers =
        typeof request.headers === 'string'
          ? JSON.parse(request.headers)
          : request.headers || {};

      const body = request.requestBody
        ? typeof request.requestBody === 'string'
          ? request.requestBody
          : JSON.stringify(request.requestBody)
        : '';

      const result = await window.electronAPI.request.send({
        method: request.method,
        url: request.url,
        headers,
        body,
        queryParams: request.queryParams || [],
        auth: request.auth || { type: 'none' },
        requestId: request.requestId,
        collectionId: request.collectionId,
        environmentId: currentEnvironment?.id,
      });

      if (result.success) {
        const updatedHistory = await window.electronAPI.request.history(100);
        setRequestHistory(updatedHistory);
        success(
          'Request Rerun',
          `Request completed in ${result.responseTime}ms`
        );
      } else {
        error('Rerun Failed', result.error || 'Request failed');
      }
    } catch (e: any) {
      console.error('Failed to rerun request:', e);
      error('Rerun Error', e?.message || 'Unknown error');
    } finally {
      setRerunningRequest(null);
    }
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequestDetail(request);
    setShowDetails(true);
    setActiveDetailTab('request');
  };

  const handleRedirectToRequest = async (request: any) => {
    try {
      // If requestId exists, try to load the saved request
      if (request.requestId) {
        const savedRequest = await window.electronAPI.request.get(
          request.requestId
        );
        if (savedRequest) {
          setSelectedRequest(savedRequest as Request);
          setCurrentPage('home');
          success('Request loaded', 'Redirected to original request');
          return;
        }
      }

      // Otherwise, reconstruct from history data
      const reconstructedRequest: Request = {
        id: undefined,
        name: request.requestId ? 'Request from History' : 'Unsaved Request',
        method: request.method as Request['method'],
        url: request.url,
        headers:
          typeof request.headers === 'string'
            ? JSON.parse(request.headers)
            : request.headers || {},
        body: request.requestBody || '',
        queryParams: request.queryParams || [],
        auth: request.auth || { type: 'none' },
        collectionId: request.collectionId,
        folderId: undefined,
        isFavorite: 0,
      };

      setSelectedRequest(reconstructedRequest);
      setCurrentPage('home');
      success('Request loaded', 'Request reconstructed from history');
    } catch (e: any) {
      console.error('Failed to redirect to request:', e);
      error('Redirect failed', e?.message || 'Could not load request');
    }
  };

  const handleCopyCurl = async (request: any) => {
    try {
      const headers =
        typeof request.headers === 'string'
          ? JSON.parse(request.headers)
          : request.headers || {};

      const body = request.requestBody
        ? typeof request.requestBody === 'string'
          ? request.requestBody
          : JSON.stringify(request.requestBody)
        : '';

      const result = await window.electronAPI.curl.generate({
        name: request.requestName || 'Request from History',
        method: request.method,
        url: request.url,
        headers,
        body,
        queryParams: request.queryParams || [],
        auth: request.auth || { type: 'none' },
        collectionId: request.collectionId,
      } as Request);

      if (result.success && result.command) {
        await navigator.clipboard.writeText(result.command);
        success('Copied', 'cURL command copied to clipboard');
      } else {
        error('Failed to generate cURL', result.error || 'Unknown error');
      }
    } catch (e: any) {
      console.error('Failed to copy cURL:', e);
      error('Copy failed', e?.message || 'Could not copy cURL command');
    }
  };

  const handleCopyRequestData = async (request: any) => {
    try {
      const headers =
        typeof request.headers === 'string'
          ? JSON.parse(request.headers)
          : request.headers || {};

      const requestData = {
        method: request.method,
        url: request.url,
        headers,
        body: request.requestBody || '',
        queryParams: request.queryParams || [],
        auth: request.auth || { type: 'none' },
      };

      await navigator.clipboard.writeText(JSON.stringify(requestData, null, 2));
      success('Copied', 'Request data copied to clipboard');
    } catch (e: any) {
      console.error('Failed to copy request data:', e);
      error('Copy failed', e?.message || 'Could not copy request data');
    }
  };

  const handleCopyResponse = async (request: any) => {
    try {
      const responseBody = request.response_body || '';
      await navigator.clipboard.writeText(responseBody);
      success('Copied', 'Response body copied to clipboard');
    } catch (e: any) {
      console.error('Failed to copy response:', e);
      error('Copy failed', e?.message || 'Could not copy response');
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await window.electronAPI.request.clearAllHistory();
      const updatedHistory = await window.electronAPI.request.history(100);
      setRequestHistory(updatedHistory);
      setShowClearConfirm(false);
      success('History cleared', 'All request history has been deleted');
    } catch (e: any) {
      console.error('Failed to clear history:', e);
      error('Clear failed', e?.message || 'Could not clear history');
    }
  };

  const getUniqueMethods = () => {
    const methods = new Set(requestHistory.map((r: any) => r.method));
    return Array.from(methods).sort();
  };

  const getStatusBadge = (status: number) => {
    if (status === 200) {
      return (
        <Badge variant="success" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Success
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
  };

  const renderHistoryItem = (request: any) => (
    <div
      key={request.id}
      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {request.requestName && (
            <h3 className="font-semibold text-base mb-2 text-foreground">
              {request.requestName}
            </h3>
          )}
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-xs font-mono">
              {request.method}
            </Badge>
            {getStatusBadge(request.status)}
            <span className="text-sm text-muted-foreground">
              {request.responseTime}ms
            </span>
            {request.requestId && (
              <Badge variant="secondary" className="text-xs">
                Saved
              </Badge>
            )}
          </div>
          <p
            className={`text-sm mb-1 break-all ${request.requestName ? 'text-muted-foreground' : 'font-medium'}`}
          >
            {request.url}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(request.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRedirectToRequest(request)}
            className="hover:bg-blue-50 dark:hover:bg-blue-950"
            title="Go to original request"
          >
            <ArrowRight className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyCurl(request)}
            className="hover:bg-purple-50 dark:hover:bg-purple-950"
            title="Copy as cURL"
          >
            <Copy className="h-4 w-4 text-purple-500" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(request)}
            className="hover:bg-blue-50 dark:hover:bg-blue-950"
            title="View details"
          >
            <Eye className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRerun(request)}
            disabled={rerunningRequest === request.id}
            className="hover:bg-green-50 dark:hover:bg-green-950"
            title="Rerun request"
          >
            {rerunningRequest === request.id ? (
              <Clock className="h-4 w-4 animate-spin text-green-500" />
            ) : (
              <Play className="h-4 w-4 text-green-500" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(request.id)}
            className="hover:bg-red-50 dark:hover:bg-red-950"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Request History
          </h1>
          <p className="mt-2 text-muted-foreground">
            View and manage your API request history
          </p>
        </div>
      </div>

      {/* Active Filter Banner */}
      {historyFilter && (
        <div className="bg-muted/40 border border-border/50 rounded-xl p-3 px-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-background p-2 rounded-full border border-border/50 shadow-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Active Filter
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="text-xs text-muted-foreground font-mono">
                  {historyFilter.requestId
                    ? `ID: ${historyFilter.requestId}`
                    : `${historyFilter.method} ${historyFilter.url}`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                {historyFilter.requestId
                  ? `Showing results for: ${filteredHistory[0]?.requestName || 'Saved Request'}`
                  : `Showing results for specific URL matches`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 text-xs gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
            >
              <XCircle className="h-3.5 w-3.5" />
              Clear All
            </Button>
            <div className="w-px h-4 bg-border/50 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('home')}
              className="h-8 text-xs gap-2 hover:bg-primary/10 hover:text-primary transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Search and filter your request history
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by URL or method..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="success">Successful (200)</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {getUniqueMethods().map(method => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={groupByRequest ? 'default' : 'outline'}
              onClick={() => setGroupByRequest(!groupByRequest)}
              className="flex items-center gap-2"
            >
              <Group className="h-4 w-4" />
              {groupByRequest ? 'Ungroup' : 'Group by Request'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Request History</CardTitle>
                <CardDescription>
                  {historyFilter ? (
                    <>
                      Showing history for this request ({filteredHistory.length}{' '}
                      of {requestHistory.length} total)
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHistoryFilter(null)}
                        className="ml-2 h-6 text-xs"
                      >
                        Clear Filter
                      </Button>
                    </>
                  ) : (
                    `${filteredHistory.length} of ${requestHistory.length} requests`
                  )}
                </CardDescription>
              </div>
            </div>
            {requestHistory.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {requestHistory.length === 0
                  ? "You haven't made any requests yet. Start by sending your first API request."
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
          ) : groupByRequest ? (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([key, items]) => (
                <div key={key} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      {key.startsWith('saved-')
                        ? items[0].requestName
                          ? `${items[0].requestName} (${items.length} execution${items.length > 1 ? 's' : ''})`
                          : `Saved Request (${items.length} execution${items.length > 1 ? 's' : ''})`
                        : `Unsaved Request: ${items[0].method} ${items[0].url.substring(0, 50)}${items[0].url.length > 50 ? '...' : ''} (${items.length} execution${items.length > 1 ? 's' : ''})`}
                    </h3>
                  </div>
                  {items.map((item: any) => renderHistoryItem(item))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((request: any) =>
                renderHistoryItem(request)
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      {selectedRequest && (
        <Dialog
          open={showDetails}
          onOpenChange={setShowDetails}
          title={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm font-mono">
                {selectedRequest.method}
              </Badge>
              {getStatusBadge(selectedRequest.status)}
              <span className="text-sm text-muted-foreground">
                {selectedRequest.responseTime}ms
              </span>
            </div>
          }
          description={selectedRequest.url}
          maxWidth="4xl"
          className="w-[90vw] max-h-[85vh]"
        >
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b">
              <button
                onClick={() => setActiveDetailTab('request')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeDetailTab === 'request'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Request
              </button>
              <button
                onClick={() => setActiveDetailTab('headers')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeDetailTab === 'headers'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Headers
              </button>
              <button
                onClick={() => setActiveDetailTab('response')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeDetailTab === 'response'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Response
              </button>
            </div>

            {/* Tab Content */}
            <div className="max-h-[60vh] overflow-auto">
              {activeDetailTab === 'request' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Request Data</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCurl(selectedRequest)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy cURL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyRequestData(selectedRequest)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Request Data
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Method:</span>
                      <Badge variant="outline" className="ml-2 font-mono">
                        {selectedRequest.method}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium">URL:</span>
                      <pre className="mt-1 bg-muted p-3 rounded text-xs break-all overflow-auto">
                        {selectedRequest.url}
                      </pre>
                    </div>
                    {selectedRequest.requestBody && (
                      <div>
                        <span className="text-sm font-medium">Body:</span>
                        <pre className="mt-1 bg-muted p-3 rounded text-xs overflow-auto max-h-96">
                          {typeof selectedRequest.requestBody === 'string'
                            ? selectedRequest.requestBody
                            : JSON.stringify(
                                selectedRequest.requestBody,
                                null,
                                2
                              )}
                        </pre>
                      </div>
                    )}
                    {selectedRequest.queryParams &&
                      selectedRequest.queryParams.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">
                            Query Parameters:
                          </span>
                          <pre className="mt-1 bg-muted p-3 rounded text-xs overflow-auto">
                            {JSON.stringify(
                              selectedRequest.queryParams,
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      )}
                    {selectedRequest.auth &&
                      selectedRequest.auth.type !== 'none' && (
                        <div>
                          <span className="text-sm font-medium">
                            Authentication:
                          </span>
                          <pre className="mt-1 bg-muted p-3 rounded text-xs overflow-auto">
                            {JSON.stringify(selectedRequest.auth, null, 2)}
                          </pre>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'headers' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Request Headers</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const headers =
                          typeof selectedRequest.headers === 'string'
                            ? JSON.parse(selectedRequest.headers)
                            : selectedRequest.headers || {};
                        navigator.clipboard.writeText(
                          JSON.stringify(headers, null, 2)
                        );
                        success('Copied', 'Headers copied to clipboard');
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Headers
                    </Button>
                  </div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[50vh]">
                    {selectedRequest.headers
                      ? JSON.stringify(
                          typeof selectedRequest.headers === 'string'
                            ? JSON.parse(selectedRequest.headers)
                            : selectedRequest.headers,
                          null,
                          2
                        )
                      : 'No headers'}
                  </pre>
                </div>
              )}

              {activeDetailTab === 'response' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Response Body</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyResponse(selectedRequest)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Response
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        {selectedRequest.status}
                      </div>
                      <div>
                        <span className="font-medium">Response Time:</span>{' '}
                        {selectedRequest.responseTime}ms
                      </div>
                      <div>
                        <span className="font-medium">Method:</span>{' '}
                        {selectedRequest.method}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(selectedRequest.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[50vh] whitespace-pre-wrap break-words">
                      {selectedRequest.response_body || 'No response body'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {/* Clear All History Confirmation Dialog */}
      <Dialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear All History"
        description="This action cannot be undone"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive mb-1">
                Warning: Destructive Action
              </h4>
              <p className="text-sm text-muted-foreground">
                You are about to delete all {requestHistory.length} request
                history entries. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded text-sm">
            <p className="font-medium mb-1">This will permanently delete:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>All request execution history</li>
              <li>All response data</li>
              <li>All request metadata</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllHistory}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All History
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
