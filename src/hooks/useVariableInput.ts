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

import { useCallback, useRef, useState } from 'react';
import { useClickOutside } from './useClickOutside';
import { useAvailableVariables } from './useVariableResolution';

export interface UseVariableInputOptions {
  value: string;
  onChange: (value: string) => void;
}

export interface UseVariableInputReturn {
  // State
  showAutocomplete: boolean;
  searchTerm: string;
  showOnlyDynamic: boolean;

  // Refs
  inputRef: React.RefObject<HTMLInputElement>;
  wrapperRef: React.RefObject<HTMLDivElement>;

  // Handlers
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAutocompleteSelect: (variableName: string) => void;
  handleClose: () => void;

  // Data
  variables: Array<{
    name: string;
    value: string;
    scope: 'collection' | 'global' | 'dynamic';
  }>;
}

export function useVariableInput({
  value,
  onChange,
}: UseVariableInputOptions): UseVariableInputReturn {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyDynamic, setShowOnlyDynamic] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const variables = useAvailableVariables();


  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      const cursorPosition = e.target.selectionStart || newValue.length;
      const textUntilCursor = newValue.substring(0, cursorPosition);
      
      // Check if typing after {{
      const lastBraces = textUntilCursor.lastIndexOf('{{');
      if (lastBraces !== -1) {
        // Are we still inside the braces? (no closing }} between {{ and cursor)
        const closeBraces = textUntilCursor.indexOf('}}', lastBraces);
        
        if (closeBraces === -1) {
          const afterBraces = textUntilCursor.substring(lastBraces + 2);
          
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
    },
    [onChange]
  );

  const handleAutocompleteSelect = useCallback(
    (variableName: string) => {
      if (!inputRef.current) return;

      const cursorPosition = inputRef.current.selectionStart || value.length;
      const textUntilCursor = value.substring(0, cursorPosition);
      
      // Find the last {{ position before cursor
      const lastBraces = textUntilCursor.lastIndexOf('{{');
      if (lastBraces === -1) return;

      const beforeBraces = value.substring(0, lastBraces);
      // We only replace from the last {{ to the cursor position
      const afterCursor = value.substring(cursorPosition);
      // To prevent '}}' duplication if the user already closed it:
      const insertStr = `{{${variableName}}}`;
      let newValue = beforeBraces + insertStr + afterCursor;
      
      // Edge case: if the user was typing `{{var}}` and we insert `{{var}}`, 
      // check if afterCursor starts with `}}` so we don't end up with `{{var}}}}`
      if (afterCursor.startsWith('}}')) {
        newValue = beforeBraces + insertStr + afterCursor.substring(2);
      }

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
    },
    [value, onChange]
  );

  const handleClose = useCallback(() => {
    setShowAutocomplete(false);
  }, []);

  // Close autocomplete on escape or click outside
  useClickOutside(wrapperRef, handleClose, showAutocomplete);

  return {
    showAutocomplete,
    searchTerm,
    showOnlyDynamic,
    inputRef,
    wrapperRef,
    handleChange,
    handleAutocompleteSelect,
    handleClose,
    variables,
  };
}
