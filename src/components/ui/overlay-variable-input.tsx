import { useState, useRef, useMemo } from 'react';
import { VariableAutocomplete } from './variable-autocomplete';
import { VariableContextMenu } from './variable-context-menu';
import { VariableDefinitionDialog } from './variable-definition-dialog';
import {
  useAvailableVariables,
  useVariableResolution,
} from '../../hooks/useVariableResolution';
import { cn } from '../../lib/utils';
import { useClickOutside } from '../../hooks/useClickOutside';

interface Segment {
  type: 'text' | 'variable';
  content?: string;
  name?: string;
  resolved?: boolean;
}

const SHARED_STYLES: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '14px',
  lineHeight: '20px', // Matches h-10 (40px) with py-2 (8px top/bottom) = 24px available, centers 20px line-height
  padding: '8px 12px', // py-2 px-3 = 8px vertical, 12px horizontal
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  fontWeight: '400',
  boxSizing: 'border-box',
  margin: 0,
  // Ensure text is vertically centered like input elements
  display: 'flex',
  alignItems: 'center',
};

export interface OverlayVariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function parseTextToSegments(
  text: string,
  resolvedVariables: Array<{ name: string; value: string }>
): Segment[] {
  const VARIABLE_REGEX = /\{\{(\$)?[\w.]+\}\}/g; // Allow $ for dynamic variables
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
    // Extract variable name, keeping $ prefix for dynamic variables
    const varName = match[0].slice(2, -2); // Remove {{}}
    const variable = resolvedVariables.find(v => v.name === varName);
    // Dynamic variables are always considered resolved
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

export function OverlayVariableInput({
  value = '',
  onChange,
  placeholder,
  className,
  disabled = false,
}: OverlayVariableInputProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyDynamic, setShowOnlyDynamic] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuVariable, setContextMenuVariable] = useState<string>('');
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showDefinitionDialog, setShowDefinitionDialog] = useState(false);
  const [definitionDialogVariable, setDefinitionDialogVariable] =
    useState<string>('');
  const [autocompletePosition, setAutocompletePosition] = useState({
    top: 0,
    left: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const variables = useAvailableVariables();
  const { variables: resolvedVariables } = useVariableResolution(value);

  // Parse text into segments
  const segments = useMemo(
    () => parseTextToSegments(value, resolvedVariables),
    [value, resolvedVariables]
  );

  const updateAutocompletePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setAutocompletePosition({
        top: rect.bottom + 4,
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
        // Check if user typed {{$ (wants dynamic variables)
        const isDynamicSearch =
          afterBraces.startsWith('$') && afterBraces.length === 1;
        setShowOnlyDynamic(isDynamicSearch);

        // Remove $ prefix from search term if present (for dynamic variables)
        const search = afterBraces.startsWith('$')
          ? afterBraces.substring(1)
          : afterBraces;
        setSearchTerm(search);
        updateAutocompletePosition();
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
    if (!inputRef.current) return;

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

  // Handle double-click on capsule
  const handleDoubleClick = (varName: string) => {
    if (!inputRef.current) return;

    const varText = `{{${varName}}}`;
    const index = value.indexOf(varText);

    if (index !== -1) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(index, index + varText.length);
    }
  };

  // Handle right-click on capsule
  const handleContextMenu = (e: React.MouseEvent, varName: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Focus the input to maintain keyboard interaction
    if (inputRef.current) {
      inputRef.current.focus();
    }

    setContextMenuVariable(varName);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
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
    <div
      ref={wrapperRef}
      className={cn(
        'relative w-full flex h-10 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
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
          pointerEvents: 'none', // Don't block input clicks
          whiteSpace: 'pre', // Match input text exactly
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'inherit',
          border: 'none',
          outline: 'none',
          // Ensure exact text rendering match
          textRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        <span
          style={{ display: 'inline-block', width: '100%', lineHeight: '20px' }}
        >
          {segments.map((seg, i) =>
            seg.type === 'variable' ? (
              <span
                key={`var-${seg.name}-${i}`}
                className={cn(
                  'font-medium transition-colors',
                  seg.resolved
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                )}
                style={{
                  pointerEvents: 'auto', // Only capsules receive pointer events
                  verticalAlign: 'baseline',
                  cursor: 'pointer',
                  display: 'inline',
                  lineHeight: 'inherit',
                  backgroundColor: seg.resolved
                    ? 'rgba(34, 197, 94, 0.2)' // green-500 with opacity
                    : 'rgba(239, 68, 68, 0.2)', // red-500 with opacity
                  borderRadius: '3px',
                  padding: '0',
                  margin: '0',
                  // Ensure no extra spacing
                  border: 'none',
                  outline: 'none',
                }}
                onContextMenu={e => handleContextMenu(e, seg.name!)}
                onDoubleClick={() => handleDoubleClick(seg.name!)}
              >
                {`{{${seg.name}}}`}
              </span>
            ) : (
              <span
                key={`text-${seg.content?.substring(0, 20)}-${i}`}
                style={{ display: 'inline' }}
              >
                {seg.content}
              </span>
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
        onContextMenu={e => {
          // Check if we're clicking on a capsule by examining click position
          const clickX = e.clientX;
          const rect = inputRef.current?.getBoundingClientRect();
          if (!rect) return;

          // Find which segment is at the click position
          let charPos = 0;
          for (const seg of segments) {
            if (seg.type === 'variable') {
              const varText = `{{${seg.name}}}`;
              // Estimate if click is in this variable's capsule area
              const startPos = charPos;
              const endPos = charPos + varText.length;
              const charWidth = 8;
              const relativeX = clickX - rect.left - 12;
              const clickedChar = Math.floor(relativeX / charWidth);

              if (clickedChar >= startPos && clickedChar <= endPos) {
                e.preventDefault();
                e.stopPropagation();
                handleContextMenu(e, seg.name!);
                return;
              }
              charPos += varText.length;
            } else if (seg.content) {
              charPos += seg.content.length;
            }
          }
        }}
        placeholder={!value && placeholder ? placeholder : ''}
        disabled={disabled}
        style={{
          ...SHARED_STYLES,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          color: 'transparent', // Hide text
          caretColor: 'hsl(var(--foreground))', // Show cursor with theme foreground color
          background: 'transparent',
          border: 'none',
          outline: 'none',
          width: '100%',
          height: '100%',
          resize: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxShadow: 'none', // Remove any shadow effects
          // Ensure exact text rendering match with overlay
          textRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          // Center text vertically - input naturally centers with proper padding/line-height
        }}
        className="placeholder:text-transparent"
      />

      {/* Autocomplete */}
      {showAutocomplete && (
        <VariableAutocomplete
          variables={variables}
          searchTerm={searchTerm}
          onSelect={handleAutocompleteSelect}
          onClose={handleClose}
          position={autocompletePosition}
          showOnlyDynamic={showOnlyDynamic}
        />
      )}

      {/* Context Menu */}
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
