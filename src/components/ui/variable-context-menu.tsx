import { Copy, Eye, Edit } from 'lucide-react';
import { useVariableResolution } from '../../hooks/useVariableResolution';
import { forwardRef } from 'react';

interface VariableContextMenuProps {
  variableName: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const VariableContextMenu = forwardRef<HTMLDivElement, VariableContextMenuProps>(({
  variableName,
  position,
  onClose,
}, ref) => {
  const { variables } = useVariableResolution(`{{${variableName}}}`);
  const variable = variables.find(v => v.name === variableName);
  const isResolved = variable?.value !== '';
  const isDynamic = variableName.startsWith('$');

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
    console.log('View definition for:', variableName);
    onClose();
  };

  const handleEdit = () => {
    console.log('Edit variable:', variableName);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="fixed z-context-menu w-56 rounded-md border bg-popover p-1 shadow-lg"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
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
      <button
        onClick={handleEdit}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
      >
        <Edit className="h-4 w-4" />
        Edit Variable
      </button>
    </div>
  );
});

VariableContextMenu.displayName = 'VariableContextMenu';

