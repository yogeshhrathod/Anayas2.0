/**
 * RequestHeader - Name editing, save status, method selector, URL input
 * 
 * Handles the top section of the request builder with:
 * - Request name with inline editing
 * - Save status indicator
 * - HTTP method selector
 * - URL input field
 * - Send button
 * 
 * @example
 * ```tsx
 * <RequestHeader
 *   requestData={requestData}
 *   setRequestData={setRequestData}
 *   isSaved={isSaved}
 *   lastSavedAt={lastSavedAt}
 *   isEditingName={isEditingName}
 *   tempName={tempName}
 *   onNameEdit={handleNameEdit}
 *   onSend={handleSend}
 *   isLoading={isLoading}
 * />
 * ```
 */

import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Send, Loader2, Check } from 'lucide-react';
import { RequestFormData } from '../../types/forms';
import { KEYMAP, getShortcutDisplay } from '../../lib/keymap';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

export interface RequestHeaderProps {
  requestData: RequestFormData;
  setRequestData: (data: RequestFormData | ((prev: RequestFormData) => RequestFormData)) => void;
  isSaved: boolean;
  lastSavedAt: Date | null;
  isEditingName: boolean;
  tempName: string;
  onNameEdit: {
    start: () => void;
    save: () => Promise<void>;
    cancel: () => void;
    setTempName: (name: string) => void;
  };
  onSend: () => void;
  isLoading: boolean;
}

export const RequestHeader: React.FC<RequestHeaderProps> = ({
  requestData,
  setRequestData,
  isSaved,
  lastSavedAt,
  isEditingName,
  tempName,
  onNameEdit,
  onSend,
  isLoading
}) => {
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onNameEdit.save();
    } else if (e.key === 'Escape') {
      onNameEdit.cancel();
    }
  };

  return (
    <div className="border-b border-border/50 bg-card/50">
      <div className="p-4">
        {/* Request Name Row */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1">
            {isEditingName ? (
              <Input
                value={tempName}
                onChange={(e) => onNameEdit.setTempName(e.target.value)}
                onBlur={() => onNameEdit.save()}
                onKeyDown={handleNameKeyDown}
                placeholder="Enter request name"
                className="text-sm font-medium h-8 w-auto min-w-0 max-w-xs"
                autoFocus
              />
            ) : (
              <div
                className={`text-sm font-medium py-1 px-2 rounded border border-transparent hover:border-border cursor-pointer transition-colors inline-block ${
                  requestData.id ? 'hover:bg-muted/30' : ''
                } ${!requestData.name ? 'text-muted-foreground' : ''}`}
                onDoubleClick={onNameEdit.start}
                title={requestData.id ? "Double-click to edit name" : "Save request first to enable name editing"}
              >
                {requestData.name || 'Untitled Request'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Save Status Indicator */}
            {isSaved && lastSavedAt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Saved at {lastSavedAt.toLocaleTimeString()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        {/* Method and URL Row */}
        <div className="flex items-center gap-4">
          {/* Method Selector */}
          <Select 
            value={requestData.method} 
            onValueChange={(value) => setRequestData({ ...requestData, method: value as RequestFormData['method'] })}
          >
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
              placeholder="Enter request URL"
              className="font-mono text-xs"
              title={`Focus URL (${getShortcutDisplay(KEYMAP.FOCUS_URL)})`}
            />
          </div>

          {/* Send Button */}
          <Button 
            onClick={onSend} 
            disabled={isLoading || !requestData.url.trim()}
            title={`Send Request (${getShortcutDisplay(KEYMAP.SEND_REQUEST)})`}
          >
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
  );
};
