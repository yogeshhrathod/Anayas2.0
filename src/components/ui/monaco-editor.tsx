import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { useStore } from '../../store/useStore';
import { getThemeById } from '../../lib/themes';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { CheckCircle, AlertCircle, Copy, Maximize2, Minimize2 } from 'lucide-react';
import { useToast } from './use-toast';

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

  // Get current theme and determine Monaco theme
  const currentTheme = getThemeById(currentThemeId, customThemes);
  const isDarkMode = themeMode === 'dark' || 
    (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
    (currentTheme && currentTheme.type === 'dark');

  const monacoTheme = isDarkMode ? 'vs-dark' : 'vs';

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

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
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
              theme={monacoTheme}
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
