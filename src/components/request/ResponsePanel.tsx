/**
 * ResponsePanel - Enhanced response display with headers and body
 * 
 * Displays API response data with:
 * - Status code and response time (always visible)
 * - Loading state with progress
 * - Error state with full details
 * - Response headers (collapsible, with tabs)
 * - Response body with syntax highlighting (resizable, handles large data)
 * - Copy and download actions
 * 
 * @example
 * ```tsx
 * <ResponsePanel
 *   response={response}
 *   isLoading={false}
 *   onCopy={handleCopyResponse}
 *   onDownload={handleDownloadResponse}
 * />
 * ```
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { 
  Clock, 
  Copy, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Key,
  Loader2,
  Info,
  Eye,
  Code
} from 'lucide-react';
import { MonacoEditor } from '../ui/monaco-editor';
import { ResponseData } from '../../types/entities';

export interface ResponsePanelProps {
  response: ResponseData | null;
  isLoading?: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function detectContentType(content: any, contentType?: string): { language: string; isJson: boolean; isBinary: boolean; isHtml: boolean; isXml: boolean } {
  // Check if binary (base64)
  if (typeof content === 'string' && /^[A-Za-z0-9+/=]+$/.test(content) && content.length > 100) {
    return { language: 'plaintext', isJson: false, isBinary: true, isHtml: false, isXml: false };
  }

  // Use provided content type
  if (contentType) {
    if (contentType.includes('json')) {
      return { language: 'json', isJson: true, isBinary: false, isHtml: false, isXml: false };
    }
    if (contentType.includes('xml')) {
      return { language: 'xml', isJson: false, isBinary: false, isHtml: false, isXml: true };
    }
    if (contentType.includes('html')) {
      return { language: 'html', isJson: false, isBinary: false, isHtml: true, isXml: false };
    }
    if (contentType.includes('css')) {
      return { language: 'css', isJson: false, isBinary: false, isHtml: false, isXml: false };
    }
    if (contentType.includes('javascript')) {
      return { language: 'javascript', isJson: false, isBinary: false, isHtml: false, isXml: false };
    }
  }

  // Try to detect from content
  if (typeof content === 'string') {
    const trimmed = content.trim().toLowerCase();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(content);
        return { language: 'json', isJson: true, isBinary: false, isHtml: false, isXml: false };
      } catch {
        return { language: 'plaintext', isJson: false, isBinary: false, isHtml: false, isXml: false };
      }
    }
    if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
      return { language: 'html', isJson: false, isBinary: false, isHtml: true, isXml: false };
    }
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
      return { language: 'xml', isJson: false, isBinary: false, isHtml: false, isXml: true };
    }
  }

  if (typeof content === 'object') {
    return { language: 'json', isJson: true, isBinary: false, isHtml: false, isXml: false };
  }

  return { language: 'plaintext', isJson: false, isBinary: false, isHtml: false, isXml: false };
}

function safeStringify(data: any, space: number = 2): string {
  if (data === null || data === undefined) {
    return String(data);
  }

  if (typeof data === 'string') {
    return data;
  }

  try {
    const str = JSON.stringify(data);
    if (str.length > 10 * 1024 * 1024) {
      return str.substring(0, 1000) + '\n\n... [Response too large, truncated for display. Use download to get full response] ...';
    }
    return JSON.stringify(data, null, space);
  } catch (error: any) {
    return `[Error stringifying response: ${error.message}]\n${String(data)}`;
  }
}

function getStatusVariant(status: number): 'default' | 'destructive' | 'secondary' {
  if (status >= 200 && status < 300) return 'default';
  if (status >= 300 && status < 400) return 'secondary';
  return 'destructive';
}

function getStatusIcon(status: number) {
  if (status >= 200 && status < 300) return CheckCircle;
  if (status >= 300 && status < 400) return Info;
  return XCircle;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  response,
  isLoading = false,
  onCopy,
  onDownload
}) => {
  const [headersExpanded, setHeadersExpanded] = useState(true);
  const [bodyExpanded, setBodyExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'request-headers' | 'response-headers' | 'body'>('body');
  const [isMaximized, setIsMaximized] = useState(false);
  const [bodyViewMode, setBodyViewMode] = useState<'preview' | 'raw'>('raw');
  const [htmlBlobUrl, setHtmlBlobUrl] = useState<string | null>(null);
  const htmlBlobUrlRef = useRef<string | null>(null);

  const { language, isJson, isBinary, isHtml, isXml } = useMemo(() => {
    if (!response?.data) {
      return { language: 'plaintext', isJson: false, isBinary: false, isHtml: false, isXml: false };
    }
    return detectContentType(response.data, response.contentType);
  }, [response?.data, response?.contentType]);

  const canPreview = isHtml || isJson || isXml;

  useEffect(() => {
    if (response && !canPreview) {
      setBodyViewMode('raw');
    }
  }, [response, canPreview]);

  const bodyContent = useMemo(() => {
    if (!response?.data) return '';
    if (response.data === null || response.data === undefined) return 'null';
    return safeStringify(response.data);
  }, [response?.data]);

  const processHtmlForPreview = async (html: string, baseUrl?: string): Promise<string> => {
    let processedHtml = html.trim();
    const isFragment = !processedHtml.toLowerCase().includes('<!doctype') && 
                       !processedHtml.toLowerCase().startsWith('<html');
    
    if (isFragment) {
      processedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${processedHtml}</body></html>`;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(processedHtml, 'text/html');
    
    // Remove dangerous elements
    ['base[href]', 'meta[http-equiv="refresh"]', 'iframe', 'object', 'embed'].forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    const resourcePromises: Promise<void>[] = [];
    
    // Process stylesheets
    doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) {
        link.remove();
        return;
      }
      
      if (href.startsWith('data:')) {
        try {
          const match = href.match(/data:text\/css[^,]*,(.+)/);
          if (match) {
            const css = decodeURIComponent(match[1]);
            const styleTag = doc.createElement('style');
            styleTag.textContent = css;
            link.parentNode?.replaceChild(styleTag, link);
          }
        } catch {
          link.remove();
        }
      } else {
        let absoluteHref = href;
        try {
          absoluteHref = baseUrl ? new URL(href, baseUrl).href : new URL(href).href;
        } catch {
          link.remove();
          return;
        }
        
        resourcePromises.push(
          window.electronAPI.resource.fetch(absoluteHref)
            .then((result: any) => {
              if (result.success && !result.isBinary) {
                const styleTag = doc.createElement('style');
                styleTag.textContent = result.data;
                link.parentNode?.replaceChild(styleTag, link);
              } else {
                link.remove();
              }
            })
            .catch(() => link.remove())
        );
      }
    });

    // Process images
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U1ZTdlYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2E3YWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
    
    doc.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
      
      let absoluteSrc = src;
      try {
        absoluteSrc = baseUrl ? new URL(src, baseUrl).href : new URL(src).href;
      } catch {
        img.setAttribute('src', placeholderImage);
        return;
      }
      
      resourcePromises.push(
        window.electronAPI.resource.fetch(absoluteSrc)
          .then((result: any) => {
            if (result.success) {
              if (result.isBinary) {
                const mimeType = result.contentType || 'image/png';
                img.setAttribute('src', `data:${mimeType};base64,${result.data}`);
              } else {
                const dataUrl = `data:${result.contentType || 'image/svg+xml'};charset=utf-8,${encodeURIComponent(result.data)}`;
                img.setAttribute('src', dataUrl);
              }
            } else {
              img.setAttribute('src', placeholderImage);
            }
          })
          .catch(() => img.setAttribute('src', placeholderImage))
      );
    });

    // Process background images in CSS
    doc.querySelectorAll('style').forEach((style) => {
      const css = style.textContent || '';
      const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
      const matches = Array.from(css.matchAll(urlRegex));
      
      matches.forEach((match) => {
        const url = match[1];
        if (url.startsWith('data:') || url.startsWith('blob:')) return;
        
        let absoluteUrl = url;
        try {
          absoluteUrl = baseUrl ? new URL(url, baseUrl).href : new URL(url).href;
        } catch {
          return;
        }
        
        resourcePromises.push(
          window.electronAPI.resource.fetch(absoluteUrl)
            .then((result: any) => {
              if (result.success) {
                const dataUrl = result.isBinary
                  ? `data:${result.contentType || 'image/png'};base64,${result.data}`
                  : `data:${result.contentType || 'image/svg+xml'};charset=utf-8,${encodeURIComponent(result.data)}`;
                style.textContent = css.replace(match[0], `url(${dataUrl})`);
              }
            })
            .catch(() => {})
        );
      });
    });

    await Promise.allSettled(resourcePromises);
    
    doc.querySelectorAll('script').forEach((script) => {
      const content = script.textContent || '';
      if (content.includes('parent.') || content.includes('top.') || 
          content.includes('window.parent') || content.includes('window.top') ||
          content.includes('frameElement')) {
        script.remove();
      }
    });
    
    return doc.documentElement.outerHTML;
  };

  const rawHtmlContent = useMemo(() => {
    if (!isHtml || !response?.data) return '';
    return typeof response.data === 'string' ? response.data : safeStringify(response.data);
  }, [response?.data, isHtml]);

  const [processedHtmlContent, setProcessedHtmlContent] = useState<string>('');
  const [isProcessingHtml, setIsProcessingHtml] = useState(false);

  useEffect(() => {
    if (htmlBlobUrlRef.current) {
      URL.revokeObjectURL(htmlBlobUrlRef.current);
      htmlBlobUrlRef.current = null;
      setHtmlBlobUrl(null);
    }

    if (isHtml && rawHtmlContent && bodyViewMode === 'preview') {
      setIsProcessingHtml(true);
      processHtmlForPreview(rawHtmlContent, response?.requestUrl)
        .then((processedHtml) => {
          setProcessedHtmlContent(processedHtml);
          
          // Create blob URL with processed HTML
          const blob = new Blob([processedHtml], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          htmlBlobUrlRef.current = url;
          setHtmlBlobUrl(url);
          setIsProcessingHtml(false);
        })
        .catch(() => {
          // Fallback to original HTML if processing fails
          setProcessedHtmlContent(rawHtmlContent);
          const blob = new Blob([rawHtmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          htmlBlobUrlRef.current = url;
          setHtmlBlobUrl(url);
          setIsProcessingHtml(false);
        });
      
      return () => {
        if (htmlBlobUrlRef.current) {
          URL.revokeObjectURL(htmlBlobUrlRef.current);
          htmlBlobUrlRef.current = null;
          setHtmlBlobUrl(null);
        }
      };
    } else {
      setProcessedHtmlContent('');
      setIsProcessingHtml(false);
    }
  }, [isHtml, rawHtmlContent, bodyViewMode, response?.requestUrl]);

  const parsedJsonContent = useMemo(() => {
    if (!isJson || !response?.data) return null;
    try {
      return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    } catch {
      return null;
    }
  }, [response?.data, isJson]);

  const isLargeResponse = useMemo(() => {
    if (!response?.size) return false;
    return response.size > 100 * 1024;
  }, [response?.size]);

  // Don't show anything if no response and not loading
  if (!response && !isLoading) {
    return null;
  }

  const StatusIcon = response ? getStatusIcon(response.status) : Loader2;

  return (
    <div className={`border-t border-border/50 bg-card/30 transition-all flex flex-col ${isMaximized ? 'fixed inset-0 z-50' : 'max-h-[80vh]'}`}>
      {isLoading ? (
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <h3 className="text-lg font-semibold">Sending Request...</h3>
          </div>
          <Progress value={undefined} className="h-2" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : response ? (
        <div className="flex flex-col h-full">
          {/* Summary Bar - Always Visible */}
          <div className="p-4 border-b border-border/50 bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <StatusIcon className={`h-5 w-5 ${
                    response.status >= 200 && response.status < 300 
                      ? 'text-green-600' 
                      : response.status >= 300 && response.status < 400
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`} />
                  Response
                </h3>
                <Badge variant={getStatusVariant(response.status)}>
                  {response.status} {response.statusText}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {response.time}ms
                </div>
                {response.size && (
                  <div className="text-sm text-muted-foreground">
                    {formatBytes(response.size)}
                  </div>
                )}
                {isLargeResponse && (
                  <Badge variant="secondary" className="text-xs">
                    Large Response
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onCopy} title="Copy response">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={onDownload} title="Download response">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {!isMaximized && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsMaximized(true)}
                    title="Maximize"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
                {isMaximized && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsMaximized(false)}
                    title="Minimize"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {response.contentType && (
                <div>
                  <span className="font-medium">Content-Type:</span> {response.contentType}
                </div>
              )}
              {response.headers['server'] && (
                <div>
                  <span className="font-medium">Server:</span> {response.headers['server']}
                </div>
              )}
              {response.headers['content-encoding'] && (
                <div>
                  <span className="font-medium">Encoding:</span> {response.headers['content-encoding']}
                </div>
              )}
            </div>

            {/* Error Alert */}
            {response.error && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  {response.error.type === 'timeout' && 'Request Timeout'}
                  {response.error.type === 'network' && 'Network Error'}
                  {response.error.type === 'parse' && 'Parse Error'}
                  {response.error.type === 'http' && 'HTTP Error'}
                  {!response.error.type && 'Error'}
                  {response.error.code && (
                    <Badge variant="outline" className="text-xs">
                      {response.error.code}
                    </Badge>
                  )}
                </AlertTitle>
                <AlertDescription>
                  {response.error.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tabs for Request Headers/Response Headers/Body */}
          <div className="border-b border-border/50 bg-card/30">
            <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('request-headers')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'request-headers' 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Key className="h-4 w-4" />
                <span>Request Headers</span>
                {response.requestHeaders && Object.keys(response.requestHeaders).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {Object.keys(response.requestHeaders).length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('response-headers')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'response-headers' 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Key className="h-4 w-4" />
                <span>Response Headers</span>
                {response.headers && Object.keys(response.headers).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {Object.keys(response.headers).length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('body')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'body' 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Body</span>
                {response.size && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {formatBytes(response.size)}
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4 min-h-0">
            {activeTab === 'request-headers' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Request Headers</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHeadersExpanded(!headersExpanded)}
                  >
                    {headersExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {headersExpanded && (
                  <div className="bg-muted/50 rounded-md p-3 font-mono text-xs">
                    {!response.requestHeaders || Object.keys(response.requestHeaders).length === 0 ? (
                      <div className="text-muted-foreground">No request headers</div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(response.requestHeaders).map(([key, value]) => (
                          <div key={key} className="flex gap-2 group">
                            <span className="text-muted-foreground flex-shrink-0 w-48">{key}:</span>
                            <span className="flex-1 break-words">{value}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(`${key}: ${value}`);
                              }}
                              title="Copy header"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'response-headers' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Response Headers</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHeadersExpanded(!headersExpanded)}
                  >
                    {headersExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {headersExpanded && (
                  <div className="bg-muted/50 rounded-md p-3 font-mono text-xs">
                    {Object.keys(response.headers).length === 0 ? (
                      <div className="text-muted-foreground">No response headers</div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(response.headers).map(([key, value]) => (
                          <div key={key} className="flex gap-2 group">
                            <span className="text-muted-foreground flex-shrink-0 w-48">{key}:</span>
                            <span className="flex-1 break-words">{value}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(`${key}: ${value}`);
                              }}
                              title="Copy header"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'body' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    Response Body
                    {isBinary && (
                      <Badge variant="secondary" className="text-xs">
                        Binary Content
                      </Badge>
                    )}
                    {isJson && (
                      <Badge variant="secondary" className="text-xs">
                        JSON
                      </Badge>
                    )}
                    {isHtml && (
                      <Badge variant="secondary" className="text-xs">
                        HTML
                      </Badge>
                    )}
                    {isXml && (
                      <Badge variant="secondary" className="text-xs">
                        XML
                      </Badge>
                    )}
                  </h4>
                  <div className="flex gap-2">
                    {canPreview && (
                      <Button
                        variant={bodyViewMode === 'preview' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBodyViewMode(bodyViewMode === 'preview' ? 'raw' : 'preview')}
                        title={bodyViewMode === 'preview' ? 'Switch to Raw' : 'Switch to Preview'}
                      >
                        {bodyViewMode === 'preview' ? (
                          <>
                            <Code className="h-4 w-4 mr-2" />
                            Raw
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBodyExpanded(!bodyExpanded)}
                    >
                      {bodyExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {bodyExpanded && (
                  <div className="relative">
                    {isBinary ? (
                      <div className="bg-muted/50 rounded-md p-4 text-center">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Binary content detected. Use download to save the file.
                        </p>
                        <Button onClick={onDownload} size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download Binary Content
                        </Button>
                      </div>
                    ) : bodyViewMode === 'preview' && canPreview ? (
                      <div className="border rounded-md bg-card">
                        {isHtml && (
                          <>
                            {isProcessingHtml ? (
                              <div className="flex items-center justify-center" style={{ 
                                height: isMaximized 
                                  ? Math.max(400, typeof window !== 'undefined' ? window.innerHeight - 300 : 600) 
                                  : 400 
                              }}>
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Processing styles...</span>
                              </div>
                            ) : htmlBlobUrl ? (
                              <iframe
                                src={htmlBlobUrl}
                                className="w-full border-0 rounded-md bg-white dark:bg-gray-900"
                                style={{ 
                                  height: isMaximized 
                                    ? Math.max(400, typeof window !== 'undefined' ? window.innerHeight - 300 : 600) 
                                    : 400 
                                }}
                                title="HTML Preview"
                                sandbox="allow-scripts allow-forms"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              />
                            ) : (
                              <iframe
                                srcDoc={processedHtmlContent || rawHtmlContent}
                                className="w-full border-0 rounded-md bg-white dark:bg-gray-900"
                                style={{ 
                                  height: isMaximized 
                                    ? Math.max(400, typeof window !== 'undefined' ? window.innerHeight - 300 : 600) 
                                    : 400 
                                }}
                                title="HTML Preview"
                                sandbox="allow-scripts allow-forms"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              />
                            )}
                          </>
                        )}
                        {isXml && bodyContent && (
                          <div className="p-4 overflow-auto" style={{ 
                            height: isMaximized 
                              ? Math.max(400, typeof window !== 'undefined' ? window.innerHeight - 300 : 600) 
                              : 400,
                            maxHeight: isMaximized 
                              ? Math.max(400, typeof window !== 'undefined' ? window.innerHeight - 300 : 600) 
                              : 400
                          }}>
                            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground">
                              {bodyContent}
                            </pre>
                          </div>
                        )}
                        {isJson && parsedJsonContent && (
                          <div className="p-4 overflow-auto" style={{ 
                            height: isMaximized 
                              ? Math.max(400, typeof window !== 'undefined' ? window.innerHeight - 300 : 600) 
                              : 400,
                            maxHeight: isMaximized 
                              ? Math.max(400, typeof window !== 'undefined' ? window.innerHeight - 300 : 600) 
                              : 400
                          }}>
                            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground">
                              {JSON.stringify(parsedJsonContent, null, 2)}
                            </pre>
                          </div>
                        )}
                        {isJson && !parsedJsonContent && (
                          <div className="p-4 text-center text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>Invalid JSON - showing raw format</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border rounded-md">
                        <MonacoEditor
                          value={bodyContent}
                          onChange={() => {}}
                          language={language}
                          placeholder="No response body"
                          title=""
                          description=""
                          height={isMaximized ? Math.max(400, typeof window !== 'undefined' ? window.innerHeight - 300 : 600) : 400}
                          showActions={false}
                          validateJson={isJson}
                          readOnly={true}
                          minimap={!isLargeResponse}
                          fontSize={13}
                          className="border-0"
                          wordWrap="on"
                        />
                      </div>
                    )}
                    {isLargeResponse && bodyViewMode === 'raw' && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Large response detected. Some features may be limited. Consider downloading for full content.
                      </div>
                    )}
                    {bodyViewMode === 'preview' && isHtml && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 inline mr-1" />
                        External stylesheets and images are fetched and inlined as data URIs.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
