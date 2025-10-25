import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { useStore } from '../../store/useStore';
import { getThemeById, Theme } from '../../lib/themes';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { CheckCircle, AlertCircle, Copy, Maximize2, Minimize2 } from 'lucide-react';
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
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (sNorm === 0) {
    r = g = b = lNorm; // achromatic
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Create Monaco theme from application theme
function createMonacoTheme(theme: Theme): any {
  const colors = theme.colors;
  const isDark = theme.type === 'dark';
  
  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: hslToHex(colors.mutedForeground), fontStyle: 'italic' },
      { token: 'keyword', foreground: hslToHex(colors.primary), fontStyle: 'bold' },
      { token: 'string', foreground: hslToHex(colors.success || colors.primary) },
      { token: 'number', foreground: hslToHex(colors.warning || colors.primary) },
      { token: 'regexp', foreground: hslToHex(colors.destructive) },
      { token: 'operator', foreground: hslToHex(colors.foreground) },
      { token: 'namespace', foreground: hslToHex(colors.accentForeground) },
      { token: 'type', foreground: hslToHex(colors.info || colors.primary) },
      { token: 'struct', foreground: hslToHex(colors.accentForeground) },
      { token: 'class', foreground: hslToHex(colors.info || colors.primary) },
      { token: 'interface', foreground: hslToHex(colors.info || colors.primary) },
      { token: 'parameter', foreground: hslToHex(colors.foreground) },
      { token: 'variable', foreground: hslToHex(colors.foreground) },
      { token: 'function', foreground: hslToHex(colors.primary) },
      { token: 'method', foreground: hslToHex(colors.primary) },
      { token: 'property', foreground: hslToHex(colors.foreground) },
      { token: 'label', foreground: hslToHex(colors.accentForeground) },
      { token: 'constant', foreground: hslToHex(colors.warning || colors.primary) },
      { token: 'enum', foreground: hslToHex(colors.info || colors.primary) },
      { token: 'enumMember', foreground: hslToHex(colors.accentForeground) },
      { token: 'event', foreground: hslToHex(colors.warning || colors.primary) },
      { token: 'decorator', foreground: hslToHex(colors.primary) },
      { token: 'modifier', foreground: hslToHex(colors.primary) },
      { token: 'annotation', foreground: hslToHex(colors.mutedForeground) },
      { token: 'attribute', foreground: hslToHex(colors.accentForeground) },
      { token: 'tag', foreground: hslToHex(colors.destructive) },
      { token: 'attribute.name', foreground: hslToHex(colors.primary) },
      { token: 'attribute.value', foreground: hslToHex(colors.success || colors.primary) },
      { token: 'delimiter', foreground: hslToHex(colors.foreground) },
      { token: 'delimiter.bracket', foreground: hslToHex(colors.foreground) },
      { token: 'delimiter.parenthesis', foreground: hslToHex(colors.foreground) },
      { token: 'delimiter.square', foreground: hslToHex(colors.foreground) },
      { token: 'delimiter.angle', foreground: hslToHex(colors.foreground) },
      { token: 'delimiter.curly', foreground: hslToHex(colors.foreground) },
      { token: 'invalid', foreground: hslToHex(colors.destructive) },
      { token: 'invalid.broken', foreground: hslToHex(colors.destructive) },
      { token: 'invalid.deprecated', foreground: hslToHex(colors.destructive) },
      { token: 'invalid.unimplemented', foreground: hslToHex(colors.destructive) },
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
      'editorBracketHighlight.foreground2': hslToHex(colors.success || colors.primary),
      'editorBracketHighlight.foreground3': hslToHex(colors.warning || colors.primary),
      'editorBracketHighlight.foreground4': hslToHex(colors.info || colors.primary),
      'editorBracketHighlight.foreground5': hslToHex(colors.accentForeground),
      'editorBracketHighlight.foreground6': hslToHex(colors.mutedForeground),
    }
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
}

export function MonacoEditor({
  value,
  onChange,
  language = 'json',
  placeholder = '{}',
  title = 'Monaco Editor',
  description = 'Edit your content',
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
  automaticLayout = true
}: MonacoEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<any>(null);
  const { success, error: showError } = useToast();
  const { themeMode, currentThemeId, customThemes } = useStore();

  // Get current theme and create Monaco theme
  const currentTheme = getThemeById(currentThemeId, customThemes);
  const isDarkMode = themeMode === 'dark' || 
    (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
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
      } catch (e: any) {
        setIsValid(false);
        setError(e.message);
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
      fontSize,
      tabSize,
      insertSpaces,
      wordWrap,
      lineNumbers,
      folding,
      minimap: { enabled: minimap },
      readOnly,
      automaticLayout,
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
    }
  };

  // Handle value change
  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  };

  // Action handlers
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    success('Copied', 'Content copied to clipboard');
  };

  const handleFormat = () => {
    if (language === 'json') {
      try {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, tabSize);
        onChange(formatted);
        success('Formatted', 'JSON has been formatted');
      } catch (e: any) {
        showError('Format Error', 'Invalid JSON cannot be formatted');
      }
    } else {
      // For other languages, we could add formatting logic here
      success('Format', 'Formatting not available for this language');
    }
  };

  const handleMinify = () => {
    if (language === 'json') {
      try {
        const parsed = JSON.parse(value);
        const minified = JSON.stringify(parsed);
        onChange(minified);
        success('Minified', 'JSON has been minified');
      } catch (e: any) {
        showError('Minify Error', 'Invalid JSON cannot be minified');
      }
    } else {
      success('Minify', 'Minification not available for this language');
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Dynamic height calculation
  const editorHeight = isFullscreen ? 'calc(100vh - 120px)' : height;

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {showActions && (
            <div className="flex gap-2">
              {language === 'json' && (
                <>
                  <Button variant="outline" size="sm" onClick={handleFormat}>
                    Format
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleMinify}>
                    Minify
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div 
            className={`border rounded-md overflow-hidden ${
              !isValid ? 'border-red-500' : 'border-border'
            }`}
            style={{ height: editorHeight }}
          >
            <Editor
              height="100%"
              language={language}
              theme={monacoThemeName}
              value={value}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize,
                tabSize,
                insertSpaces,
                wordWrap,
                lineNumbers,
                folding,
                minimap: { enabled: minimap },
                readOnly,
                automaticLayout,
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
          </div>
          
          {/* Validation Messages */}
          {!isValid && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isValid && value.trim() && language === 'json' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Valid JSON</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
