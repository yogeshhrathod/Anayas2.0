import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Send, Loader2, Clock, Copy, Download, Plus, Trash2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface RequestData {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  body: string;
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
  const { currentEnvironment, setRequestHistory } = useStore();
  const { success, error } = useToast();
  
  const [requestData, setRequestData] = useState<RequestData>({
    method: 'GET',
    url: '',
    headers: {
      'Content-Type': 'application/json'
    },
    body: ''
  });
  
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');

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
      const processedUrl = replaceVariables(requestData.url);
      const processedHeaders = Object.fromEntries(
        Object.entries(requestData.headers).map(([key, value]) => [
          key,
          replaceVariables(value)
        ])
      );

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
          status: 200,
          statusText: 'OK',
          headers: {},
          body: JSON.stringify(result.data, null, 2),
          responseTime
        });

        const updatedHistory = await window.electronAPI.request.history(100);
        setRequestHistory(updatedHistory);

        success('Request Sent', `Request completed in ${responseTime}ms`);
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

  const addHeader = () => {
    setRequestData({
      ...requestData,
      headers: {
        ...requestData.headers,
        '': ''
      }
    });
  };

  const updateHeader = (oldKey: string, newKey: string, newValue: string) => {
    const newHeaders = { ...requestData.headers };
    delete newHeaders[oldKey];
    if (newKey.trim()) {
      newHeaders[newKey.trim()] = newValue.trim();
    }
    setRequestData({ ...requestData, headers: newHeaders });
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...requestData.headers };
    delete newHeaders[key];
    setRequestData({ ...requestData, headers: newHeaders });
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
            <div className="flex gap-2">
              <Select value={requestData.method} onValueChange={(value: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS') => setRequestData({ ...requestData, method: value })}>
                <SelectTrigger className="w-32 bg-background">
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
                className="flex-1 bg-background"
              />
              <Button onClick={handleSendRequest} disabled={isLoading || !requestData.url.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b bg-card">
            <div className="flex">
              <button
                onClick={() => setActiveTab('params')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'params' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Params
              </button>
              <button
                onClick={() => setActiveTab('headers')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'headers' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Headers
              </button>
              <button
                onClick={() => setActiveTab('body')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'body' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Body
              </button>
              <button
                onClick={() => setActiveTab('auth')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Query Parameters</span>
                  <Button variant="ghost" size="sm" onClick={() => {}}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Key" className="flex-1" />
                    <Input placeholder="Value" className="flex-1" />
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Headers</span>
                  <Button variant="ghost" size="sm" onClick={addHeader}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(requestData.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <Input
                        value={key}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHeader(key, e.target.value, value)}
                        placeholder="Header name"
                        className="flex-1"
                      />
                      <Input
                        value={value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHeader(key, key, e.target.value)}
                        placeholder="Header value"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHeader(key)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
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
                  <Select defaultValue="json">
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
                <Textarea
                  value={requestData.body}
                  onChange={(e) => setRequestData({ ...requestData, body: e.target.value })}
                  placeholder='{"key": "value"}'
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Type</span>
                  <Select defaultValue="no-auth">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-auth">No Auth</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="api-key">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Input placeholder="Token" />
                  <Input placeholder="Add to" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Panel */}
        {response && (
          <div className="h-96 border-t bg-card">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-4 h-full overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {response.body}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
