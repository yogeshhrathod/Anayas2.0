import { Clock, Copy, Download, Eye, FileCode, FileText, Image as ImageIcon, Music, Video } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
    formatResponseTime,
    getStatusDisplay,
    getStatusVariant,
    safeStringifyBody,
} from '../../lib/response-utils';
import { ResponseData } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MonacoEditor } from '../ui/monaco-editor';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { cn } from '../../lib/utils';

export interface ResponseBodyViewProps {
  response: ResponseData | null;
  onCopy?: () => void;
  onDownload?: () => void;
  showActions?: boolean; // Show Copy/Download buttons (default true)
}

export const ResponseBodyView: React.FC<ResponseBodyViewProps> = ({
  response,
  onCopy,
  onDownload,
  showActions = true,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  const { contentType, isMedia, mediaType } = useMemo(() => {
    if (!response || !response.headers) {
      return { contentType: '', isMedia: false, mediaType: 'text' as const };
    }

    const ct = Object.entries(response.headers).find(
      ([k]) => k.toLowerCase() === 'content-type'
    )?.[1]?.toLowerCase() || '';

    if (ct.startsWith('image/')) return { contentType: ct, isMedia: true, mediaType: 'image' as const };
    if (ct.startsWith('video/')) return { contentType: ct, isMedia: true, mediaType: 'video' as const };
    if (ct.startsWith('audio/')) return { contentType: ct, isMedia: true, mediaType: 'audio' as const };
    if (ct === 'application/pdf') return { contentType: ct, isMedia: true, mediaType: 'pdf' as const };

    return { contentType: ct, isMedia: false, mediaType: 'text' as const };
  }, [response]);

  if (!response) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0 text-muted-foreground">
        <p>No response data available. Send a request to see response body.</p>
      </div>
    );
  }

  // Format response body for display (safe for undefined/null)
  const formattedBody = safeStringifyBody(response.data);

  const renderMediaPreview = () => {
    if (!response.data || typeof response.data !== 'string') return null;

    const dataUrl = `data:${contentType};base64,${response.data}`;

    switch (mediaType) {
      case 'image':
        return (
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-muted/10">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={dataUrl}
                alt="Response preview"
                className="relative max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl border border-border/50 animate-in zoom-in-95 duration-500"
              />
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="flex-1 flex items-center justify-center p-8 bg-muted/10">
            <video
              src={dataUrl}
              controls
              className="max-w-full max-h-[60vh] rounded-lg shadow-2xl border border-border/50 animate-in fade-in duration-500"
            />
          </div>
        );
      case 'audio':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/10">
            <div className="p-12 rounded-3xl bg-background/50 border border-border/50 shadow-2xl flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Music className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <audio src={dataUrl} controls className="w-72" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Audio Content Detected</p>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <div className="flex-1 flex flex-col p-4 bg-muted/10">
            <iframe
              src={`${dataUrl}#toolbar=0`}
              className="flex-1 w-full rounded-lg border border-border/50 shadow-inner bg-white animate-in fade-in duration-700"
              title="PDF Preview"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header with Status and Actions - Fixed height */}
        {showActions && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                {isMedia ? (
                  <>
                    {mediaType === 'image' && <ImageIcon className="h-4 w-4 text-primary" />}
                    {mediaType === 'video' && <Video className="h-4 w-4 text-primary" />}
                    {mediaType === 'audio' && <Music className="h-4 w-4 text-primary" />}
                    {mediaType === 'pdf' && <FileText className="h-4 w-4 text-primary" />}
                    <span className="capitalize">{mediaType} Preview</span>
                  </>
                ) : (
                  'Response Body'
                )}
              </h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant={getStatusVariant(response.status)}
                  className="text-xs"
                >
                  {getStatusDisplay(response.status)}{' '}
                  {response.statusText ?? 'Unknown'}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatResponseTime(response.time)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isMedia && (
                <div className="flex p-1 bg-muted/40 rounded-lg border border-border/20 shadow-inner mr-2">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all duration-200",
                      viewMode === 'preview' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Eye className="h-3 w-3" />
                    PREVIEW
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all duration-200",
                      viewMode === 'raw' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileCode className="h-3 w-3" />
                    RAW
                  </button>
                </div>
              )}
              
              {(onCopy || onDownload) && (
                <div className="flex gap-2">
                  {onCopy && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onCopy}
                          className="px-2 h-8 w-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy response body</TooltipContent>
                    </Tooltip>
                  )}
                  {onDownload && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onDownload}
                          className="px-2 h-8 w-8"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download response</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monaco Editor or Error View - Dynamic height, fills remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {response.status === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="h-16 w-16 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Badge variant="destructive" className="h-8 w-8 px-0 rounded-full flex items-center justify-center font-bold">!</Badge>
              </div>
              <h2 className="text-xl font-bold text-destructive mb-2 tracking-tight">Request Failed</h2>
              <div className="max-w-md bg-muted/30 p-4 rounded-xl border border-border/40 text-sm font-medium text-muted-foreground whitespace-pre-wrap break-words mb-6 shadow-inner text-center">
                {response.statusText || 'Unable to reach the server. Please check the URL and your network connection.'}
              </div>
              <p className="text-[11px] text-muted-foreground/60 max-w-sm leading-relaxed">
                If the server uses a self-signed certificate, ensure <span className="font-bold text-muted-foreground">SSL Verification</span> is disabled in settings.
              </p>
            </div>
          ) : isMedia && viewMode === 'preview' ? (
            renderMediaPreview()
          ) : (
            <MonacoEditor
              value={formattedBody}
              onChange={() => {}} // Read-only, no changes
              language={contentType.includes('html') ? 'html' : contentType.includes('xml') ? 'xml' : 'json'}
              placeholder="No response body"
              title=""
              description=""
              height="100%"
              showActions={true}
              validateJson={false}
              readOnly={true}
              minimap={false}
              fontSize={13}
              className="border-0"
              automaticLayout={true}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

