/**
 * CollectionEnvironmentManager - Component for managing collection environments
 *
 * Features:
 * - List collection environments
 * - Add new environments (via Dialog)
 * - Edit existing environments (via Dialog)
 * - Delete environments
 * - Switch active environment
 *
 * @example
 * ```tsx
 * <CollectionEnvironmentManager
 *   collectionId={collection.id}
 *   environments={collection.environments || []}
 *   activeEnvironmentId={collection.activeEnvironmentId}
 *   onEnvironmentsChange={handleEnvironmentsChange}
 * />
 * ```
 */

import { Building2, Check, Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import {
    CollectionEnvironmentFormData,
    useCollectionEnvironmentOperations,
} from '../../hooks/useCollectionEnvironmentOperations';
import { useConfirmation } from '../../hooks/useConfirmation';
import { cn } from '../../lib/utils';
import { Collection, CollectionEnvironment } from '../../types/entities';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import {
    CollectionEnvironmentForm,
    CollectionEnvironmentFormRef,
} from './CollectionEnvironmentForm';

export interface CollectionEnvironmentManagerProps {
  collectionId: number;
  environments: CollectionEnvironment[];
  activeEnvironmentId?: number;
  onEnvironmentsChange: () => void;
}

export function CollectionEnvironmentManager({
  collectionId,
  environments,
  activeEnvironmentId,
  onEnvironmentsChange,
}: CollectionEnvironmentManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] =
    useState<CollectionEnvironment | null>(null);
  const formRef = React.useRef<CollectionEnvironmentFormRef>(null);
  const { confirm } = useConfirmation();

  const handleCollectionUpdate = useCallback(
    (_updatedCollection: Collection) => {
      // Refresh parent component
      onEnvironmentsChange();
    },
    [onEnvironmentsChange]
  );

  const {
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    isLoading,
    deletingId,
  } = useCollectionEnvironmentOperations(collectionId, handleCollectionUpdate);

  const handleNewEnvironment = useCallback(() => {
    setEditingEnvironment(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditEnvironment = useCallback((env: CollectionEnvironment) => {
    setEditingEnvironment(env);
    setIsDialogOpen(true);
  }, []);

  const handleSaveEnvironment = useCallback(
    async (data: CollectionEnvironmentFormData) => {
      try {
        if (editingEnvironment?.id) {
          await updateEnvironment(editingEnvironment.id, data);
        } else {
          await createEnvironment(data);
        }
        setIsDialogOpen(false);
        setEditingEnvironment(null);
      } catch (error) {
        // Error handling is done in the hook
      }
    },
    [editingEnvironment, updateEnvironment, createEnvironment]
  );

  const handleCancelEdit = useCallback(() => {
    setIsDialogOpen(false);
    setEditingEnvironment(null);
  }, []);

  const handleDeleteClick = useCallback(
    async (environment: CollectionEnvironment) => {
      if (!environment.id) return;

      const confirmed = await confirm({
        title: 'Delete Environment',
        message: `Are you sure you want to delete "${environment.name}"? This action cannot be undone.`,
      });

      if (confirmed) {
        await deleteEnvironment(environment.id);
      }
    },
    [confirm, deleteEnvironment]
  );

  const handleSetActiveClick = useCallback(
    (environmentId: number) => {
      setActiveEnvironment(environmentId);
    },
    [setActiveEnvironment]
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Collection Environments</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage environments specific to this collection
            </p>
          </div>
          <Button
            onClick={handleNewEnvironment}
            size="sm"
            type="button"
            className="h-8 gap-1.5 text-xs font-medium px-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-none rounded-lg"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Environment
          </Button>
        </div>

        {environments.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border/50 bg-muted/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">No environments yet</p>
            <p className="text-xs text-muted-foreground/70 mb-4">Add one to manage variables for this collection</p>
            <Button
              onClick={handleNewEnvironment}
              variant="outline"
              size="sm"
              type="button"
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Environment
            </Button>
          </div>
        ) : (
          /* Environment List */
          <div className="space-y-2">
            {environments.map(env => {
              const varCount = Object.keys(env.variables || {}).length;
              const isActive = activeEnvironmentId === env.id;
              return (
                <div
                  key={env.id}
                  className={cn(
                    'group flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200',
                    isActive
                      ? 'border-primary/30 bg-primary/5 shadow-sm'
                      : 'border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Color dot */}
                    <div className={cn(
                      'h-2 w-2 flex-shrink-0 rounded-full',
                      isActive ? 'bg-primary shadow-[0_0_6px_currentColor] text-primary' : 'bg-muted-foreground/40'
                    )} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium truncate', isActive ? 'text-primary' : 'text-foreground')}>
                          {env.name}
                        </span>
                        {isActive && (
                          <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary tracking-wide uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {varCount} variable{varCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {!isActive && env.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetActiveClick(env.id!)}
                        title="Set as active"
                        type="button"
                        disabled={isLoading}
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditEnvironment(env)}
                      title="Edit environment"
                      type="button"
                      disabled={isLoading}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(env)}
                      title="Delete environment"
                      type="button"
                      disabled={isLoading || deletingId === env.id}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === env.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {/* Always-visible active checkmark if active */}
                  {isActive && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="h-5 w-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingEnvironment ? 'Edit Environment' : 'New Environment'}
        description={
          editingEnvironment
            ? 'Update environment details and variables'
            : 'Create a new collection environment'
        }
        maxWidth="2xl"
      >
        <div className="py-4">
          <CollectionEnvironmentForm
            ref={formRef}
            environment={editingEnvironment}
            onSave={handleSaveEnvironment}
            onCancel={handleCancelEdit}
            isLoading={isLoading}
            showActions={false}
          />
        </div>
        <div className="flex justify-end gap-3 pt-6 pb-2 border-t mt-2">
          <Button
            variant="ghost"
            onClick={handleCancelEdit}
            disabled={isLoading}
            type="button"
            className="hover:bg-muted text-muted-foreground transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={() => formRef.current?.submit()}
            disabled={isLoading}
            type="button"
            className="min-w-[170px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 hover:-translate-y-[1px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : editingEnvironment ? (
              'Update Environment'
            ) : (
              'Create Environment'
            )}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
