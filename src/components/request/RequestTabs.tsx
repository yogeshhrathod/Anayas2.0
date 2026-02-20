/**
 * RequestTabs - Tab navigation with badge counts
 *
 * Provides tab navigation for request configuration sections:
 * - Params tab with query parameter count
 * - Auth tab with authentication type indicator
 * - Headers tab with header count
 * - Body tab with content type indicator
 */

import {
    Activity,
    Code,
    Eye,
    Fingerprint,
    Key,
    Zap,
} from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { ResponseData } from '../../types/entities';
import { RequestFormData } from '../../types/forms';
import { Badge } from '../ui/badge';

export interface RequestTabsProps {
  activeTab: 'params' | 'auth' | 'headers' | 'body' | 'response';
  setActiveTab: (
    tab: 'params' | 'auth' | 'headers' | 'body' | 'response'
  ) => void;
  requestData: RequestFormData;
  bodyContentType: 'json' | 'text';
  response?: ResponseData | null;
  isLoading?: boolean;
}

export const RequestTabs: React.FC<RequestTabsProps> = ({
  activeTab,
  setActiveTab,
  requestData,
  bodyContentType,
  response,
  isLoading,
}) => {
  const tabs = [
    {
      id: 'params' as const,
      label: 'Params',
      icon: Zap,
      color: 'text-amber-500',
      badge:
        requestData.queryParams.length > 0
          ? requestData.queryParams.length
          : undefined,
    },
    {
      id: 'auth' as const,
      label: 'Auth',
      icon: Fingerprint,
      color: 'text-indigo-500',
      badge:
        requestData.auth.type !== 'none'
          ? requestData.auth.type.toUpperCase()
          : undefined,
    },
    {
      id: 'headers' as const,
      label: 'Headers',
      icon: Key,
      color: 'text-emerald-500',
      badge:
        Object.keys(requestData.headers).length > 0
          ? Object.keys(requestData.headers).length
          : undefined,
    },
    {
      id: 'body' as const,
      label: 'Body',
      icon: Code,
      color: 'text-blue-500',
      badge: requestData.body.trim() ? bodyContentType.toUpperCase() : undefined,
    },
    {
      id: 'response' as const,
      label: 'Response',
      icon: Eye,
      color: 'text-rose-500',
      badge: response
        ? response.status >= 200 && response.status < 300
          ? '✓'
          : '✗'
        : undefined,
      isSpecial: !!response,
    },
  ];

  return (
    <div className="flex-shrink-0 bg-background/20 backdrop-blur-md border-b border-border/40 p-2">
      <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-xl border border-border/20 shadow-inner overflow-x-auto relative min-w-0" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 group whitespace-nowrap',
                isActive
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              )}
            >
              <div className={cn(
                'flex items-center justify-center p-1 rounded-md transition-colors duration-300',
                isActive ? 'bg-muted/50' : 'group-hover:bg-muted/30'
              )}>
                <Icon className={cn(
                  'h-4 w-4 transition-all duration-300',
                  isActive ? tab.color : 'text-muted-foreground group-hover:text-foreground',
                  isLoading && isActive ? 'animate-pulse' : ''
                )} />
              </div>
              
              <span className="tracking-tight">{tab.label}</span>
              
              {tab.badge && (
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className={cn(
                    'h-5 px-1.5 ml-0.5 flex items-center justify-center text-[10px] font-black rounded transition-all duration-300',
                    isActive ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground',
                    tab.isSpecial && response?.status && response.status >= 400 ? 'bg-rose-500 text-white' : '',
                    tab.isSpecial && response?.status && response.status < 300 ? 'bg-emerald-500 text-white' : ''
                  )}
                >
                  {tab.badge}
                </Badge>
              )}
              
              {isActive && (
                <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-sm animate-in fade-in zoom-in duration-300" />
              )}
            </button>
          );
        })}
        
        {isLoading && (
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-primary animate-pulse ml-auto bg-primary/10 rounded-full border border-primary/20 shadow-sm">
            <Activity className="h-3 w-3" />
            <span className="uppercase tracking-widest hidden sm:inline">Processing</span>
          </div>
        )}
      </div>
    </div>
  );
};
