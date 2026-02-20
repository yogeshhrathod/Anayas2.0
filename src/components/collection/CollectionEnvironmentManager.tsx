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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Collection Environments</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage environments specific to this collection
            </p>
          </div>
          <Button onClick={handleNewEnvironment} size="sm" type="button">
            <Plus className="h-4 w-4 mr-2" />
            Add Environment
          </Button>
        </div>

        {environments.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No environments configured
            </p>
            <Button
              onClick={handleNewEnvironment}
              variant="outline"
              size="sm"
              type="button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Environment
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {environments.map(env => (
              <div
                key={env.id}
                className={cn(
                  'flex items-center justify-between p-4 border rounded-lg',
                  activeEnvironmentId === env.id &&
                    'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{env.name}</span>
                      {activeEnvironmentId === env.id && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {Object.keys(env.variables || {}).length} variable
                      {Object.keys(env.variables || {}).length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeEnvironmentId !== env.id && env.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetActiveClick(env.id!)}
                      title="Set as active"
                      type="button"
                      disabled={isLoading}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditEnvironment(env)}
                    title="Edit environment"
                    type="button"
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(env)}
                    title="Delete environment"
                    className="text-destructive hover:text-destructive"
                    type="button"
                    disabled={isLoading || deletingId === env.id}
                  >
                    {deletingId === env.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
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
        <CollectionEnvironmentForm
          ref={formRef}
          environment={editingEnvironment}
          onSave={handleSaveEnvironment}
          onCancel={handleCancelEdit}
          isLoading={isLoading}
          showActions={false}
        />
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancelEdit}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => formRef.current?.submit()}
            disabled={isLoading}
            type="button"
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
