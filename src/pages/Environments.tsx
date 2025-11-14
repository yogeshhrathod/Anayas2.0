/**
 * Environments - Refactored Environments page using smaller components
 * 
 * Features:
 * - Environment management (CRUD operations)
 * - Search and filtering
 * - Import/Export functionality
 * - Test connection functionality
 * - Default environment management
 * 
 * @example
 * ```tsx
 * <Environments />
 * ```
 */

import { useState, useRef } from 'react';
import { PageLayout } from '../components/shared/PageLayout';
import { Dialog } from '../components/ui/dialog';
import { EnvironmentForm } from '../components/environment/EnvironmentForm';
import { EnvironmentGrid } from '../components/environment/EnvironmentGrid';
import { CollectionActions } from '../components/collection/CollectionActions';
import { useEnvironmentOperations } from '../hooks/useEnvironmentOperations';
import { useConfirmation } from '../hooks/useConfirmation';
import { useStore } from '../store/useStore';
import { Environment } from '../types/entities';
import { EnvironmentFormData } from '../types/forms';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';

export function Environments() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<React.ElementRef<typeof EnvironmentForm>>(null);

  const { currentEnvironment, setCurrentEnvironment } = useStore();

  const {
    environments,
    isLoading,
    searchTerm,
    setSearchTerm,
    testingEnvironmentId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    duplicateEnvironment,
    setDefaultEnvironment,
    testEnvironment,
    exportEnvironments,
    importEnvironments
  } = useEnvironmentOperations();

  const { confirm } = useConfirmation();

  const handleNewEnvironment = () => {
    setEditingEnvironment(null);
    setIsEditing(true);
  };

  const handleEditEnvironment = (environment: Environment) => {
    setEditingEnvironment(environment);
    setIsEditing(true);
  };

  const handleSaveEnvironment = async (data: EnvironmentFormData) => {
    try {
      setIsSaving(true);
      
      if (editingEnvironment?.id) {
        await updateEnvironment(editingEnvironment.id, data);
      } else {
        await createEnvironment(data);
      }
      
      setIsEditing(false);
      setEditingEnvironment(null);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingEnvironment(null);
  };

  const handleDeleteEnvironment = async (environment: Environment) => {
    const confirmed = await confirm({
      title: 'Delete Environment',
      message: `Are you sure you want to delete "${environment.displayName}"? This action cannot be undone.`
    });

    if (confirmed) {
      await deleteEnvironment(environment.id!);
      
      // If we deleted the current environment, set the first available one
      if (currentEnvironment?.id === environment.id) {
        const remainingEnvs = environments.filter(env => env.id !== environment.id);
        if (remainingEnvs.length > 0) {
          setCurrentEnvironment(remainingEnvs[0]);
        } else {
          setCurrentEnvironment(null);
        }
      }
    }
  };

  const handleDuplicateEnvironment = async (environment: Environment) => {
    await duplicateEnvironment(environment);
  };

  const handleSetDefaultEnvironment = async (environment: Environment) => {
    await setDefaultEnvironment(environment);
  };

  const handleTestEnvironment = async (environment: Environment) => {
    await testEnvironment(environment);
  };

  const handleExport = () => {
    exportEnvironments();
  };

  const handleImport = () => {
    importEnvironments();
  };

  return (
    <PageLayout
      title="Environments"
      description="Manage API environments with variables and configurations"
    >
      <div className="space-y-6">
        <CollectionActions
          onImport={handleImport}
          onExport={handleExport}
          onSearch={setSearchTerm}
          searchValue={searchTerm}
          onNewCollection={handleNewEnvironment}
        />

        <EnvironmentGrid
          environments={environments}
          currentEnvironment={currentEnvironment}
          isLoading={isLoading}
          testingEnvironmentId={testingEnvironmentId}
          onEdit={handleEditEnvironment}
          onDelete={handleDeleteEnvironment}
          onDuplicate={handleDuplicateEnvironment}
          onSetDefault={handleSetDefaultEnvironment}
          onTest={handleTestEnvironment}
        />
      </div>

      {/* Environment Form Dialog */}
      <Dialog
        open={isEditing}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelEdit();
          } else {
            setIsEditing(true);
          }
        }}
        title={editingEnvironment ? 'Edit Environment' : 'New Environment'}
        description={editingEnvironment ? 'Update environment details and variables' : 'Create a new environment with variables'}
        maxWidth="4xl"
      >
        <EnvironmentForm
          ref={formRef}
          environment={editingEnvironment}
          onSave={handleSaveEnvironment}
          onCancel={handleCancelEdit}
          isLoading={isSaving}
        />
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => formRef.current?.submit()} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </Dialog>
    </PageLayout>
  );
}