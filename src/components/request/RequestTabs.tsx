/**
 * RequestTabs - Tab navigation with badge counts
 *
 * Provides tab navigation for request configuration sections:
 * - Params tab with query parameter count
 * - Auth tab with authentication type indicator
 * - Headers tab with header count
 * - Body tab with content type indicator
 *
 * @example
 * ```tsx
 * <RequestTabs
 *   activeTab={activeTab}
 *   setActiveTab={setActiveTab}
 *   requestData={requestData}
 *   bodyContentType={bodyContentType}
 * />
 * ```
 */

import { Eye, FileText, Key, Settings, Shield } from 'lucide-react';
import React from 'react';
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
}

export const RequestTabs: React.FC<RequestTabsProps> = ({
  activeTab,
  setActiveTab,
  requestData,
  bodyContentType,
  response,
}) => {
  const tabs = [
    {
      id: 'params' as const,
      label: 'Params',
      icon: Settings,
      badge:
        requestData.queryParams.length > 0
          ? requestData.queryParams.length
          : undefined,
    },
    {
      id: 'auth' as const,
      label: 'Auth',
      icon: Shield,
      badge:
        requestData.auth.type !== 'none' ? requestData.auth.type : undefined,
    },
    {
      id: 'headers' as const,
      label: 'Headers',
      icon: Key,
      badge:
        Object.keys(requestData.headers).length > 0
          ? Object.keys(requestData.headers).length
          : undefined,
    },
    {
      id: 'body' as const,
      label: 'Body',
      icon: FileText,
      badge: requestData.body.trim() ? bodyContentType : undefined,
    },
    {
      id: 'response' as const,
      label: 'Response',
      icon: Eye,
      badge: response
        ? response.status >= 200 && response.status < 300
          ? '✓'
          : '✗'
        : undefined,
    },
  ];

  return (
    <div className="border-b border-border/50 bg-card/30">
      <div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
