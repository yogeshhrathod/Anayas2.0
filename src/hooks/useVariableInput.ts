/**
 * useVariableInput - Shared hook for variable input components
 * 
 * Provides common logic for:
 * - Variable detection and parsing
 * - Autocomplete trigger detection
 * - Dropdown positioning
 * - Variable selection and cursor positioning
 * - Dynamic variable support
 * 
 * @example
 * ```tsx
 * const {
 *   showAutocomplete,
 *   searchTerm,
 *   dropdownPosition,
 *   inputRef,
 *   wrapperRef,
 *   handleChange,
 *   handleAutocompleteSelect,
 *   handleClose
 * } = useVariableInput({
 *   value,
 *   onChange,
 *   enableContextMenu: true
 * });
 * ```
 */

import { useState, useRef, useCallback } from 'react';
import { useAvailableVariables } from './useVariableResolution';
import { useClickOutside } from './useClickOutside';

export interface UseVariableInputOptions {
  value: string;
  onChange: (value: string) => void;
}

export interface UseVariableInputReturn {
  // State
  showAutocomplete: boolean;
  searchTerm: string;
  showOnlyDynamic: boolean;
  dropdownPosition: { top: number; left: number };
  
  // Refs
  inputRef: React.RefObject<HTMLInputElement>;
  wrapperRef: React.RefObject<HTMLDivElement>;
  
  // Handlers
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAutocompleteSelect: (variableName: string) => void;
  handleClose: () => void;
  updateDropdownPosition: () => void;
  
  // Data
  variables: Array<{ name: string; value: string; scope: 'collection' | 'global' | 'dynamic' }>;
}

export function useVariableInput({
  value,
  onChange,
}: UseVariableInputOptions): UseVariableInputReturn {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyDynamic, setShowOnlyDynamic] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const variables = useAvailableVariables();

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check if typing after {{
    const lastBraces = newValue.lastIndexOf('{{');
    if (lastBraces !== -1) {
      const afterBraces = newValue.substring(lastBraces + 2);
      if (!afterBraces.includes('}}')) {
        // Still typing variable name
        // Check if user typed {{$ (wants dynamic variables)
        const isDynamicSearch = afterBraces.startsWith('$') && afterBraces.length === 1;
        setShowOnlyDynamic(isDynamicSearch);
        
        // Remove $ prefix from search term if present (for dynamic variables)
        const search = afterBraces.startsWith('$') ? afterBraces.substring(1) : afterBraces;
        setSearchTerm(search);
        updateDropdownPosition();
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
        setShowOnlyDynamic(false);
      }
    } else {
      setShowAutocomplete(false);
      setShowOnlyDynamic(false);
    }
  }, [onChange, updateDropdownPosition]);

  const handleAutocompleteSelect = useCallback((variableName: string) => {
    if (!inputRef.current) return;
    
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
  }, [value, onChange]);

  const handleClose = useCallback(() => {
    setShowAutocomplete(false);
  }, []);

  // Close autocomplete on escape or click outside
  useClickOutside(wrapperRef, handleClose, showAutocomplete);

  return {
    showAutocomplete,
    searchTerm,
    showOnlyDynamic,
    dropdownPosition,
    inputRef,
    wrapperRef,
    handleChange,
    handleAutocompleteSelect,
    handleClose,
    updateDropdownPosition,
    variables,
  };
}

