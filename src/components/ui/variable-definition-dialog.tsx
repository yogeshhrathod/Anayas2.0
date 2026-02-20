/**
 * VariableDefinitionDialog - Dialog for viewing variable definition details
 *
 * Shows variable name, value, scope (global/collection/dynamic), and environment info
 */

import { Dialog } from './dialog';
import { Badge } from './badge';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useVariableResolution } from '../../hooks/useVariableResolution';

interface VariableDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variableName: string;
}

export function VariableDefinitionDialog({
  open,
  onOpenChange,
  variableName,
}: VariableDefinitionDialogProps) {
  // Hooks must be called unconditionally - before any early returns
  const { variables } = useVariableResolution(
    variableName ? `{{${variableName}}}` : ''
  );
  const variable = variableName
    ? variables.find(v => v.name === variableName)
    : undefined;
  const [copied, setCopied] = useState(false);

  // Don't render if dialog is closed or no variable name
  if (!open || !variableName) {
    return null;
  }

  // Show dialog even if variable not found - display as unresolved
  const displayVariable = variable || {
    name: variableName,
    value: '',
    scope: 'global' as const,
    originalText: `{{${variableName}}}`,
  };

  const handleCopyValue = async () => {
    if (displayVariable.value) {
      await navigator.clipboard.writeText(displayVariable.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getScopeLabel = () => {
    switch (displayVariable.scope) {
      case 'global':
        return 'Global Environment';
      case 'collection':
        return 'Collection Environment';
      case 'dynamic':
        return 'Dynamic Variable';
      default:
        return 'Unknown';
    }
  };

  const getScopeColor = () => {
    switch (displayVariable.scope) {
      case 'global':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'collection':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'dynamic':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Variable Definition"
      description={
        <span>
          View details for the variable{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{`{{${variableName}}}`}</code>
        </span>
      }
      maxWidth="md"
    >
      <div className="space-y-4 py-4">
        {/* Variable Name */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Variable Name
          </label>
          <div className="mt-1 p-2 bg-muted rounded-md font-mono text-sm">
            {variableName}
          </div>
        </div>

        {/* Scope */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Scope
          </label>
          <div className="mt-1">
            <Badge className={getScopeColor()}>{getScopeLabel()}</Badge>
          </div>
        </div>

        {/* Value */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-muted-foreground">
              Value
            </label>
            {displayVariable.value && (
              <button
                onClick={handleCopyValue}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
          <div className="mt-1 p-2 bg-muted rounded-md font-mono text-sm break-all">
            {displayVariable.value || (
              <span className="text-muted-foreground italic">No value set</span>
            )}
          </div>
        </div>

        {/* Dynamic Variable Info */}
        {displayVariable.scope === 'dynamic' && (
          <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-md">
            <p className="text-xs text-muted-foreground">
              Dynamic variables are system-generated and cannot be edited. They
              are resolved at request time.
            </p>
          </div>
        )}

        {/* Unresolved Variable Warning */}
        {!displayVariable.value && displayVariable.scope !== 'dynamic' && (
          <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-md">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              This variable is not defined. Please add it to your environment
              variables.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
