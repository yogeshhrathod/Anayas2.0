/**
 * CollectionCard - Card component for displaying collection information
 *
 * Features:
 * - Premium design with animated gradients on hover (theme aware)
 * - Collection details display
 * - Action menu with edit/delete/duplicate options
 * - Request count and last used information
 * - Favorite toggle
 * - Clickable card to edit
 */

import {
    Calendar,
    Copy,
    Download,
    Edit,
    FolderOpen,
    Layers,
    Play,
    Star,
    Trash2,
    Upload
} from 'lucide-react';
import React from 'react';
import { Collection } from '../../types/entities';
import { ActionMenu } from '../shared/ActionMenu';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

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
  onRun,
}) => {
  const actions = [
    ...(onRun
      ? [
          {
            label: 'Run Collection',
            icon: <Play className="h-4 w-4" />,
            onClick: onRun,
          },
        ]
      : []),
    { type: 'separator' as const },
    { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: onEdit },
    {
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      onClick: onDuplicate,
    },
    { type: 'separator' as const },
    ...(onExport
      ? [{ label: 'Export', icon: <Download className="h-4 w-4" />, onClick: onExport }]
      : []),
    ...(onImport
      ? [{ label: 'Import', icon: <Upload className="h-4 w-4" />, onClick: onImport }]
      : []),
    { type: 'separator' as const },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      destructive: true,
    },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      onClick={onEdit}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 cursor-pointer"
      data-testid="collection-card"
      data-collection-name={collection.name}
    >
      {/* Background animated gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Top Section */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1 min-w-0 flex items-start space-x-3 pr-2">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 transition-colors">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col pt-0.5 min-w-0 flex-1">
            <h3 className="text-base font-semibold text-card-foreground tracking-tight truncate group-hover:text-primary transition-colors min-w-0">
              {collection.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {collection.description || 'No description provided.'}
            </p>
          </div>
        </div>
        <div 
          className="flex items-center space-x-1 ml-2 bg-muted/30 rounded-lg border border-border p-0.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="h-8 w-8 hover:bg-muted transition-all rounded-md text-muted-foreground hover:text-yellow-500"
            aria-label={
              collection.isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
          >
            {collection.isFavorite ? (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 drop-shadow-sm" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>
          <div className="h-4 w-px bg-border mx-0.5" />
          <ActionMenu actions={actions} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="relative z-10 mt-6 space-y-4">
        {/* Environments section */}
        {collection.environments && collection.environments.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-border">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mr-1">
              Envs
            </span>
            {collection.environments.slice(0, 3).map(env => (
              <Badge key={env.id} variant="secondary" className="px-2 py-0 truncate max-w-[100px]">
                {env.name}
              </Badge>
            ))}
            {collection.environments.length > 3 && (
              <Badge variant="outline" className="px-2 py-0">
                +{collection.environments.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 group-hover:text-foreground transition-colors">
              <FolderOpen className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-medium truncate">{requestCount} requests</span>
            </div>
            <div className="flex items-center space-x-1.5 group-hover:text-foreground transition-colors">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{formatDate(collection.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

