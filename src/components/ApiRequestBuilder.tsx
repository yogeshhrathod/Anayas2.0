import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  Send, 
  Loader2, 
  Clock, 
  Copy, 
  Download, 
  Settings, 
  Key, 
  Shield,
  Plus,
  Bookmark,
  Trash2,
  FileText
} from 'lucide-react';
import { useToast } from './ui/use-toast';
import { MonacoEditor } from './ui/monaco-editor';
import { KeyValueEditor } from './ui/key-value-editor';
import { HeadersKeyValueEditor } from './ui/headers-key-value-editor';
import { ViewToggleButton } from './ui/view-toggle-button';

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
  data: any;
  time: number;
}

interface RequestPreset {
  id: string;
  name: string;
  description?: string;
  requestData: {
    method: RequestData['method'];
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
  };
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

export function ApiRequestBuilder() {
  const { selectedRequest } = useStore();
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
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body'>('params');
  const [bodyType, setBodyType] = useState<'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded'>('raw');
  const [bodyContentType, setBodyContentType] = useState<'json' | 'text'>('json');
  const [bodyViewMode, setBodyViewMode] = useState<'table' | 'json'>('table');
  const [bodyFormData, setBodyFormData] = useState<Array<{ key: string; value: string; enabled: boolean }>>([]);
  const [paramsViewMode, setParamsViewMode] = useState<'table' | 'json'>('table');
  const [headersViewMode, setHeadersViewMode] = useState<'table' | 'json'>('table');
  const [bulkEditJson, setBulkEditJson] = useState('');
  
  // Request presets state
  const [presets, setPresets] = useState<RequestPreset[]>([]);
  const [showCreatePresetDialog, setShowCreatePresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [isPresetsExpanded, setIsPresetsExpanded] = useState(true);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Load selected request when it changes
  useEffect(() => {
    if (selectedRequest) {
      setRequestData({
        id: selectedRequest.id,
        name: selectedRequest.name,
        method: selectedRequest.method as RequestData['method'],
        url: selectedRequest.url,
        headers: selectedRequest.headers || {},
        body: selectedRequest.body || '',
        queryParams: selectedRequest.queryParams || [],
        auth: selectedRequest.auth || { type: 'none' },
        collectionId: selectedRequest.collection_id,
        folderId: selectedRequest.folder_id,
        isFavorite: Boolean(selectedRequest.is_favorite),
      });
    }
  }, [selectedRequest]);

  const toggleParamsView = () => {
    if (paramsViewMode === 'table') {
      const jsonData = requestData.queryParams.reduce((acc, param) => {
        if (param.key && param.value) {
          acc[param.key] = param.value;
        }
        return acc;
      }, {} as Record<string, string>);
      setBulkEditJson(JSON.stringify(jsonData, null, 2));
    } else {
      try {
        const parsed = JSON.parse(bulkEditJson);
        const newParams = Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value),
          enabled: true
        }));
        setRequestData({ ...requestData, queryParams: newParams });
      } catch (e: any) {
        error('Invalid JSON', 'Please fix JSON syntax errors before switching to table view');
        return;
      }
    }
    setParamsViewMode(paramsViewMode === 'table' ? 'json' : 'table');
  };

  const toggleHeadersView = () => {
    if (headersViewMode === 'table') {
      setBulkEditJson(JSON.stringify(requestData.headers, null, 2));
    } else {
      try {
        const parsed = JSON.parse(bulkEditJson);
        setRequestData({ ...requestData, headers: parsed });
      } catch (e: any) {
        error('Invalid JSON', 'Please fix JSON syntax errors before switching to table view');
        return;
      }
    }
    setHeadersViewMode(headersViewMode === 'table' ? 'json' : 'table');
  };

  const createPreset = () => {
    if (!newPresetName.trim()) return;
    
    // Capture current body data based on body type
    let capturedBody = '';
    if (bodyType === 'raw') {
      capturedBody = requestData.body;
    } else if (bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') {
      // Convert form data to JSON string for storage
      const formDataObj = bodyFormData.reduce((acc, item) => {
        if (item.key && item.value) {
          acc[item.key] = item.value;
        }
        return acc;
      }, {} as Record<string, string>);
      capturedBody = JSON.stringify(formDataObj);
    }
    
    const preset: RequestPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      requestData: {
        method: requestData.method,
        url: requestData.url,
        headers: { ...requestData.headers },
        body: capturedBody,
        queryParams: [...requestData.queryParams],
        auth: { ...requestData.auth }
      }
    };
    
    setPresets([...presets, preset]);
    setNewPresetName('');
    setNewPresetDescription('');
    setShowCreatePresetDialog(false);
    success('Preset Created', `"${preset.name}" has been saved successfully`);
  };

  const applyPreset = (preset: RequestPreset) => {
    // Apply basic request data
    setRequestData({
      ...requestData,
      method: preset.requestData.method,
      url: preset.requestData.url,
      headers: { ...preset.requestData.headers },
      body: preset.requestData.body,
      queryParams: [...preset.requestData.queryParams],
      auth: { ...preset.requestData.auth }
    });
    
    // Set active preset
    setActivePresetId(preset.id);
    
    // Try to parse body data and set appropriate body type
    try {
      const parsedBody = JSON.parse(preset.requestData.body);
      if (typeof parsedBody === 'object' && parsedBody !== null) {
        // If it's a JSON object, convert to form data
        const formDataArray = Object.entries(parsedBody).map(([key, value]) => ({
          key,
          value: String(value),
          enabled: true
        }));
        setBodyFormData(formDataArray);
        setBodyType('form-data');
      }
    } catch {
      // If not JSON, treat as raw text
      setBodyType('raw');
    }
    
    success('Preset Applied', `"${preset.name}" configuration has been applied`);
  };

  const deletePreset = (presetId: string) => {
    setPresets(presets.filter(p => p.id !== presetId));
    success('Preset Deleted', 'Preset has been removed successfully');
  };

  const sendRequest = async () => {
    if (!requestData.url.trim()) {
      error('Invalid URL', 'Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const response = await window.electronAPI.request.send({
        method: requestData.method,
        url: requestData.url,
        headers: requestData.headers,
        body: requestData.body,
        auth: requestData.auth
      });

      setResponse(response);
      // Note: setRequestHistory is a function that updates the store, not an array
      success('Request Sent', `Request completed with status ${response.status}`);
    } catch (err: any) {
      error('Request Failed', err.message || 'An error occurred while sending the request');
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      success('Copied', 'Response data copied to clipboard');
    }
  };

  const downloadResponse = () => {
    if (response) {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Downloaded', 'Response data downloaded successfully');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Request Builder Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Method Selector */}
            <Select value={requestData.method} onValueChange={(value) => setRequestData({ ...requestData, method: value as RequestData['method'] })}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map(method => (
                  <SelectItem key={method} value={method}>
                    <span className={`font-mono text-sm font-bold ${
                      method === 'GET' ? 'text-green-600' :
                      method === 'POST' ? 'text-blue-600' :
                      method === 'PUT' ? 'text-orange-600' :
                      method === 'PATCH' ? 'text-purple-600' :
                      method === 'DELETE' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {method}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* URL Input */}
            <div className="flex-1">
              <Input
                value={requestData.url}
                onChange={(e) => setRequestData({ ...requestData, url: e.target.value })}
                placeholder="Enter request URL (e.g., https://api.example.com/users)"
                className="font-mono text-sm"
              />
            </div>

            {/* Send Button */}
            <Button onClick={sendRequest} disabled={isLoading || !requestData.url.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Request Configuration */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-border/50 bg-card/30">
            <div className="px-4 py-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('params')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === 'params' 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Params</span>
                  {requestData.queryParams.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {requestData.queryParams.length}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('auth')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === 'auth' 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Auth</span>
                  {requestData.auth.type !== 'none' && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {requestData.auth.type}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('headers')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === 'headers' 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Key className="h-4 w-4" />
                  <span>Headers</span>
                  {Object.keys(requestData.headers).length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {Object.keys(requestData.headers).length}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('body')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === 'body' 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Body</span>
                  {requestData.body.trim() && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {bodyContentType}
                    </Badge>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-3 bg-background/50">
            {activeTab === 'params' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      Query Parameters
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Add query parameters to your request URL
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newParams = [...requestData.queryParams, { key: '', value: '', enabled: true }];
                        setRequestData({ ...requestData, queryParams: newParams });
                      }}
                      className="h-7 w-7 p-0"
                      title="Add Parameter"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <ViewToggleButton
                      currentView={paramsViewMode}
                      onToggle={toggleParamsView}
                    />
                  </div>
                </div>
                
                <div className="border rounded-md bg-card">
                  {paramsViewMode === 'table' ? (
                    <div className="p-3">
                      <KeyValueEditor
                        items={requestData.queryParams}
                        onChange={(items) => setRequestData({ ...requestData, queryParams: items })}
                        placeholder={{ key: 'Parameter name', value: 'Parameter value' }}
                        showEnabled={true}
                      />
                    </div>
                  ) : (
                    <MonacoEditor
                      value={bulkEditJson}
                      onChange={(value) => setBulkEditJson(value)}
                      language="json"
                      placeholder='{"key": "value"}'
                      title=""
                      description=""
                      height={200}
                      showActions={true}
                      validateJson={true}
                      readOnly={false}
                      minimap={false}
                      fontSize={13}
                      className="border-0"
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      HTTP Headers
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Add HTTP headers to your request
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newHeaders = { ...requestData.headers, '': '' };
                        setRequestData({ ...requestData, headers: newHeaders });
                      }}
                      className="h-7 w-7 p-0"
                      title="Add Header"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <ViewToggleButton
                      currentView={headersViewMode}
                      onToggle={toggleHeadersView}
                    />
                  </div>
                </div>
                
                <div className="border rounded-md bg-card">
                  {headersViewMode === 'table' ? (
                    <div className="p-3">
                      <HeadersKeyValueEditor
                        headers={requestData.headers}
                        onChange={(headers) => setRequestData({ ...requestData, headers })}
                        placeholder={{ key: 'Header Name', value: 'Header Value' }}
                      />
                    </div>
                  ) : (
                    <MonacoEditor
                      value={bulkEditJson}
                      onChange={(value) => setBulkEditJson(value)}
                      language="json"
                      placeholder='{"Content-Type": "application/json"}'
                      title=""
                      description=""
                      height={200}
                      showActions={true}
                      validateJson={true}
                      readOnly={false}
                      minimap={false}
                      fontSize={13}
                      className="border-0"
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Request Body
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Define the request payload
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Body Type Dropdown */}
                    <Select value={bodyType} onValueChange={(value: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded') => setBodyType(value)}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-muted-foreground">None</SelectItem>
                        <SelectItem value="raw" className="text-blue-600">Raw</SelectItem>
                        <SelectItem value="form-data" className="text-green-600">Form Data</SelectItem>
                        <SelectItem value="x-www-form-urlencoded" className="text-purple-600">URL Encoded</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Format Dropdown - Only visible when bodyType === 'raw' */}
                    {bodyType === 'raw' && (
                      <Select value={bodyContentType} onValueChange={(value: 'json' | 'text') => setBodyContentType(value)}>
                        <SelectTrigger className="w-20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {/* Action Buttons - Conditional based on body type */}
                    {bodyType !== 'none' && (
                      <div className="flex gap-1">
                        {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded' || (bodyType === 'raw' && bodyViewMode === 'table')) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBodyFormData([...bodyFormData, { key: '', value: '', enabled: true }])}
                            className="h-7 w-7 p-0"
                            title="Add Field"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                        {bodyType === 'raw' && (
                          <ViewToggleButton
                            currentView={bodyViewMode}
                            onToggle={() => setBodyViewMode(bodyViewMode === 'table' ? 'json' : 'table')}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Conditional Content Rendering based on bodyType */}
                {bodyType === 'none' ? (
                  <div className="border rounded-md bg-card">
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No body data</p>
                      <p className="text-xs mt-1">Select a body type to add content</p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md bg-card">
                    {bodyType === 'raw' ? (
                      // Raw mode: Show table/JSON toggle
                      bodyViewMode === 'table' ? (
                        <div className="p-3">
                          <KeyValueEditor
                            items={bodyFormData}
                            onChange={setBodyFormData}
                            placeholder={{ key: 'Field Name', value: 'Field Value' }}
                            showEnabled={true}
                          />
                        </div>
                      ) : (
                        <MonacoEditor
                          value={requestData.body}
                          onChange={(value) => setRequestData({ ...requestData, body: value })}
                          language={bodyContentType}
                          placeholder={bodyContentType === 'json' ? '{"key": "value"}' : 'Enter text content'}
                          title=""
                          description=""
                          height={200}
                          showActions={true}
                          validateJson={bodyContentType === 'json'}
                          readOnly={false}
                          minimap={false}
                          fontSize={13}
                          className="border-0"
                        />
                      )
                    ) : (
                      // Form Data and URL Encoded: Show table view only
                      <div className="p-3">
                        <KeyValueEditor
                          items={bodyFormData}
                          onChange={setBodyFormData}
                          placeholder={{ 
                            key: bodyType === 'form-data' ? 'Field Name' : 'Parameter Name', 
                            value: bodyType === 'form-data' ? 'Field Value' : 'Parameter Value' 
                          }}
                          showEnabled={true}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Authentication
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure authentication for your request
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="auth-type" className="text-sm font-medium">Authentication Type</Label>
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
                        <SelectItem value="none">No Authentication</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Authentication</SelectItem>
                        <SelectItem value="apikey">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {requestData.auth.type === 'bearer' && (
                    <Card className="p-4">
                      <div className="space-y-3">
                        <Label htmlFor="bearer-token" className="text-sm font-medium">Bearer Token</Label>
                        <Input 
                          id="bearer-token"
                          type="password"
                          value={requestData.auth.token || ''}
                          onChange={(e) => setRequestData({ 
                            ...requestData, 
                            auth: { ...requestData.auth, token: e.target.value } 
                          })}
                          placeholder="Enter your bearer token"
                        />
                        <p className="text-xs text-muted-foreground">
                          Bearer [token] will be sent in the Authorization header
                        </p>
                      </div>
                    </Card>
                  )}
                  
                  {requestData.auth.type === 'basic' && (
                    <Card className="p-4">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="basic-username" className="text-sm font-medium">Username</Label>
                          <Input 
                            id="basic-username"
                            value={requestData.auth.username || ''}
                            onChange={(e) => setRequestData({ 
                              ...requestData, 
                              auth: { ...requestData.auth, username: e.target.value } 
                            })}
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="basic-password" className="text-sm font-medium">Password</Label>
                          <Input 
                            id="basic-password"
                            type="password"
                            value={requestData.auth.password || ''}
                            onChange={(e) => setRequestData({ 
                              ...requestData, 
                              auth: { ...requestData.auth, password: e.target.value } 
                            })}
                            placeholder="Enter password"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Credentials will be encoded and sent in the Authorization header
                        </p>
                      </div>
                    </Card>
                  )}
                  
                  {requestData.auth.type === 'apikey' && (
                    <Card className="p-4">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="apikey-key" className="text-sm font-medium">API Key</Label>
                          <Input 
                            id="apikey-key"
                            type="password"
                            value={requestData.auth.apiKey || ''}
                            onChange={(e) => setRequestData({ 
                              ...requestData, 
                              auth: { ...requestData.auth, apiKey: e.target.value } 
                            })}
                            placeholder="Enter your API key"
                          />
                        </div>
                        <div>
                          <Label htmlFor="apikey-header" className="text-sm font-medium">Header Name</Label>
                          <Input 
                            id="apikey-header"
                            value={requestData.auth.apiKeyHeader || 'X-API-Key'}
                            onChange={(e) => setRequestData({ 
                              ...requestData, 
                              auth: { ...requestData.auth, apiKeyHeader: e.target.value } 
                            })}
                            placeholder="e.g., X-API-Key, Authorization"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          API key will be sent in the specified header
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Request Presets */}
        <div className={`border-l border-border/50 bg-card/30 transition-all duration-300 ${
          isPresetsExpanded ? 'w-80' : 'w-12'
        }`}>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsPresetsExpanded(!isPresetsExpanded)}
                  className="flex items-center gap-2 hover:bg-muted/50 rounded py-1 transition-colors"
                >
                  {isPresetsExpanded ? (
                    <>
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Bookmark className="h-4 w-4" />
                        Request Presets
                        {presets.length > 0 && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                            {presets.length}
                          </Badge>
                        )}
                      </h4>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 w-full">
                      <div className="flex items-center justify-center w-full">
                        <Bookmark className="h-4 w-4" />
                      </div>
                      {presets.length > 0 && (
                        <Badge variant="secondary" className="h-4 w-4 p-0 text-xs flex items-center justify-center">
                          {presets.length}
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
                {isPresetsExpanded && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreatePresetDialog(true)}
                    className="h-7 w-7 p-0"
                    title="Create Preset"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {isPresetsExpanded ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {presets.length > 0 ? (
                    presets.map((preset) => (
                      <Card 
                        key={preset.id} 
                        className={`p-3 transition-colors cursor-pointer ${
                          activePresetId === preset.id 
                            ? 'bg-primary/10 border-primary/30 hover:bg-primary/15' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-sm truncate">{preset.name}</h5>
                              {activePresetId === preset.id && (
                                <Badge variant="default" className="h-4 px-1.5 text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            {preset.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {preset.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {preset.requestData.method} • {preset.requestData.url || 'No URL'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePreset(preset.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title="Delete Preset"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No presets created yet</p>
                      <p className="text-xs mt-1">Create your first preset to save request configurations</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  {presets.map((preset, index) => (
                    <TooltipProvider key={preset.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyPreset(preset)}
                            className={`w-full h-8 p-0 flex items-center justify-center transition-colors ${
                              activePresetId === preset.id 
                                ? 'bg-primary/20 hover:bg-primary/30' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <Badge 
                              variant={activePresetId === preset.id ? "default" : "secondary"}
                              className={`h-6 w-6 p-0 text-xs flex items-center justify-center font-bold ${
                                activePresetId === preset.id 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : ''
                              }`}
                            >
                              {index + 1}
                            </Badge>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{preset.name}</p>
                            {preset.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {preset.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {preset.requestData.method} • {preset.requestData.url || 'No URL'}
                            </p>
                            {activePresetId === preset.id && (
                              <p className="text-xs text-primary font-medium">Currently Active</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {presets.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-xs flex flex-col items-center">
                      <Bookmark className="h-6 w-6 mb-1 opacity-50" />
                      <p>No presets</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Response Section */}
      {response && (
        <div className="border-t border-border/50 bg-card/30">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Response</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}>
                    {response.status} {response.statusText}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {response.time}ms
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyResponse}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadResponse}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Headers</h4>
                <div className="bg-muted/50 rounded-md p-3 font-mono text-xs overflow-x-auto">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="text-muted-foreground w-48 flex-shrink-0">{key}:</span>
                      <span className="ml-2">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Body</h4>
                <MonacoEditor
                  value={JSON.stringify(response.data, null, 2)}
                  onChange={() => {}}
                  language="json"
                  placeholder="No response body"
                  title=""
                  description=""
                  height={300}
                  showActions={false}
                  validateJson={false}
                  readOnly={true}
                  minimap={false}
                  fontSize={13}
                  className="border rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Preset Dialog */}
      {showCreatePresetDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Create Request Preset</CardTitle>
              <CardDescription>
                Save the current request configuration as a reusable preset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g., Success Case, Error Case"
                />
              </div>
              <div>
                <Label htmlFor="preset-description">Description (Optional)</Label>
                <Input
                  id="preset-description"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="Brief description of this preset"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={createPreset} disabled={!newPresetName.trim()}>
                  Create Preset
                </Button>
                <Button variant="outline" onClick={() => setShowCreatePresetDialog(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}