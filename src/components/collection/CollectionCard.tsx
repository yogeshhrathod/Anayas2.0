/**
 * CollectionCard - Card component for displaying collection information
 * 
 * Features:
 * - Collection details display
 * - Action menu with edit/delete/duplicate options
 * - Request count and last used information
 * - Favorite toggle
 * 
 * @example
 * ```tsx
 * <CollectionCard
 *   collection={collection}
 *   requestCount={5}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onDuplicate={handleDuplicate}
 *   onToggleFavorite={handleToggleFavorite}
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Star, StarOff, FolderOpen, Calendar, Edit, Trash2, Copy, Play } from 'lucide-react';
import { ActionMenu } from '../shared/ActionMenu';
import { Collection } from '../../types/entities';

export interface CollectionCardProps {
  collection: Collection;
  requestCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onRun?: () => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  requestCount,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onExport,
  onImport,
  onRun
}) => {
  const actions = [
    ...(onRun ? [{ label: 'Run Collection', icon: <Play className="h-4 w-4" />, onClick: onRun }] : []),
    { type: 'separator' as const },
    { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: onEdit },
    { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: onDuplicate },
    { type: 'separator' as const },
    ...(onExport ? [{ label: 'Export', icon: <span>📤</span>, onClick: onExport }] : []),
    ...(onImport ? [{ label: 'Import', icon: <span>📥</span>, onClick: onImport }] : []),
    { type: 'separator' as const },
    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: onDelete, destructive: true }
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {collection.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {collection.description || 'No description'}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFavorite}
              className="p-1 h-8 w-8"
            >
              {collection.isFavorite ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
            <ActionMenu actions={actions} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <FolderOpen className="h-4 w-4" />
                <span>{requestCount} requests</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(collection.createdAt)}</span>
              </div>
            </div>
          </div>

          {Object.keys(collection.variables || {}).length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Environment Variables
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.keys(collection.variables || {}).slice(0, 3).map((key) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}
                  </Badge>
                ))}
                {Object.keys(collection.variables || {}).length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{Object.keys(collection.variables || {}).length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
