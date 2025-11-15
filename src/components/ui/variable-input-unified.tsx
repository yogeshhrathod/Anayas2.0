/**
 * VariableInputUnified - Unified variable input component with multiple variants
 * 
 * Consolidates VariableInput, HighlightedVariableInput, and OverlayVariableInput
 * into a single component with variant-based rendering.
 * 
 * @example
 * ```tsx
 * // Basic variant (replaces VariableInput)
 * <VariableInputUnified value={value} onChange={setValue} variant="basic" />
 * 
 * // Highlighted variant (replaces HighlightedVariableInput)
 * <VariableInputUnified value={value} onChange={setValue} variant="highlighted" />
 * 
 * // Overlay variant (replaces OverlayVariableInput)
 * <VariableInputUnified value={value} onChange={setValue} variant="overlay" />
 * ```
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Input } from './input';
import { VariableAutocomplete } from './variable-autocomplete';
import { VariableContextMenu } from './variable-context-menu';
import { useVariableInput } from '../../hooks/useVariableInput';
import { useVariableResolution } from '../../hooks/useVariableResolution';
import { useClickOutside } from '../../hooks/useClickOutside';
import { cn } from '../../lib/utils';

export interface VariableInputUnifiedProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'basic' | 'highlighted' | 'overlay';
}

interface VariableHighlight {
  start: number;
  end: number;
  name: string;
}

interface Segment {
  type: 'text' | 'variable';
  content?: string;
  name?: string;
  resolved?: boolean;
}

const SHARED_STYLES: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '14px',
  lineHeight: '20px',
  padding: '8px 12px',
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  fontWeight: '400',
  boxSizing: 'border-box',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
};

const VARIABLE_REGEX = /\{\{(\$)?[\w.]+\}\}/g;

function parseTextToSegments(text: string, resolvedVariables: Array<{ name: string; value: string }>): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    // Add text before variable
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add variable
    const varName = match[0].slice(2, -2); // Remove {{}}
    const variable = resolvedVariables.find(v => v.name === varName);
    const isDynamic = varName.startsWith('$');
    segments.push({
      type: 'variable',
      name: varName,
      resolved: isDynamic || (!!variable && variable.value !== ''),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return segments;
}

export function VariableInputUnified({
  value = '',
  onChange,
  placeholder,
  className,
  disabled = false,
  variant = 'basic',
}: VariableInputUnifiedProps) {
  const {
    showAutocomplete,
    searchTerm,
    showOnlyDynamic,
    dropdownPosition,
    inputRef,
    wrapperRef,
    handleChange,
    handleAutocompleteSelect,
    handleClose,
    variables,
  } = useVariableInput({
    value,
    onChange,
  });

  // Highlighted variant: detect variables for highlighting
  const [highlights, setHighlights] = useState<VariableHighlight[]>([]);
  useEffect(() => {
    if (variant === 'highlighted') {
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
    }
  }, [value, variant]);

  // Overlay variant: parse segments and resolve variables
  const { variables: resolvedVariables } = useVariableResolution(value);
  const segments = useMemo(() => {
    if (variant === 'overlay') {
      return parseTextToSegments(value, resolvedVariables);
    }
    return [];
  }, [value, resolvedVariables, variant]);

  // Context menu state (for highlighted and overlay variants)
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuVariable, setContextMenuVariable] = useState<string>('');
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or escape
  useClickOutside(
    contextMenuRef,
    () => setShowContextMenu(false),
    showContextMenu
  );

  // Handle context menu for highlighted variant
  const handleContextMenuHighlighted = (e: React.MouseEvent) => {
    if (!inputRef.current || variant !== 'highlighted') return;

    const selectionStart = inputRef.current.selectionStart || 0;
    const selectionEnd = inputRef.current.selectionEnd || 0;

    // Check if click is inside a variable highlight
    for (const highlight of highlights) {
      if (selectionStart >= highlight.start && selectionEnd <= highlight.end) {
        e.preventDefault();
        const varName = highlight.name.replace(/[{}]/g, '');
        setContextMenuVariable(varName);
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
        return;
      }
    }
  };

  // Handle context menu for overlay variant
  const handleContextMenuOverlay = (e: React.MouseEvent, varName: string) => {
    if (variant !== 'overlay') return;
    e.preventDefault();
    e.stopPropagation();
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    setContextMenuVariable(varName);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Handle double-click for overlay variant
  const handleDoubleClick = (varName: string) => {
    if (!inputRef.current || variant !== 'overlay') return;
    
    const varText = `{{${varName}}}`;
    const index = value.indexOf(varText);
    
    if (index !== -1) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(index, index + varText.length);
    }
  };


  // Basic variant: simple input with autocomplete
  if (variant === 'basic') {
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

  // Highlighted variant: input with variable highlights
  if (variant === 'highlighted') {
    return (
      <div ref={wrapperRef} className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onContextMenu={handleContextMenuHighlighted}
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
            position={dropdownPosition}
            showOnlyDynamic={showOnlyDynamic}
          />
        )}
        {showContextMenu && (
          <VariableContextMenu
            ref={contextMenuRef}
            variableName={contextMenuVariable}
            position={contextMenuPosition}
            onClose={() => setShowContextMenu(false)}
          />
        )}
      </div>
    );
  }

  // Overlay variant: input with resolved value overlay
  return (
    <div 
      ref={wrapperRef} 
      className={cn(
        "relative w-full flex h-10 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {/* Overlay Layer - Visual (BELOW input so input captures clicks) */}
      <div
        ref={overlayRef}
        style={{
          ...SHARED_STYLES,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          pointerEvents: 'none',
          whiteSpace: 'pre',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'inherit',
          border: 'none',
          outline: 'none',
          textRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        <span style={{ display: 'inline-block', width: '100%', lineHeight: '20px' }}>
          {segments.map((seg, i) => 
            seg.type === 'variable' ? (
              <span
                key={i}
                className={cn(
                  'font-medium transition-colors',
                  seg.resolved
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                )}
                style={{ 
                  pointerEvents: 'auto',
                  verticalAlign: 'baseline',
                  cursor: 'pointer',
                  display: 'inline',
                  lineHeight: 'inherit',
                  backgroundColor: seg.resolved 
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '3px',
                  padding: '0',
                  margin: '0',
                  border: 'none',
                  outline: 'none',
                }}
                onContextMenu={(e) => handleContextMenuOverlay(e, seg.name!)}
                onDoubleClick={() => handleDoubleClick(seg.name!)}
              >
                {`{{${seg.name}}}`}
              </span>
            ) : (
              <span key={i} style={{ display: 'inline' }}>{seg.content}</span>
            )
          )}
          {!value && placeholder && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
      </div>

      {/* Input Layer - Interaction (ON TOP, captures all clicks) */}
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onContextMenu={(e) => {
          // Check if we're clicking on a capsule by examining click position
          const clickX = e.clientX;
          const rect = inputRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          // Find which segment is at the click position
          let charPos = 0;
          for (const seg of segments) {
            if (seg.type === 'variable') {
              const varText = `{{${seg.name}}}`;
              const startPos = charPos;
              const endPos = charPos + varText.length;
              const charWidth = 8;
              const relativeX = clickX - rect.left - 12;
              const clickedChar = Math.floor(relativeX / charWidth);
              
              if (clickedChar >= startPos && clickedChar <= endPos) {
                e.preventDefault();
                e.stopPropagation();
                handleContextMenuOverlay(e, seg.name!);
                return;
              }
              charPos += varText.length;
            } else if (seg.content) {
              charPos += seg.content.length;
            }
          }
        }}
        // Keep placeholder attribute for accessibility and testing, but rely on
        // overlay + CSS to control visual appearance.
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...SHARED_STYLES,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          color: 'transparent',
          caretColor: 'hsl(var(--foreground))',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          width: '100%',
          height: '100%',
          resize: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxShadow: 'none',
          textRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
        className="placeholder:text-transparent"
        data-testid="variable-input"
      />

      {/* Autocomplete */}
      {showAutocomplete && (
        <VariableAutocomplete
          variables={variables}
          searchTerm={searchTerm}
          onSelect={handleAutocompleteSelect}
          onClose={handleClose}
          position={dropdownPosition}
          showOnlyDynamic={showOnlyDynamic}
        />
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <VariableContextMenu
          ref={contextMenuRef}
          variableName={contextMenuVariable}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
}

