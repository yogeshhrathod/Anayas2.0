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

import { Loader2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { CollectionActions } from '../components/collection/CollectionActions';
import { EnvironmentForm } from '../components/environment/EnvironmentForm';
import { EnvironmentGrid } from '../components/environment/EnvironmentGrid';
import { PageLayout } from '../components/shared/PageLayout';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { useConfirmation } from '../hooks/useConfirmation';
import { useEnvironmentOperations } from '../hooks/useEnvironmentOperations';
import { useStore } from '../store/useStore';
import { Environment } from '../types/entities';
import { EnvironmentFormData } from '../types/forms';

// Lazy load import/export dialogs
const EnvironmentImportDialog = lazy(() =>
  import('../components/environment/EnvironmentImportDialog').then(m => ({
    default: m.EnvironmentImportDialog,
  }))
);
const EnvironmentExportDialog = lazy(() =>
  import('../components/environment/EnvironmentExportDialog').then(m => ({
    default: m.EnvironmentExportDialog,
  }))
);

export function Environments() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const formRef = useRef<React.ElementRef<typeof EnvironmentForm>>(null);

  const {
    currentEnvironment,
    setCurrentEnvironment,
    environmentToEditId,
    variableToFocus,
    setEnvironmentToEdit,
    environments: storeEnvironments,
  } = useStore();

  const {
    environments,
    allEnvironments,
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
    refreshEnvironments,
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
      message: `Are you sure you want to delete "${environment.displayName}"? This action cannot be undone.`,
    });

    if (confirmed) {
      await deleteEnvironment(environment.id!);

      // If we deleted the current environment, set the first available one
      if (currentEnvironment?.id === environment.id) {
        const remainingEnvs = environments.filter(
          env => env.id !== environment.id
        );
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
    setIsExportDialogOpen(true);
  };

  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  const handleImportSuccess = () => {
    refreshEnvironments();
  };

  // Log dialog state changes
  useEffect(() => {
    console.log(
      '[Environments] Dialog state changed - isEditing:',
      isEditing,
      'editingEnvironment:',
      editingEnvironment?.id
    );
  }, [isEditing, editingEnvironment]);

  // Watch for environmentToEditId from store (triggered from variable context menu)
  useEffect(() => {
    console.log(
      '[Environments] useEffect triggered - environmentToEditId:',
      environmentToEditId
    );
    console.log(
      '[Environments] allEnvironments count:',
      allEnvironments.length
    );
    console.log(
      '[Environments] storeEnvironments count:',
      storeEnvironments.length
    );
    console.log('[Environments] isLoading:', isLoading);
    console.log('[Environments] variableToFocus:', variableToFocus);
    console.log('[Environments] Current isEditing state:', isEditing);
    console.log(
      '[Environments] Current editingEnvironment:',
      editingEnvironment?.id
    );

    if (environmentToEditId) {
      console.log(
        '[Environments] Looking for environment with ID:',
        environmentToEditId
      );

      // Try allEnvironments first (from hook), then fallback to store environments
      let environment = allEnvironments.find(
        env => env.id === environmentToEditId
      );

      if (!environment && storeEnvironments.length > 0) {
        // If not found and store has environments, try store environments
        console.log(
          '[Environments] Not found in allEnvironments, checking store environments:',
          storeEnvironments.length
        );
        environment = storeEnvironments.find(
          env => env.id === environmentToEditId
        );
      }

      if (environment) {
        console.log(
          '[Environments] ✓ Found environment:',
          environment.name,
          'ID:',
          environment.id
        );
        console.log(
          '[Environments] Opening edit dialog with variable focus:',
          variableToFocus
        );
        console.log(
          '[Environments] Setting editingEnvironment and isEditing to true'
        );
        setEditingEnvironment(environment);
        setIsEditing(true);
        console.log(
          '[Environments] ✓ Dialog state set - isEditing should be true now'
        );
        // Clear the trigger after opening
        setTimeout(() => {
          console.log('[Environments] Clearing environmentToEditId trigger');
          setEnvironmentToEdit(null, null);
        }, 100);
      } else {
        // Environment not found, clear the trigger
        console.log(
          '[Environments] ✗ Environment not found with ID:',
          environmentToEditId
        );
        if (isLoading) {
          console.log(
            '[Environments] Still loading, will retry when environments are loaded'
          );
        } else {
          console.log(
            '[Environments] Clearing environmentToEditId trigger (not found)'
          );
          setEnvironmentToEdit(null, null);
        }
      }
    }
  }, [
    environmentToEditId,
    allEnvironments,
    storeEnvironments,
    isLoading,
    variableToFocus,
    setEnvironmentToEdit,
    isEditing,
    editingEnvironment,
  ]);

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
        onOpenChange={open => {
          console.log('[Environments] Dialog onOpenChange called with:', open);
          if (!open) {
            handleCancelEdit();
          } else {
            setIsEditing(true);
          }
        }}
        title={editingEnvironment ? 'Edit Environment' : 'New Environment'}
        description={
          editingEnvironment
            ? 'Update environment details and variables'
            : 'Create a new environment with variables'
        }
        maxWidth="2xl"
      >
        <EnvironmentForm
          ref={formRef}
          environment={editingEnvironment}
          onSave={handleSaveEnvironment}
          onCancel={handleCancelEdit}
          isLoading={isSaving}
        />
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={handleCancelEdit}
            disabled={isSaving}
          >
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

      {/* Import Dialog */}
      <Suspense fallback={null}>
        <EnvironmentImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onSuccess={handleImportSuccess}
        />
      </Suspense>

      {/* Export Dialog */}
      <Suspense fallback={null}>
        <EnvironmentExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          environments={allEnvironments}
        />
      </Suspense>
    </PageLayout>
  );
}
