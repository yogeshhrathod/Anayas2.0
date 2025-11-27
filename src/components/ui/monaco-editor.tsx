import { Editor } from '@monaco-editor/react';
import { AlignLeft, Braces, Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_CODE_FONT_STACK } from '../../constants/fonts';
import { useAvailableVariables } from '../../hooks/useVariableResolution';
import { Theme, getThemeById } from '../../lib/themes';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { useToast } from './use-toast';

// Convert HSL color string to hex
function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (sNorm === 0) {
    r = g = b = lNorm; // achromatic
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Create Monaco theme from application theme
function createMonacoTheme(theme: Theme): Record<string, unknown> {
  const colors = theme.colors;
  const isDark = theme.type === 'dark';

  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      {
        token: 'comment',
        foreground: hslToHex(colors.mutedForeground),
        fontStyle: 'italic',
      },
      {
        token: 'keyword',
        foreground: hslToHex(colors.primary),
        fontStyle: 'bold',
      },
      {
        token: 'string',
        foreground: hslToHex(colors.success || colors.primary),
      },
      {
        token: 'number',
        foreground: hslToHex(colors.warning || colors.primary),
      },
      { token: 'regexp', foreground: hslToHex(colors.destructive) },
      { token: 'operator', foreground: hslToHex(colors.foreground) },
      { token: 'namespace', foreground: hslToHex(colors.accentForeground) },
      { token: 'type', foreground: hslToHex(colors.info || colors.primary) },
      { token: 'struct', foreground: hslToHex(colors.accentForeground) },
      { token: 'class', foreground: hslToHex(colors.info || colors.primary) },
      {
        token: 'interface',
        foreground: hslToHex(colors.info || colors.primary),
      },
      { token: 'parameter', foreground: hslToHex(colors.foreground) },
      { token: 'variable', foreground: hslToHex(colors.foreground) },
      { token: 'function', foreground: hslToHex(colors.primary) },
      { token: 'method', foreground: hslToHex(colors.primary) },
      { token: 'property', foreground: hslToHex(colors.foreground) },
      { token: 'label', foreground: hslToHex(colors.accentForeground) },
      {
        token: 'constant',
        foreground: hslToHex(colors.warning || colors.primary),
      },
      { token: 'enum', foreground: hslToHex(colors.info || colors.primary) },
      { token: 'enumMember', foreground: hslToHex(colors.accentForeground) },
      {
        token: 'event',
        foreground: hslToHex(colors.warning || colors.primary),
      },
      { token: 'decorator', foreground: hslToHex(colors.primary) },
      { token: 'modifier', foreground: hslToHex(colors.primary) },
      { token: 'annotation', foreground: hslToHex(colors.mutedForeground) },
      { token: 'attribute', foreground: hslToHex(colors.accentForeground) },
      { token: 'tag', foreground: hslToHex(colors.destructive) },
      { token: 'attribute.name', foreground: hslToHex(colors.primary) },
      {
        token: 'attribute.value',
        foreground: hslToHex(colors.success || colors.primary),
      },
      { token: 'delimiter', foreground: hslToHex(colors.foreground) },
      { token: 'delimiter.bracket', foreground: hslToHex(colors.foreground) },
      {
        token: 'delimiter.parenthesis',
        foreground: hslToHex(colors.foreground),
      },
      { token: 'delimiter.square', foreground: hslToHex(colors.foreground) },
      { token: 'delimiter.angle', foreground: hslToHex(colors.foreground) },
      { token: 'delimiter.curly', foreground: hslToHex(colors.foreground) },
      { token: 'invalid', foreground: hslToHex(colors.destructive) },
      { token: 'invalid.broken', foreground: hslToHex(colors.destructive) },
      { token: 'invalid.deprecated', foreground: hslToHex(colors.destructive) },
      {
        token: 'invalid.unimplemented',
        foreground: hslToHex(colors.destructive),
      },
    ],
    colors: {
      'editor.background': hslToHex(colors.card),
      'editor.foreground': hslToHex(colors.cardForeground),
      'editorLineNumber.foreground': hslToHex(colors.mutedForeground),
      'editorLineNumber.activeForeground': hslToHex(colors.foreground),
      'editorCursor.foreground': hslToHex(colors.primary),
      'editor.selectionBackground': hslToHex(colors.primary + ' 20%'),
      'editor.selectionHighlightBackground': hslToHex(colors.primary + ' 10%'),
      'editor.lineHighlightBackground': hslToHex(colors.muted + ' 30%'),
      'editorIndentGuide.background': hslToHex(colors.border),
      'editorIndentGuide.activeBackground': hslToHex(colors.foreground),
      'editorBracketMatch.background': hslToHex(colors.muted),
      'editorBracketMatch.border': hslToHex(colors.border),
      'editorGutter.background': hslToHex(colors.card),
      'editorWidget.background': hslToHex(colors.popover),
      'editorWidget.border': hslToHex(colors.border),
      'editorSuggestWidget.background': hslToHex(colors.popover),
      'editorSuggestWidget.border': hslToHex(colors.border),
      'editorSuggestWidget.foreground': hslToHex(colors.popoverForeground),
      'editorSuggestWidget.highlightForeground': hslToHex(colors.primary),
      'editorSuggestWidget.selectedBackground': hslToHex(colors.accent),
      'editorHoverWidget.background': hslToHex(colors.popover),
      'editorHoverWidget.border': hslToHex(colors.border),
      'editorHoverWidget.foreground': hslToHex(colors.popoverForeground),
      'editorError.foreground': hslToHex(colors.destructive),
      'editorWarning.foreground': hslToHex(colors.warning || colors.primary),
      'editorInfo.foreground': hslToHex(colors.info || colors.primary),
      'editorBracketHighlight.foreground1': hslToHex(colors.primary),
      'editorBracketHighlight.foreground2': hslToHex(
        colors.success || colors.primary
      ),
      'editorBracketHighlight.foreground3': hslToHex(
        colors.warning || colors.primary
      ),
      'editorBracketHighlight.foreground4': hslToHex(
        colors.info || colors.primary
      ),
      'editorBracketHighlight.foreground5': hslToHex(colors.accentForeground),
      'editorBracketHighlight.foreground6': hslToHex(colors.mutedForeground),
    },
  };
}

