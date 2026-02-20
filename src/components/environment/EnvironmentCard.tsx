/**
 * EnvironmentCard - Card component for displaying environment information
 *
 * Features:
 * - Environment details display
 * - Action menu with edit/delete/duplicate options
 * - Variable count and last used information
 * - Default environment indicator
 * - Test connection functionality
 *
 * @example
 * ```tsx
 * <EnvironmentCard
 *   environment={environment}
 *   isCurrent={isCurrent}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onDuplicate={handleDuplicate}
 *   onSetDefault={handleSetDefault}
 *   onTest={handleTest}
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Globe, Check, Edit, Trash2, Copy, TestTube } from 'lucide-react';
import { ActionMenu } from '../shared/ActionMenu';
import { Environment } from '../../types/entities';

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
    <Card
      className={`hover:shadow-md transition-shadow ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
    >
      <CardContent className="p-4">
        {/* Header: Title with badges inline */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold truncate">
                {environment.displayName}
              </h3>
              {environment.isDefault && (
                <Badge variant="default" className="text-xs flex-shrink-0">
                  Default
                </Badge>
              )}
              {isCurrent && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  Current
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {environment.name}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onTest && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTest}
                disabled={isTesting}
                className="h-8 w-8 p-0"
              >
                {isTesting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
            )}
            <ActionMenu actions={actions} />
          </div>
        </div>

        {/* Variables Focus */}
        <div className="space-y-2">
          {environment.variables?.base_url && (
            <div className="text-sm truncate text-muted-foreground">
              <span className="font-medium">URL:</span>{' '}
              {environment.variables.base_url}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-medium">
                {variableCount} variables
              </span>
              {variableKeys.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {variableKeys.map(key => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="text-xs font-mono"
                    >
                      {key}
                    </Badge>
                  ))}
                  {variableCount - variableKeys.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +
                      {variableCount -
                        variableKeys.length -
                        (environment.variables?.base_url ? 1 : 0)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
