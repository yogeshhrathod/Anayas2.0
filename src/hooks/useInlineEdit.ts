/**
 * useInlineEdit - Inline name editing hook
 *
 * Provides inline editing functionality for names with:
 * - Edit state management
 * - Validation
 * - Save/cancel operations
 * - Keyboard shortcuts
 *
 * @example
 * ```tsx
 * const {
 *   isEditing,
 *   editValue,
 *   startEdit,
 *   cancelEdit,
 *   saveEdit,
 *   setEditValue
 * } = useInlineEdit({
 *   initialValue: item.name,
 *   onSave: async (newName) => await updateItem(item.id, newName)
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToastNotifications } from './useToastNotifications';

export interface InlineEditConfig {
  initialValue: string;
  onSave: (newValue: string) => Promise<void>;
  validate?: (value: string) => string | undefined;
}

export interface InlineEditState {
  isEditing: boolean;
  editValue: string;
}

export interface InlineEditActions {
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => Promise<void>;
  setEditValue: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useInlineEdit(config: InlineEditConfig) {
  const { showError } = useToastNotifications();
  const [state, setState] = useState<InlineEditState>({
    isEditing: false,
    editValue: config.initialValue,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (state.isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [state.isEditing]);

  const startEdit = useCallback(() => {
    setState({
      isEditing: true,
      editValue: config.initialValue,
    });
  }, [config.initialValue]);

  const cancelEdit = useCallback(() => {
    setState({
      isEditing: false,
      editValue: config.initialValue,
    });
  }, [config.initialValue]);

  const saveEdit = useCallback(async () => {
    const trimmedValue = state.editValue.trim();

    if (!trimmedValue) {
      showError('Validation Error', 'Name cannot be empty');
      return;
    }

    if (trimmedValue === config.initialValue) {
      cancelEdit();
      return;
    }

    // Validate if validator provided
    if (config.validate) {
      const error = config.validate(trimmedValue);
      if (error) {
        showError('Validation Error', error);
        return;
      }
    }

    try {
      await config.onSave(trimmedValue);
      setState({
        isEditing: false,
        editValue: trimmedValue,
      });
    } catch (error: any) {
      showError('Save Failed', error.message || 'Failed to save changes');
    }
  }, [state.editValue, config, showError, cancelEdit]);

  const setEditValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, editValue: value }));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit]
  );

  return {
    ...state,
    startEdit,
    cancelEdit,
    saveEdit,
    setEditValue,
    handleKeyDown,
    inputRef,
  };
}
