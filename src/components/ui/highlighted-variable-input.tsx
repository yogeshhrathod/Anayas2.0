import { useEffect, useRef, useState } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useAvailableVariables } from '../../hooks/useVariableResolution';
import { cn } from '../../lib/utils';
import { Input } from './input';
import { VariableAutocomplete } from './variable-autocomplete';
import { VariableContextMenu } from './variable-context-menu';
import { VariableDefinitionDialog } from './variable-definition-dialog';

interface VariableHighlight {
  start: number;
  end: number;
  name: string;
}

export interface HighlightedVariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function HighlightedVariableInput({
  value = '',
  onChange,
  placeholder,
  className,
  disabled = false,
}: HighlightedVariableInputProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyDynamic, setShowOnlyDynamic] = useState(false);
  const [highlights, setHighlights] = useState<VariableHighlight[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuVariable, setContextMenuVariable] = useState<string>('');
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showDefinitionDialog, setShowDefinitionDialog] = useState(false);
  const [definitionDialogVariable, setDefinitionDialogVariable] =
    useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const variables = useAvailableVariables();

  // Detect variables in text and create highlights
  useEffect(() => {
    const VARIABLE_REGEX = /\{\{(\$)?[\w.]+\}\}/g; // Allow $ for dynamic variables
    const newHighlights: VariableHighlight[] = [];
    let match: RegExpExecArray | null;

    while ((match = VARIABLE_REGEX.exec(value)) !== null) {
      newHighlights.push({
        start: match.index,
        end: match.index + match[0].length,
        name: match[0],
      });
    }

    setHighlights(newHighlights);
  }, [value]);

  // Detect when user types {{ to show autocomplete
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check if typing after {{
    const lastBraces = newValue.lastIndexOf('{{');
    if (lastBraces !== -1) {
      const afterBraces = newValue.substring(lastBraces + 2);
      if (!afterBraces.includes('}}')) {
        // Still typing variable name
        // Check if user typed {{$ (wants dynamic variables)
        const isDynamicSearch =
          afterBraces.startsWith('$') && afterBraces.length === 1;
        setShowOnlyDynamic(isDynamicSearch);

        // Remove $ prefix from search term if present (for dynamic variables)
        const search = afterBraces.startsWith('$')
          ? afterBraces.substring(1)
          : afterBraces;
        setSearchTerm(search);
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
        setShowOnlyDynamic(false);
      }
    } else {
      setShowAutocomplete(false);
      setShowOnlyDynamic(false);
    }
  };

  const handleAutocompleteSelect = (variableName: string) => {
    // Find the last {{ position
    const lastBraces = value.lastIndexOf('{{');
    if (lastBraces === -1) return;

    const beforeBraces = value.substring(0, lastBraces);
    // Calculate the actual length of what was typed after {{ (including $ if present)
    const afterBraces = value.substring(lastBraces + 2);
    const actualTypedLength = afterBraces.includes('}}')
      ? afterBraces.indexOf('}}')
      : afterBraces.length;
    const afterCurrentVar = value.substring(lastBraces + 2 + actualTypedLength);
    const newValue = beforeBraces + `{{${variableName}}}` + afterCurrentVar;

    onChange(newValue);
    setShowAutocomplete(false);

    // Focus input after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = beforeBraces.length + variableName.length + 4;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleClose = () => {
    setShowAutocomplete(false);
  };

  // Handle right-click on variables
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!inputRef.current) return;

    const selectionStart = inputRef.current.selectionStart || 0;
    const selectionEnd = inputRef.current.selectionEnd || 0;

    // Check if click is inside a variable highlight
    for (const highlight of highlights) {
      if (selectionStart >= highlight.start && selectionEnd <= highlight.end) {
        e.preventDefault();
        // Extract variable name from {{name}}
        const varName = highlight.name.replace(/[{}]/g, '');
        setContextMenuVariable(varName);
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
        return;
      }
    }
  };

  // Close autocomplete and context menu on escape or click outside
  const handleCloseAll = () => {
    setShowAutocomplete(false);
    setShowContextMenu(false);
  };

  useClickOutside(
    wrapperRef,
    handleCloseAll,
    showAutocomplete || showContextMenu
  );


  return (
    <div ref={wrapperRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onContextMenu={handleContextMenu}
        placeholder={placeholder}
        className={cn(className)}
        disabled={disabled}
      />
      {showAutocomplete && (
        <VariableAutocomplete
          variables={variables}
          searchTerm={searchTerm}
          onSelect={handleAutocompleteSelect}
          onClose={handleClose}
          showOnlyDynamic={showOnlyDynamic}
        />
      )}
      {showContextMenu && (
        <VariableContextMenu
          variableName={contextMenuVariable}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
          onViewDefinition={varName => {
            setDefinitionDialogVariable(varName);
            setShowDefinitionDialog(true);
          }}
        />
      )}
      <VariableDefinitionDialog
        open={showDefinitionDialog}
        onOpenChange={setShowDefinitionDialog}
        variableName={definitionDialogVariable}
      />
    </div>
  );
}
