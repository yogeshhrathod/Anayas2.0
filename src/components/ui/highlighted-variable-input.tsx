import { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { VariableAutocomplete } from './variable-autocomplete';
import { VariableContextMenu } from './variable-context-menu';
import { useAvailableVariables } from '../../hooks/useVariableResolution';
import { cn } from '../../lib/utils';

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
  const [highlights, setHighlights] = useState<VariableHighlight[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuVariable, setContextMenuVariable] = useState<string>('');
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const variables = useAvailableVariables();

  // Detect variables in text and create highlights
  useEffect(() => {
    const VARIABLE_REGEX = /\{\{[\w.]+\}\}/g;
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

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + 4,
        left: rect.left
      };
    }
    return { top: 0, left: 0 };
  };

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
        setSearchTerm(afterBraces);
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleAutocompleteSelect = (variableName: string) => {
    // Find the last {{ position
    const lastBraces = value.lastIndexOf('{{');
    if (lastBraces === -1) return;

    const beforeBraces = value.substring(0, lastBraces);
    const afterCurrentVar = value.substring(lastBraces + 2 + searchTerm.length);
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

  // Close autocomplete on escape or click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        setShowContextMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
        setShowContextMenu(false);
      }
    };

    if (showAutocomplete || showContextMenu) {
      window.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        window.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAutocomplete, showContextMenu]);

  const position = updateDropdownPosition();

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
          position={position}
        />
      )}
      {showContextMenu && (
        <VariableContextMenu
          variableName={contextMenuVariable}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
}

