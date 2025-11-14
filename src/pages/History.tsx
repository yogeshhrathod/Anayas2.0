import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Trash2, Search, Filter, Clock, CheckCircle2, XCircle, Play, Eye } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

export function History() {
  const { requestHistory, setRequestHistory, currentEnvironment } = useStore();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rerunningRequest, setRerunningRequest] = useState<number | null>(null);

  const filteredHistory = requestHistory.filter((request: any) => {
    const matchesSearch = request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'success' && request.status === 200) ||
                         (filterStatus === 'error' && request.status !== 200);
    const matchesMethod = filterMethod === 'all' || request.method.toLowerCase() === filterMethod.toLowerCase();
    
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
    
    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this request from history?')) return;

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
      const result = await window.electronAPI.request.send({
        method: request.method,
        url: request.url,
        headers: typeof request.headers === 'string' 
          ? JSON.parse(request.headers) 
          : (request.headers || {}),
        body: typeof request.response_body === 'string' 
          ? JSON.parse(request.response_body) 
          : request.response_body,
        environmentId: currentEnvironment?.id
      });

      if (result.success) {
        const updatedHistory = await window.electronAPI.request.history(100);
        setRequestHistory(updatedHistory);
        success('Request Rerun', `Request completed in ${result.responseTime}ms`);
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
    setSelectedRequest(request);
    setShowDetails(true);
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

      {/* Filters */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Search and filter your request history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by URL or method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                {getUniqueMethods().map((method) => (
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
                  {filteredHistory.length} of {requestHistory.length} requests
                </CardDescription>
              </div>
            </div>
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
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((request: any) => (
                <div key={request.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {request.method}
                        </Badge>
                        {getStatusBadge(request.status)}
                        <span className="text-sm text-muted-foreground">
                          {request.responseTime}ms
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-1 break-all">{request.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                        className="hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRerun(request)}
                        disabled={rerunningRequest === request.id}
                        className="hover:bg-green-50 dark:hover:bg-green-950"
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
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-dialog">
          <Card className="w-4/5 max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm font-mono">
                      {selectedRequest.method}
                    </Badge>
                    {getStatusBadge(selectedRequest.status)}
                    <span className="text-sm text-muted-foreground">
                      {selectedRequest.responseTime}ms
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-2 break-all">
                    {selectedRequest.url}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Headers</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto">
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
                
                <div>
                  <h4 className="font-semibold mb-2">Response Body</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-96">
                    {selectedRequest.response_body || 'No response body'}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Request Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span> {selectedRequest.status}
                    </div>
                    <div>
                      <span className="font-medium">Response Time:</span> {selectedRequest.responseTime}ms
                    </div>
                    <div>
                      <span className="font-medium">Method:</span> {selectedRequest.method}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {new Date(selectedRequest.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}