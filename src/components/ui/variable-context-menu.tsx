import { Copy, Edit, Eye } from 'lucide-react';
import { forwardRef } from 'react';
import { useVariableResolution } from '../../hooks/useVariableResolution';
import { useStore } from '../../store/useStore';

interface VariableContextMenuProps {
  variableName: string;
  position: { x: number; y: number };
  onClose: () => void;
  onViewDefinition?: (variableName: string) => void;
}

export const VariableContextMenu = forwardRef<
  HTMLDivElement,
  VariableContextMenuProps
>(({ variableName, position, onClose, onViewDefinition }, ref) => {
  const { variables } = useVariableResolution(`{{${variableName}}}`);
  const variable = variables.find(v => v.name === variableName);
  const isResolved = variable?.value !== '';
  const isDynamic = variableName.startsWith('$');
  const {
    setCurrentPage,
    selectedRequest,
    collections,
    setCollectionToEditId,
    environments,
    setEnvironmentToEdit,
  } = useStore();

  const handleCopyName = () => {
    navigator.clipboard.writeText(`{{${variableName}}}`);
    onClose();
  };

  const handleCopyValue = () => {
    if (variable?.value) {
      navigator.clipboard.writeText(variable.value);
      onClose();
    }
  };

  const handleViewDefinition = () => {
    onClose(); // Close context menu first
    // Use setTimeout to ensure context menu closes before dialog opens
    if (onViewDefinition) {
      setTimeout(() => {
        onViewDefinition(variableName);
      }, 100);
    }
  };

  const handleEdit = () => {
    console.log(
      '[VariableContextMenu] handleEdit called for variable:',
      variableName
    );
    console.log('[VariableContextMenu] Variable scope:', variable?.scope);
    console.log('[VariableContextMenu] Selected request:', selectedRequest);
    console.log(
      '[VariableContextMenu] Available environments count:',
      environments.length
    );
    console.log(
      '[VariableContextMenu] Available collections count:',
      collections.length
    );

    onClose(); // Close context menu first

    // Navigate to appropriate page based on variable scope
    // Check if variable is from collection scope AND we have a collection ID
    if (variable?.scope === 'collection' && selectedRequest?.collectionId) {
      // For collection variables, navigate to Collections page and trigger edit dialog
      const collection = collections.find(
        c => c.id === selectedRequest.collectionId
      );
      if (collection) {
        // Set the collection ID to trigger edit dialog
        console.log(
          '[VariableContextMenu] Editing collection variable, opening collection:',
          collection.id
        );
        setCollectionToEditId(collection.id!);
        setCurrentPage('collections');
        return;
      } else {
        console.log(
          '[VariableContextMenu] Collection not found for ID:',
          selectedRequest.collectionId
        );
      }
    }

    // For global variables, find the environment that contains this variable
    console.log(
      '[VariableContextMenu] Searching for global variable in environments...'
    );
    let environmentToOpen: { id: number; name: string } | null = null;

    // Check if variable exists in any environment
    console.log(
      '[VariableContextMenu] Checking',
      environments.length,
      'environments for variable:',
      variableName
    );
    for (const env of environments) {
      console.log(
        '[VariableContextMenu] Checking environment:',
        env.name,
        'ID:',
        env.id,
        'Variables:',
        Object.keys(env.variables || {})
      );
      if (env.variables && variableName in env.variables) {
        environmentToOpen = { id: env.id!, name: env.name };
        console.log(
          '[VariableContextMenu] Found variable in environment:',
          env.name,
          'ID:',
          env.id
        );
        break;
      }
    }

    if (environmentToOpen) {
      // Set the environment ID and variable name to trigger edit dialog
      console.log(
        '[VariableContextMenu] Setting environmentToEditId to:',
        environmentToOpen.id,
        'for variable:',
        variableName
      );
      setEnvironmentToEdit(environmentToOpen.id, variableName);
      console.log('[VariableContextMenu] Navigating to environments page');
      setCurrentPage('environments');
    } else {
      // Variable not found in any environment, just navigate to environments page
      console.log(
        '[VariableContextMenu] Variable not found in any environment, navigating to environments'
      );
      setCurrentPage('environments');
    }
  };

  return (
    <>
      <div
        ref={ref}
        className="fixed z-context-menu w-56 rounded-md border bg-popover p-1 shadow-lg"
        style={{ left: position.x, top: position.y }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleCopyName}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
        >
          <Copy className="h-4 w-4" />
          Copy Variable Name
        </button>
        {isResolved && !isDynamic && (
          <button
            onClick={handleCopyValue}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <Copy className="h-4 w-4" />
            Copy Value
          </button>
        )}
        <div className="h-px bg-border my-1" />
        <button
          onClick={handleViewDefinition}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
        >
          <Eye className="h-4 w-4" />
          View Definition
        </button>
        {!isDynamic && (
          <button
            onClick={handleEdit}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <Edit className="h-4 w-4" />
            Edit Variable
          </button>
        )}
      </div>
    </>
  );
});

VariableContextMenu.displayName = 'VariableContextMenu';
