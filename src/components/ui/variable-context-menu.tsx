import { Root as Portal } from '@radix-ui/react-portal';
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
    <Portal>
      <div
        ref={ref}
        className="fixed z-[9999] w-64 rounded-2xl border border-border/40 bg-popover/90 backdrop-blur-xl p-2 shadow-2xl shadow-black/20 dark:shadow-black/40 animate-in fade-in zoom-in-95 duration-200"
        style={{ left: position.x, top: position.y }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-3 py-2 mb-2 border-b border-border/20 bg-muted/30 -mx-2 -mt-2 rounded-t-2xl flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Eye className="h-3 w-3 text-muted-foreground/60" />
             <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Variable Info</p>
           </div>
           {variable?.scope && (
             <div className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-tighter">
               {variable.scope}
             </div>
           )}
        </div>
        
        <div className="px-3 py-2 mb-2 bg-background/50 rounded-xl border border-border/20">
          <p className="text-xs font-mono font-bold truncate text-foreground">{`{{${variableName}}}`}</p>
          <p className="text-[10px] font-mono text-muted-foreground truncate mt-1 opacity-70">
            {variable?.value || 'Unresolved or dynamic'}
          </p>
        </div>

        <div className="space-y-1">
          <button
            onClick={handleCopyName}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary group"
          >
            <Copy className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            Copy Name
          </button>
          
          {isResolved && !isDynamic && (
            <button
              onClick={handleCopyValue}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary group"
            >
              <Copy className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              Copy Value
            </button>
          )}

          <div className="h-px bg-border/20 my-1 mx-1" />
          
          <button
            onClick={handleViewDefinition}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary group"
          >
            <Eye className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            View Definition
          </button>
          
          {!isDynamic && (
            <button
              onClick={handleEdit}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary group"
            >
              <Edit className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              Edit Source
            </button>
          )}
        </div>
      </div>
    </Portal>
  );
});

VariableContextMenu.displayName = 'VariableContextMenu';
