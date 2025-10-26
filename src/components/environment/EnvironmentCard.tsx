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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
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
  onTest
}) => {
  const actions = [
    { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: onEdit },
    { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: onDuplicate },
    { type: 'separator' as const },
    { label: 'Set as Default', icon: <Check className="h-4 w-4" />, onClick: onSetDefault },
    ...(onTest ? [{ label: 'Test Connection', icon: <TestTube className="h-4 w-4" />, onClick: onTest }] : []),
    { type: 'separator' as const },
    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: onDelete, destructive: true }
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const variableCount = Object.keys(environment.variables || {}).length;

  return (
    <Card className={`hover:shadow-md transition-shadow ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg font-semibold truncate">
                {environment.display_name}
              </CardTitle>
              {environment.is_default === 1 && (
                <Badge variant="default" className="text-xs">
                  Default
                </Badge>
              )}
              {isCurrent && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              {environment.name}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {onTest && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTest}
                disabled={isTesting}
                className="p-1 h-8 w-8"
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
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Globe className="h-4 w-4" />
                <span>{variableCount} variables</span>
              </div>
              {environment.variables?.base_url && (
                <div className="flex items-center space-x-1">
                  <span className="truncate max-w-32">
                    {environment.variables.base_url}
                  </span>
                </div>
              )}
            </div>
          </div>

          {variableCount > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Variables
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.keys(environment.variables || {})
                  .filter(key => key !== 'base_url')
                  .slice(0, 3)
                  .map((key) => (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {key}
                    </Badge>
                  ))}
                {Object.keys(environment.variables || {}).filter(key => key !== 'base_url').length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{Object.keys(environment.variables || {}).filter(key => key !== 'base_url').length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {environment.last_used && (
            <div className="text-xs text-muted-foreground">
              Last used: {formatDate(environment.last_used)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
