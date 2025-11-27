import { useState, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { Check, Building2, Globe, Sparkles } from 'lucide-react';

export interface AutocompletePosition {
  top: number;
  left: number;
}

interface VariableAutocompleteProps {
  variables: Array<{
    name: string;
    value: string;
    scope: 'collection' | 'global' | 'dynamic';
  }>;
  onSelect: (variableName: string) => void;
  onClose: () => void;
  position: AutocompletePosition;
  searchTerm?: string;
  showOnlyDynamic?: boolean; // When true, show only dynamic variables
}

export function VariableAutocomplete({
  variables,
  searchTerm = '',
  onSelect,
  onClose,
  position,
  showOnlyDynamic = false,
}: VariableAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter variables based on search term
  // If showOnlyDynamic is true, show only dynamic variables
  const filteredVariables = useMemo(() => {
    if (showOnlyDynamic) {
      return variables.filter(v => v.scope === 'dynamic');
    }
    if (searchTerm && searchTerm.length > 0) {
      const searchLower = searchTerm.toLowerCase();
      return variables.filter(v => {
        const nameLower = v.name.toLowerCase();
        // Allow searching without $ prefix for dynamic variables
        if (v.scope === 'dynamic' && nameLower.startsWith('$')) {
          return (
            nameLower.includes(searchLower) ||
            nameLower.slice(1).includes(searchLower)
          );
        }
        return nameLower.includes(searchLower);
      });
    }
    return variables;
  }, [variables, showOnlyDynamic, searchTerm]);

  // Group variables by scope
  const groupedVariables = useMemo(
    () => ({
      dynamic: filteredVariables.filter(v => v.scope === 'dynamic'),
      collection: filteredVariables.filter(v => v.scope === 'collection'),
      global: filteredVariables.filter(v => v.scope === 'global'),
    }),
    [filteredVariables]
  );

  const allVariables = useMemo(
    () => [
      ...groupedVariables.collection,
      ...groupedVariables.global,
      ...groupedVariables.dynamic,
    ],
    [groupedVariables]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, allVariables.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allVariables[selectedIndex]) {
            onSelect(allVariables[selectedIndex].name);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allVariables, selectedIndex, onSelect, onClose]);

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredVariables.length]);

  const handleSelect = (variableName: string) => {
    onSelect(variableName);
  };

  if (allVariables.length === 0) {
    return (
      <div
        className="fixed z-popover w-80 rounded-md border bg-popover p-2 shadow-lg"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No variables found
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-popover w-80 rounded-md border bg-popover shadow-lg overflow-hidden"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="max-h-96 overflow-auto">
        {groupedVariables.collection.length > 0 && (
          <div className="sticky top-0 bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
            <Building2 className="inline-block h-3 w-3 mr-1" />
            Collection Variables
          </div>
        )}
        {groupedVariables.collection.map((variable, index) => {
          const isSelected = selectedIndex === index;
          return (
            <button
              key={`collection-${variable.name}`}
              onClick={() => handleSelect(variable.name)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent',
                'text-left',
                isSelected && 'bg-accent'
              )}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <div className="font-medium">{variable.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {variable.value}
                  </div>
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}

        {groupedVariables.global.length > 0 && (
          <div className="sticky top-0 bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
            <Globe className="inline-block h-3 w-3 mr-1" />
            Global Variables
          </div>
        )}
        {groupedVariables.global.map((variable, index) => {
          const globalIndex = groupedVariables.collection.length + index;
          const isSelected = selectedIndex === globalIndex;
          return (
            <button
              key={`global-${variable.name}`}
              onClick={() => handleSelect(variable.name)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent',
                'text-left',
                isSelected && 'bg-accent'
              )}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <div className="font-medium">{variable.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {variable.value}
                  </div>
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}

        {groupedVariables.dynamic.length > 0 && (
          <div className="sticky top-0 bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase border-t border-border mt-1">
            <Sparkles className="inline-block h-3 w-3 mr-1" />
            Dynamic Variables
          </div>
        )}
        {groupedVariables.dynamic.map((variable, index) => {
          const dynamicIndex =
            groupedVariables.collection.length +
            groupedVariables.global.length +
            index;
          const isSelected = selectedIndex === dynamicIndex;
          return (
            <button
              key={`dynamic-${variable.name}`}
              onClick={() => handleSelect(variable.name)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent',
                'text-left',
                isSelected && 'bg-accent'
              )}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div>
                  <div className="font-medium">{variable.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    Preview: {variable.value || 'Generated at runtime'}
                  </div>
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
