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
    onClose(); // Close context menu first

    // Navigate to appropriate page based on variable scope
    // Check if variable is from collection scope AND we have a collection ID
    if (variable?.scope === 'collection' && selectedRequest?.collectionId) {
      // For collection variables, navigate to Collections page and trigger edit dialog
      const collection = collections.find(
        c => c.id === selectedRequest.collectionId
      );
      if (collection) {
        setCollectionToEditId(collection.id!);
        setCurrentPage('collections');
        return;
      }
    }

    // For global variables, find the environment that contains this variable
    let environmentToOpen: { id: number; name: string } | null = null;

    for (const env of environments) {
      if (env.variables && variableName in env.variables) {
        environmentToOpen = { id: env.id!, name: env.name };
        break;
      }
    }

    if (environmentToOpen) {
      setEnvironmentToEdit(environmentToOpen.id, variableName);
      setCurrentPage('environments');
    } else {
      // Variable not found in any environment, just navigate to environments page
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
