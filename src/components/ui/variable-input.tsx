import { useState, useRef } from 'react';
import { Input } from './input';
import { VariableAutocomplete } from './variable-autocomplete';
import { useAvailableVariables } from '../../hooks/useVariableResolution';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function VariableInput({
  value = '',
  onChange,
  placeholder,
  className,
  disabled = false,
}: VariableInputProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const variables = useAvailableVariables();

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
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
        updateDropdownPosition();
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

  // Close autocomplete on escape or click outside
  useClickOutside(wrapperRef, handleClose, showAutocomplete);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
      {showAutocomplete && (
        <VariableAutocomplete
          variables={variables}
          searchTerm={searchTerm}
          onSelect={handleAutocompleteSelect}
          onClose={handleClose}
          position={dropdownPosition}
        />
      )}
    </div>
  );
}
