/**
 * EnvironmentCard - Card component for displaying environment information
 *
 * Features:
 * - Premium design with animated gradients on hover (theme aware, matches CollectionCard)
 * - Environment details display
 * - Action menu with edit/delete/duplicate options
 * - Variable count and last used information
 * - Default environment indicator
 * - Test connection functionality
 * - Clickable card to edit
 */

import { Check, Copy, Edit, Globe, Layers, Terminal, TestTube, Trash2 } from 'lucide-react';
import React from 'react';
import { Environment } from '../../types/entities';
import { ActionMenu } from '../shared/ActionMenu';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export interface EnvironmentCardProps {
  environment: Environment;
  isCurrent?: boolean;
  isTesting?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  onTest?: () => void;
}

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  environment,
  isCurrent = false,
  isTesting = false,
  onEdit,
  onDelete,
  onDuplicate,
  onSetDefault,
  onTest,
}) => {
  const actions = [
    { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: onEdit },
    {
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      onClick: onDuplicate,
    },
    { type: 'separator' as const },
    {
      label: 'Set as Default',
      icon: <Check className="h-4 w-4" />,
      onClick: onSetDefault,
    },
    ...(onTest
      ? [
          {
            label: 'Test Connection',
            icon: <TestTube className="h-4 w-4" />,
            onClick: onTest,
          },
        ]
      : []),
    { type: 'separator' as const },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      destructive: true,
    },
  ];

  const variableCount = Object.keys(environment.variables || {}).length;
  const variableKeys = Object.keys(environment.variables || {})
    .filter(key => key !== 'base_url')
    .slice(0, 3);

  return (
    <div
      onClick={onEdit}
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 cursor-pointer ${
        isCurrent
          ? 'border-primary shadow-md bg-primary/5'
          : 'border-border hover:shadow-lg hover:-translate-y-1 hover:border-primary/50'
      }`}
    >
      {/* Background animated gradient */}
      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
        isCurrent
          ? 'bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-100'
          : 'bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100'
      }`} />

      {/* Top Section — icon + title stacked on the left, action buttons isolated on the right */}
      <div className="relative z-10 flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
          isCurrent
            ? 'bg-primary/20 text-primary border-primary/30'
            : 'bg-primary/10 text-primary border-primary/20'
        }`}>
          <Globe className="h-5 w-5" />
        </div>

        {/* Title + subtitle — this must truncate, not fight with buttons */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className={`text-base font-semibold tracking-tight truncate transition-colors ${
            isCurrent ? 'text-primary' : 'text-card-foreground group-hover:text-primary'
          }`}>
            {environment.displayName}
          </h3>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {environment.name}
          </p>
        </div>

        {/* Action buttons — completely flex-shrink-0, won't compress the title */}
        <div
          className="flex-shrink-0 flex items-center gap-1 bg-muted/30 rounded-lg border border-border p-0.5 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {onTest && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onTest}
              disabled={isTesting}
              className="h-8 w-8 hover:bg-muted transition-all rounded-md text-muted-foreground hover:text-primary"
              title="Test Connection"
            >
              {isTesting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
            </Button>
          )}
          {onTest && <div className="h-4 w-px bg-border" />}
          <ActionMenu actions={actions} />
        </div>
      </div>

      {/* Badges row — separate from title row so no overlap */}
      {(environment.isDefault || isCurrent) && (
        <div className="relative z-10 flex items-center gap-1.5 -mt-2">
          {environment.isDefault && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-widest shadow-sm">
              Default
            </Badge>
          )}
          {isCurrent && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-widest">
              Active
            </Badge>
          )}
        </div>
      )}

      {/* Bottom Section */}
      <div className="relative z-10 space-y-3 pt-3 border-t border-border">
        {environment.variables?.base_url && (
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div className="text-xs truncate font-mono text-muted-foreground min-w-0">
              <span className="uppercase mr-1">URL:</span>
              {environment.variables.base_url}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
            <Layers className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">{variableCount} variable{variableCount !== 1 ? 's' : ''}</span>
          </div>

          {variableKeys.length > 0 && (
            <div className="flex items-center gap-1">
              {variableKeys.map(key => (
                <Badge key={key} variant="secondary" className="px-2 py-0 max-w-[72px] truncate text-[10px]">
                  {key}
                </Badge>
              ))}
              {variableCount - variableKeys.length - (environment.variables?.base_url ? 1 : 0) > 0 && (
                <Badge variant="outline" className="px-2 py-0 text-[10px]">
                  +{variableCount - variableKeys.length - (environment.variables?.base_url ? 1 : 0)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