/**
 * Register environment variable completion provider for Monaco Editor
 * Provides autocomplete suggestions when typing {{ in JSON editors
 */
function registerEnvironmentVariableCompletion(
  monaco: any,
  availableVariables: Array<{
    name: string;
    value: string;
    scope: 'collection' | 'global' | 'dynamic';
  }>
): { dispose: () => void } {
  return monaco.languages.registerCompletionItemProvider('json', {
    triggerCharacters: ['{', '$'],

    provideCompletionItems: (model: any, position: any) => {
      const lineText = model.getLineContent(position.lineNumber);
      const textUntilPosition = lineText.substring(0, position.column - 1);

      // Detect if we're inside {{ brackets
      const lastOpenBrace = textUntilPosition.lastIndexOf('{{');
      const lastCloseBrace = textUntilPosition.lastIndexOf('}}');

      // If not inside {{ or already closed, return empty
      if (lastOpenBrace === -1 || lastCloseBrace > lastOpenBrace) {
        return { suggestions: [] };
      }

      // Extract what's typed after {{
      const variablePart = textUntilPosition.substring(lastOpenBrace + 2);

      // Calculate start column: lastOpenBrace is 0-based string index, Monaco columns are 1-based
      // So we add 1 to convert to 1-based, then add 2 for the {{ characters
      const startColumn = lastOpenBrace + 3;

      // Detect prefix (collection., global., or $)
      let prefix = '';
      let searchText = variablePart.toLowerCase();

      if (variablePart.startsWith('$')) {
        prefix = '$';
        searchText = variablePart.substring(1).toLowerCase();
      } else if (variablePart.startsWith('collection.')) {
        prefix = 'collection.';
        searchText = variablePart.substring(12).toLowerCase();
      } else if (variablePart.startsWith('global.')) {
        prefix = 'global.';
        searchText = variablePart.substring(7).toLowerCase();
      }

      // Filter variables based on prefix and search text
      const filtered = availableVariables.filter(variable => {
        // If prefix specified, only show matching scope
        if (prefix === 'collection.') {
          if (variable.scope !== 'collection') return false;
        } else if (prefix === 'global.') {
          if (variable.scope !== 'global') return false;
        } else if (prefix === '$') {
          if (variable.scope !== 'dynamic') return false;
        }

        // Match search text case-insensitively
        const varName = variable.name.toLowerCase();
        return varName.includes(searchText);
      });

      // Generate completion suggestions
      const suggestions = filtered.map(variable => {
        // Determine full insertion text (variable part without closing braces)
        let variablePart = variable.name;
        if (
          prefix === 'collection.' &&
          !variable.name.startsWith('collection.')
        ) {
          variablePart = `collection.${variable.name}`;
        } else if (
          prefix === 'global.' &&
          !variable.name.startsWith('global.')
        ) {
          variablePart = `global.${variable.name}`;
        }

        // Append closing }} to complete the variable syntax for insertion
        const insertText = `${variablePart}}}`;

        // Truncate value for preview
        const previewValue =
          variable.value.length > 40
            ? variable.value.substring(0, 40) + '...'
            : variable.value;

        // Determine sort order: dynamic (0) -> collection (1) -> global (2)
        const sortPrefix =
          variable.scope === 'dynamic'
            ? '0'
            : variable.scope === 'collection'
              ? '1'
              : '2';

        return {
          label: {
            label: variable.name,
            description: variable.scope,
          },
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: insertText,
          detail: `Preview: ${previewValue}`,
          documentation: {
            value: `**Scope:** ${variable.scope}\n\n**Current Value:** \`${variable.value}\`\n\n**Usage:** \`{{${variablePart}}}\``,
            isTrusted: true,
          },
          range: {
            startLineNumber: position.lineNumber,
            startColumn: startColumn,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          sortText: `${sortPrefix}_${variable.name}`,
        };
      });

      return { suggestions };
    },
  });
}

/**
 * Get description for dynamic variables
 */
function getDynamicVariableDescription(variableName: string): string | null {
  const DYNAMIC_VARIABLES: Array<{ name: string; description: string }> = [
    { name: '$timestamp', description: 'Current Unix timestamp in seconds' },
    { name: '$randomInt', description: 'Random integer (0-999999)' },
    { name: '$guid', description: 'UUID v4' },
    { name: '$uuid', description: 'UUID v4 (alias)' },
    { name: '$randomEmail', description: 'Random email address' },
  ];

  const dynamicVar = DYNAMIC_VARIABLES.find(v => v.name === variableName);
  return dynamicVar?.description || null;
}

/**
 * Register environment variable hover provider for Monaco Editor
 * Shows variable details when hovering over {{variable}} patterns
 */
function registerEnvironmentVariableHover(
  monaco: any,
  availableVariables: Array<{
    name: string;
    value: string;
    scope: 'collection' | 'global' | 'dynamic';
  }>
): { dispose: () => void } {
  return monaco.languages.registerHoverProvider('json', {
    provideHover: (model: any, position: any) => {
      const lineText = model.getLineContent(position.lineNumber);
      const column = position.column;

      // Look backwards and forwards from cursor to find {{variable}} pattern
      // Search up to 200 characters in each direction
      const searchStart = Math.max(0, column - 200);
      const searchEnd = Math.min(lineText.length, column + 200);
      const searchText = lineText.substring(searchStart, searchEnd);
      const relativePos = column - searchStart - 1;

      // Find all {{variable}} patterns in the search area
      const variablePattern = /\{\{(\$)?(\w+\.)?(\w+)\}\}/g;
      let match;
      let bestMatch: { fullMatch: string; isDynamic: boolean; prefix: string; variableName: string; absoluteStart: number; absoluteEnd: number } | null = null;
      let bestDistance = Infinity;

      while ((match = variablePattern.exec(searchText)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;

        // Check if cursor is within this match
        if (relativePos >= matchStart && relativePos <= matchEnd) {
          const distance = Math.abs(
            relativePos - (matchStart + match[0].length / 2)
          );
          if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = {
              fullMatch: match[0],
              isDynamic: match[1] === '$',
              prefix: match[2] || '',
              variableName: match[3],
              absoluteStart: searchStart + matchStart,
              absoluteEnd: searchStart + matchEnd,
            };
          }
        }
      }

      if (!bestMatch) {
        return null;
      }

      // Determine scope based on prefix
      let scope: 'collection' | 'global' | 'dynamic' = 'global';
      let searchName = bestMatch.variableName;

      if (bestMatch.isDynamic) {
        scope = 'dynamic';
        searchName = `$${bestMatch.variableName}`;
      } else if (bestMatch.prefix === 'collection.') {
        scope = 'collection';
      } else if (bestMatch.prefix === 'global.') {
        scope = 'global';
      }

      // Find matching variable
      const variable = availableVariables.find(v => {
        if (scope === 'dynamic') {
          return v.name === searchName && v.scope === 'dynamic';
        } else if (scope === 'collection') {
          return v.name === bestMatch.variableName && v.scope === 'collection';
        } else {
          return v.name === bestMatch.variableName && v.scope === 'global';
        }
      });

      if (!variable) {
        return {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: bestMatch.absoluteStart + 1,
            endLineNumber: position.lineNumber,
            endColumn: bestMatch.absoluteEnd + 1,
          },
          contents: [
            {
              value: `## 🌐 Environment Variable\n\n**\`${bestMatch.fullMatch}\`**\n\n⚠️ **Not Found**\n\nThis variable is not available in the current environment.`,
            },
          ],
        };
      }

      // Get description for dynamic variables
      const description =
        scope === 'dynamic' ? getDynamicVariableDescription(searchName) : null;

      // Build hover content with enhanced UI
      const displayValue = variable.value || '(no value set)';
      const scopeBadge =
        scope === 'dynamic'
          ? '⚡ Dynamic'
          : scope === 'collection'
            ? '📦 Collection'
            : '🌍 Global';

      let hoverContent = `## ${bestMatch.fullMatch}\n\n**Scope:** ${scopeBadge}\n\n`;

      if (description) {
        hoverContent += `**Description:** ${description}\n\n`;
      }

      hoverContent += `**Current Value:**\n\`\`\`\n${displayValue}\n\`\`\``;

      return {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: bestMatch.absoluteStart + 1,
          endLineNumber: position.lineNumber,
          endColumn: bestMatch.absoluteEnd + 1,
        },
        contents: [{ value: hoverContent }],
      };
    },
  });
}

