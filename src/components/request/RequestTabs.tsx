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
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../lib/utils';
import { ResponseData } from '../../types/entities';
import { RequestFormData } from '../../types/forms';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

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
        requestData.queryParams.filter(p => p.key || p.value).length > 0
          ? requestData.queryParams.filter(p => p.key || p.value).length
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
        Object.keys(requestData.headers).filter(k => k.trim() !== '').length > 0
          ? Object.keys(requestData.headers).filter(k => k.trim() !== '').length
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
    <div className="flex-shrink-0 bg-transparent px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-2xl border border-border/10 shadow-inner overflow-x-auto relative no-scrollbar" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex-shrink-0 flex items-center gap-2.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 group whitespace-nowrap cursor-pointer z-0',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Hover Background */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 border border-border/5" />
              )}

              {/* Background Highlight (Segmented Control Pill) */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-background rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] border border-border/40 -z-10"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}

              <div className={cn(
                'flex items-center justify-center transition-all duration-300',
                isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:-translate-y-[1px]'
              )}>
                <Icon className={cn(
                  'h-3.5 w-3.5 transition-colors duration-300',
                  isActive ? tab.color : cn(tab.color, 'opacity-60 group-hover:opacity-100')
                )} />
              </div>
              
              <span className={cn(
                "tracking-tight transition-all duration-300",
                isActive ? "font-bold" : "font-medium opacity-90 group-hover:opacity-100 group-hover:translate-x-[1px]"
              )}>
                {tab.label}
              </span>
              
              {tab.badge && (
                <div
                  className={cn(
                    'h-4.5 px-1.5 min-w-[18px] flex items-center justify-center text-[10px] font-black rounded-md transition-all duration-300 ring-1 ring-inset',
                    isActive 
                      ? 'bg-primary/10 text-primary ring-primary/20' 
                      : 'bg-muted/50 text-muted-foreground ring-border/50 group-hover:text-foreground',
                    tab.isSpecial && response?.status && response.status >= 400 ? 'bg-rose-500/10 text-rose-600 ring-rose-500/30' : '',
                    tab.isSpecial && response?.status && response.status < 300 ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/30' : ''
                  )}
                >
                  {tab.badge}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {/* Benchmark Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const store = useStore.getState();
                  store.setPerformanceTargetRequestId(requestData.id || null);
                  store.setCurrentPage('performance');
                }}
                disabled={!requestData.url.trim()}
                className="h-8 rounded-xl border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-500 font-bold text-[10px] uppercase tracking-widest px-3 gap-2 flex items-center transition-all hover:scale-105 active:scale-95"
              >
                <Activity className="h-3.5 w-3.5" />
                Benchmark
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Performance Testing</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isLoading && (
          <div className="flex items-center gap-2 px-3 h-8 text-[11px] font-bold text-primary bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-right-4 shrink-0">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <span className="uppercase tracking-[0.15em]">Live</span>
          </div>
        )}
      </div>
    </div>
  );
};
