import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Trash2, Search, Filter, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

export function History() {
  const { requestHistory, setRequestHistory } = useStore();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredHistory = requestHistory.filter((request: any) => {
    const matchesSearch = request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'success' && request.status === 200) ||
                         (filterStatus === 'error' && request.status !== 200);
    return matchesSearch && matchesStatus;
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
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by URL or method..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="success">Successful (200)</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
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
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
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
    </div>
  );
}