/**
 * Register syntax highlighting for {{variable}} patterns using decorations
 * This is simpler than custom tokenizer and works better with JSON
 */
function registerEnvironmentVariableDecoration(
  editor: any,
  monaco: any
): any {
  const decorations: string[] = [];
  const model = editor.getModel();

  const updateDecorations = () => {
    const text = model.getValue();
    const variablePattern = /\{\{(\$)?(\w+\.)?(\w+)\}\}/g;
    const newDecorations: any[] = [];
    let match;

    while ((match = variablePattern.exec(text)) !== null) {
      const startPos = model.getPositionAt(match.index);
      const endPos = model.getPositionAt(match.index + match[0].length);

      // Create decoration with inline style
      newDecorations.push({
        range: new monaco.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column
        ),
        options: {
          // Use inlineClassName for guaranteed styling
          inlineClassName: 'env-variable-highlight',
          className: undefined,
          glyphMarginClassName: undefined,
          hoverMessage: undefined,
        },
      });
    }

    decorations.length = 0;
    if (newDecorations.length > 0) {
      decorations.push(...editor.deltaDecorations(decorations, newDecorations));
    }
  };

  // Inject CSS styles into document (Monaco will pick them up)
  const injectStyles = () => {
    if (document.getElementById('monaco-env-var-styles')) return;

    const style = document.createElement('style');
    style.id = 'monaco-env-var-styles';
    style.textContent = `
      .monaco-editor .view-lines .view-line .env-variable-highlight {
        font-style: italic !important;
        color: rgba(59, 130, 246, 0.9) !important;
      }
      .vs-dark .monaco-editor .view-lines .view-line .env-variable-highlight,
      .monaco-editor.vs-dark .view-lines .view-line .env-variable-highlight {
        font-style: italic !important;
        color: rgba(96, 165, 250, 0.9) !important;
      }
    `;
    document.head.appendChild(style);
  };

  injectStyles();

  // Update decorations when model changes
  const disposables = [
    model.onDidChangeContent(() => {
      updateDecorations();
    }),
  ];

  // Initial decoration
  updateDecorations();

  return {
    dispose: () => {
      disposables.forEach(d => d && d.dispose && d.dispose());
      if (decorations.length > 0) {
        editor.deltaDecorations(decorations, []);
      }
    },
  };
}

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  title?: string;
  description?: string;
  className?: string;
  height?: string | number;
  showActions?: boolean;
  validateJson?: boolean;
  readOnly?: boolean;
  minimap?: boolean;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  folding?: boolean;
  fontSize?: number;
  tabSize?: number;
  insertSpaces?: boolean;
  automaticLayout?: boolean;
  enableEnvSuggestions?: boolean;
}

