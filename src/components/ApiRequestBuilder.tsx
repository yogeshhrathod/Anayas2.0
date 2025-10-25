import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Send, Loader2, Clock, Copy, Download, Save } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { MonacoEditor } from './ui/monaco-editor';
import { MonacoKeyValueEditor } from './ui/monaco-key-value-editor';

interface RequestData {
  id?: number;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  body: string;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  collectionId?: number;
  folderId?: number;
  isFavorite: boolean;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function ApiRequestBuilder() {
  const { currentEnvironment, collections, setRequestHistory, selectedRequest, selectedCollectionForNewRequest, setSelectedCollectionForNewRequest } = useStore();
  const { success, error } = useToast();
  
  const [requestData, setRequestData] = useState<RequestData>({
    name: '',
    method: 'GET',
    url: '',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '',
    queryParams: [],
    auth: {
      type: 'none'
    },
    collectionId: undefined,
    folderId: undefined,
    isFavorite: false,
  });
  
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [bodyContentType, setBodyContentType] = useState<'json' | 'xml' | 'text'>('json');

  // Load selected request when it changes
  useEffect(() => {
    if (selectedRequest) {
      setRequestData({
        id: selectedRequest.id,
        name: selectedRequest.name,
        method: selectedRequest.method as any,
        url: selectedRequest.url,
        headers: selectedRequest.headers,
        body: selectedRequest.body,
        queryParams: selectedRequest.queryParams,
        auth: selectedRequest.auth,
        collectionId: selectedRequest.collection_id,
        isFavorite: selectedRequest.is_favorite === 1,
      });
    } else {
      // Reset to default when no request is selected
      setRequestData({
        name: '',
        method: 'GET',
        url: '',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '',
        queryParams: [],
        auth: {
          type: 'none'
        },
        collectionId: selectedCollectionForNewRequest || undefined,
        isFavorite: false,
      });
    }
  }, [selectedRequest, selectedCollectionForNewRequest]);

  // Replace variables in URL and headers
  const replaceVariables = (text: string): string => {
    if (!currentEnvironment?.variables) return text;
    
    let result = text;
    Object.entries(currentEnvironment.variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const handleSendRequest = async () => {
    if (!requestData.url.trim()) {
      error('URL Required', 'Please enter a URL for the request');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      // Build URL with query parameters
      let processedUrl = replaceVariables(requestData.url);
      const enabledParams = requestData.queryParams.filter(p => p.enabled && p.key.trim());
      if (enabledParams.length > 0) {
        const urlObj = new URL(processedUrl);
        enabledParams.forEach(param => {
          urlObj.searchParams.append(param.key, replaceVariables(param.value));
        });
        processedUrl = urlObj.toString();
      }

      // Process headers
      const processedHeaders = Object.fromEntries(
        Object.entries(requestData.headers).map(([key, value]) => [
          key,
          replaceVariables(value)
        ])
      );

      // Add authentication headers
      if (requestData.auth.type === 'bearer' && requestData.auth.token) {
        processedHeaders['Authorization'] = `Bearer ${replaceVariables(requestData.auth.token)}`;
      } else if (requestData.auth.type === 'basic' && requestData.auth.username && requestData.auth.password) {
        const credentials = btoa(`${replaceVariables(requestData.auth.username)}:${replaceVariables(requestData.auth.password)}`);
        processedHeaders['Authorization'] = `Basic ${credentials}`;
      } else if (requestData.auth.type === 'apikey' && requestData.auth.apiKey && requestData.auth.apiKeyHeader) {
        processedHeaders[requestData.auth.apiKeyHeader] = replaceVariables(requestData.auth.apiKey);
      }

      const startTime = Date.now();
      
      const result = await window.electronAPI.request.send({
        method: requestData.method,
        url: processedUrl,
        headers: processedHeaders,
        body: requestData.body ? JSON.parse(requestData.body) : undefined
      });

      const responseTime = Date.now() - startTime;

      if (result.success) {
        setResponse({
          status: result.status || 200,
          statusText: result.statusText || 'OK',
          headers: result.headers || {},
          body: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2),
          responseTime: result.responseTime || responseTime
        });

        const updatedHistory = await window.electronAPI.request.history(100);
        setRequestHistory(updatedHistory);

        success('Request Sent', `Request completed in ${result.responseTime || responseTime}ms`);
      } else {
        setResponse({
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          body: result.error || 'Request failed',
          responseTime
        });
        error('Request Failed', result.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      const responseTime = Date.now() - Date.now();
      setResponse({
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        body: err.message || 'Request failed',
        responseTime
      });
      error('Request Error', err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRequest = async () => {
    if (!requestData.name.trim()) {
      error('Name Required', 'Please enter a name for the request');
      return;
    }

    try {
      const result = await window.electronAPI.request.save(requestData);
      if (result.success) {
        success('Request Saved', 'Request has been saved successfully');
        setShowSaveDialog(false);
        
        // Clear the selected collection for new requests after saving
        setSelectedCollectionForNewRequest(null);
      }
    } catch (e: any) {
      console.error('Failed to save request:', e);
      error('Save Failed', 'Failed to save request');
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response.body);
      success('Copied', 'Response copied to clipboard');
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400';
    if (status >= 500) return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400';
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Request Builder */}
        <div className="flex-1 flex flex-col">
          {/* URL Bar */}
          <div className="p-4 border-b bg-card">
            <div className="flex gap-2 flex-wrap">
              <Select value={requestData.method} onValueChange={(value: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS') => setRequestData({ ...requestData, method: value })}>
                <SelectTrigger className="w-24 sm:w-32 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={requestData.url}
                onChange={(e) => setRequestData({ ...requestData, url: e.target.value })}
                placeholder="https://api.example.com/users"
                className="flex-1 min-w-0 bg-background"
              />
              <Button variant="outline" onClick={() => setShowSaveDialog(true)} className="hidden sm:flex">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(true)} className="sm:hidden">
                <Save className="h-4 w-4" />
              </Button>
              <Button onClick={handleSendRequest} disabled={isLoading || !requestData.url.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-1">Send</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b bg-card">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('params')}
                className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'params' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Params
              </button>
              <button
                onClick={() => setActiveTab('headers')}
                className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'headers' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Headers
              </button>
              <button
                onClick={() => setActiveTab('body')}
                className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'body' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Body
              </button>
              <button
                onClick={() => setActiveTab('auth')}
                className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'auth' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Auth
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 bg-background">
            {activeTab === 'params' && (
              <MonacoKeyValueEditor
                data={requestData.queryParams.map(param => ({
                  key: param.key,
                  value: param.value,
                  enabled: param.enabled
                }))}
                onChange={(data) => setRequestData({
                  ...requestData,
                  queryParams: data.map(item => ({
                    key: item.key,
                    value: item.value,
                    enabled: item.enabled !== false
                  }))
                })}
                title="Query Parameters"
                description="Add query parameters to your request"
                height={300}
                showActions={true}
                readOnly={false}
                minimap={false}
                fontSize={14}
                keyPlaceholder="Parameter name"
                valuePlaceholder="Parameter value"
                allowBulkEdit={true}
                className="border-0 shadow-none"
              />
            )}

            {activeTab === 'headers' && (
              <MonacoKeyValueEditor
                data={Object.entries(requestData.headers).map(([key, value]) => ({
                  key,
                  value,
                  enabled: true
                }))}
                onChange={(data) => {
                  const newHeaders = data.reduce((acc, item) => {
                    if (item.key && item.value) {
                      acc[item.key] = item.value;
                    }
                    return acc;
                  }, {} as Record<string, string>);
                  setRequestData({
                    ...requestData,
                    headers: newHeaders
                  });
                }}
                title="Headers"
                description="Add HTTP headers to your request"
                height={300}
                showActions={true}
                readOnly={false}
                minimap={false}
                fontSize={14}
                keyPlaceholder="Header name"
                valuePlaceholder="Header value"
                allowBulkEdit={true}
                className="border-0 shadow-none"
              />
            )}

            {activeTab === 'body' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">Body</span>
                  <Select defaultValue="raw">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw">Raw</SelectItem>
                      <SelectItem value="form-data">Form Data</SelectItem>
                      <SelectItem value="x-www-form">x-www-form-urlencoded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={bodyContentType} onValueChange={(value: 'json' | 'xml' | 'text') => setBodyContentType(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <MonacoEditor
                  value={requestData.body}
                  onChange={(value) => setRequestData({ ...requestData, body: value })}
                  language={bodyContentType}
                  placeholder={bodyContentType === 'json' ? '{"key": "value"}' : bodyContentType === 'xml' ? '<root></root>' : 'Enter text content...'}
                  title=""
                  description=""
                  height={300}
                  showActions={true}
                  validateJson={bodyContentType === 'json'}
                  readOnly={false}
                  minimap={false}
                  fontSize={14}
                  className="border rounded-md"
                />
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">Type</span>
                  <Select 
                    value={requestData.auth.type} 
                    onValueChange={(value: 'none' | 'bearer' | 'basic' | 'apikey') => 
                      setRequestData({ ...requestData, auth: { ...requestData.auth, type: value } })
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="apikey">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {requestData.auth.type === 'bearer' && (
                  <div className="space-y-2">
                    <Label htmlFor="bearer-token">Token</Label>
                    <Input 
                      id="bearer-token"
                      placeholder="Enter bearer token"
                      value={requestData.auth.token || ''}
                      onChange={(e) => setRequestData({ 
                        ...requestData, 
                        auth: { ...requestData.auth, token: e.target.value } 
                      })}
                    />
                  </div>
                )}
                
                {requestData.auth.type === 'basic' && (
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username"
                      placeholder="Enter username"
                      value={requestData.auth.username || ''}
                      onChange={(e) => setRequestData({ 
                        ...requestData, 
                        auth: { ...requestData.auth, username: e.target.value } 
                      })}
                    />
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={requestData.auth.password || ''}
                      onChange={(e) => setRequestData({ 
                        ...requestData, 
                        auth: { ...requestData.auth, password: e.target.value } 
                      })}
                    />
                  </div>
                )}
                
                {requestData.auth.type === 'apikey' && (
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input 
                      id="api-key"
                      placeholder="Enter API key"
                      value={requestData.auth.apiKey || ''}
                      onChange={(e) => setRequestData({ 
                        ...requestData, 
                        auth: { ...requestData.auth, apiKey: e.target.value } 
                      })}
                    />
                    <Label htmlFor="api-key-header">Header Name</Label>
                    <Input 
                      id="api-key-header"
                      placeholder="X-API-Key"
                      value={requestData.auth.apiKeyHeader || ''}
                      onChange={(e) => setRequestData({ 
                        ...requestData, 
                        auth: { ...requestData.auth, apiKeyHeader: e.target.value } 
                      })}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Response Panel */}
        {response && (
          <div className="h-96 border-t bg-card">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium">Response</span>
                  <Badge className={getStatusColor(response.status)}>
                    {response.status} {response.statusText}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {response.responseTime}ms
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={copyResponse}>
                    <Copy className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-4 h-full overflow-auto">
              <MonacoEditor
                value={response.body}
                onChange={() => {}} // Read-only for response
                language="json"
                placeholder="No response body"
                title=""
                description=""
                height="100%"
                showActions={false}
                validateJson={false}
                readOnly={true}
                minimap={false}
                fontSize={12}
                className="border-0"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Save Request Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Request</CardTitle>
              <CardDescription>Save this request to a collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request-name">Request Name</Label>
                <Input
                  id="request-name"
                  placeholder="Enter request name"
                  value={requestData.name}
                  onChange={(e) => setRequestData({ ...requestData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
                <Select 
                  value={requestData.collectionId?.toString() || ''} 
                  onValueChange={(value) => setRequestData({ ...requestData, collectionId: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection: any) => (
                      <SelectItem key={collection.id} value={collection.id.toString()}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-favorite"
                  checked={requestData.isFavorite}
                  onChange={(e) => setRequestData({ ...requestData, isFavorite: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is-favorite">Mark as favorite</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRequest}>
                  Save Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