export function MonacoEditor({
  value,
  onChange,
  language = 'json',
  placeholder = '{}',
  title = '', // Default to empty to auto-hide
  description = '',
  className = '',
  height = 400,
  showActions = true,
  validateJson = true,
  readOnly = false,
  minimap = true,
  wordWrap = 'on',
  lineNumbers = 'on',
  folding = true,
  fontSize = 14,
  tabSize = 2,
  insertSpaces = true,
  automaticLayout = true,
  enableEnvSuggestions = true,
}: MonacoEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const editorRef = useRef<any>(null);
  const completionProviderRef = useRef<any>(null);
  const hoverProviderRef = useRef<any>(null);
  const decorationRef = useRef<any>(null);
  const { success, error: showError } = useToast();
  const { themeMode, currentThemeId, customThemes, settings } = useStore();
  const availableVariables = useAvailableVariables();
  // Get code font from settings, fallback to default
  const codeFontFamily =
    settings.codeFontFamily &&
    typeof settings.codeFontFamily === 'string' &&
    settings.codeFontFamily.trim().length > 0
      ? settings.codeFontFamily.trim()
      : DEFAULT_CODE_FONT_STACK;

  // Get current theme and create Monaco theme
  const currentTheme = getThemeById(currentThemeId, customThemes);
  const isDarkMode =
    themeMode === 'dark' ||
    (themeMode === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches) ||
    (currentTheme && currentTheme.type === 'dark');

  // Create dynamic Monaco theme name
  const monacoThemeName = `app-theme-${currentThemeId}`;

  // JSON validation
  useEffect(() => {
    if (validateJson && language === 'json' && value.trim()) {
      try {
        JSON.parse(value);
        setIsValid(true);
        setError(null);
      } catch (e: unknown) {
        setIsValid(false);
        setError(e instanceof Error ? e.message : 'Invalid JSON');
      }
    } else {
      setIsValid(true);
      setError(null);
    }
  }, [value, validateJson, language]);

  // Handle theme changes
  useEffect(() => {
    if (editorRef.current && currentTheme) {
      const monaco = (window as any).monaco;
      if (monaco) {
        const monacoTheme = createMonacoTheme(currentTheme);
        monaco.editor.defineTheme(monacoThemeName, monacoTheme);
        monaco.editor.setTheme(monacoThemeName);
      }
    }
  }, [currentTheme, monacoThemeName]);

  // Handle font family changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontFamily: codeFontFamily,
      });
    }
  }, [codeFontFamily]);

  // Re-register completion and hover providers when variables change
  useEffect(() => {
    if (language === 'json' && enableEnvSuggestions && editorRef.current) {
      const monaco = (window as any).monaco;
      if (monaco && availableVariables.length >= 0) {
        // Dispose existing providers
        if (completionProviderRef.current) {
          completionProviderRef.current.dispose();
        }
        if (hoverProviderRef.current) {
          hoverProviderRef.current.dispose();
        }
        // Register new providers with updated variables
        completionProviderRef.current = registerEnvironmentVariableCompletion(
          monaco,
          availableVariables
        );
        hoverProviderRef.current = registerEnvironmentVariableHover(
          monaco,
          availableVariables
        );
      }
    }
  }, [availableVariables, language, enableEnvSuggestions]);

  // Cleanup providers on unmount
  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
        completionProviderRef.current = null;
      }
      if (hoverProviderRef.current) {
        hoverProviderRef.current.dispose();
        hoverProviderRef.current = null;
      }
      if (decorationRef.current) {
        decorationRef.current.dispose();
        decorationRef.current = null;
      }
    };
  }, []);

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register dynamic theme if current theme exists
    if (currentTheme) {
      const monacoTheme = createMonacoTheme(currentTheme);
      monaco.editor.defineTheme(monacoThemeName, monacoTheme);
      monaco.editor.setTheme(monacoThemeName);
    } else {
      // Fallback to default theme
      const fallbackTheme = isDarkMode ? 'vs-dark' : 'vs';
      monaco.editor.setTheme(fallbackTheme);
    }

    // Configure editor options
    editor.updateOptions({
      fontFamily: codeFontFamily,
      fontSize,
      tabSize,
      insertSpaces,
      wordWrap,
      lineNumbers,
      folding,
      minimap: { enabled: minimap },
      readOnly,
      automaticLayout: automaticLayout, // Use prop value
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      renderControlCharacters: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: true,
      smoothScrolling: true,
    });

    // Add placeholder if value is empty
    if (!value.trim()) {
      editor.setValue(placeholder);
      editor.setSelection(editor.getModel()?.getFullModelRange());
    }

    // Configure JSON language features
    if (language === 'json') {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: [],
        enableSchemaRequest: false,
      });

      // Register environment variable completion and hover providers
      if (enableEnvSuggestions) {
        // Dispose any existing providers
        if (completionProviderRef.current) {
          completionProviderRef.current.dispose();
        }
        if (hoverProviderRef.current) {
          hoverProviderRef.current.dispose();
        }
        if (decorationRef.current) {
          decorationRef.current.dispose();
        }
        // Register new providers with current available variables
        completionProviderRef.current = registerEnvironmentVariableCompletion(
          monaco,
          availableVariables
        );
        hoverProviderRef.current = registerEnvironmentVariableHover(
          monaco,
          availableVariables
        );
        decorationRef.current = registerEnvironmentVariableDecoration(
          editor,
          monaco
        );
      }
    }

    // Setup ResizeObserver
    const container = editor.getContainerDomNode();
    if (container) {
      const resizeObserver = new ResizeObserver(() => {
        // Trigger layout only if editor exists
        if (editor) {
          editor.layout();
        }
      });
      resizeObserver.observe(container);

      // Store observer cleanup function
      (editor as any)._resizeObserver = resizeObserver;
    }
  };

  // Cleanup ResizeObserver on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current && (editorRef.current as any)._resizeObserver) {
        (editorRef.current as any)._resizeObserver.disconnect();
      }
    };
  }, []);

  // Handle value change
  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  };

  // Action handlers
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    success('Copied', 'Content copied to clipboard');
  };

  const handleFormat = () => {
    if (language === 'json') {
      try {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, tabSize);
        onChange(formatted);
        success('Formatted', 'JSON has been formatted');
      } catch (_e: unknown) {
        showError('Format Error', 'Invalid JSON cannot be formatted');
      }
    } else {
      // For other languages, use Monaco's trigger action
      if (editorRef.current) {
        editorRef.current.trigger('anyString', 'editor.action.formatDocument');
      }
    }
  };

  const handleMinify = () => {
    if (language === 'json') {
      try {
        const parsed = JSON.parse(value);
        const minified = JSON.stringify(parsed);
        onChange(minified);
        success('Minified', 'JSON has been minified');
      } catch (_e: unknown) {
        showError('Minify Error', 'Invalid JSON cannot be minified');
      }
    }
  };

  const hasTitle = title && title.length > 0;

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'flex flex-col overflow-hidden border shadow-sm transition-all duration-200',
          className
        )}
      >
        {/* Optional Header - Only shown if title exists */}
        {hasTitle && (
          <CardHeader className="flex-none px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">{title}</CardTitle>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {description}
                  </p>
                )}
              </div>

              {/* Actions in Header */}
              {showActions && (
                <div className="flex items-center gap-1">
                  {language === 'json' && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleFormat}
                          >
                            <Braces className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Format JSON</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleMinify}
                          >
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Minify JSON</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCopy}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy Content</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </CardHeader>
        )}

        <CardContent className="flex-1 p-0 relative min-h-0">
          {/* Editor Container */}
          <div className="relative w-full" style={{ height: height }}>
            {/* Floating Actions - Shown when no title */}
            {!hasTitle && showActions && (
              <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 p-1 rounded-md bg-background/80 backdrop-blur-sm border shadow-sm transition-opacity duration-200">
                {language === 'json' && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleFormat}
                        >
                          <Braces className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Format</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleMinify}
                        >
                          <AlignLeft className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Minify</TooltipContent>
                    </Tooltip>
                  </>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCopy}
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Copy</TooltipContent>
                </Tooltip>
              </div>
            )}

            <Editor
              height="100%"
              language={language}
              theme={monacoThemeName}
              value={value}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                fontFamily: codeFontFamily,
                fontSize,
                tabSize,
                insertSpaces,
                wordWrap,
                lineNumbers,
                folding,
                minimap: { enabled: minimap },
                readOnly,
                automaticLayout: automaticLayout, // We handle layout manually for better control
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                renderControlCharacters: true,
                cursorBlinking: 'blink',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                padding: { top: 16, bottom: 16 },
                contextmenu: true,
                mouseWheelZoom: true,
                guides: {
                  indentation: true,
                },
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                },
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: true,
                },
              }}
            />

            {/* Minimal futuristic validation status */}
            {validateJson && language === 'json' && value.trim() && (
              <div
                className={cn(
                  'absolute bottom-2 right-4 z-10 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide backdrop-blur-md border flex items-center gap-1.5 transition-all duration-300',
                  isValid
                    ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                )}
              >
                {isValid ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    VALID
                  </>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-help">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        INVALID
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[300px] break-words"
                    >
                      {error}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
