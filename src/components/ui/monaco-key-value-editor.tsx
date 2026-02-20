import { Editor } from '@monaco-editor/react';
import { AlertCircle, CheckCircle, Copy, FileText, Maximize2, Minimize2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_CODE_FONT_STACK } from '../../constants/fonts';
import { resolveTheme } from '../../lib/themes';
import { useStore } from '../../store/useStore';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { useToast } from './use-toast';

interface KeyValuePair {
  key: string;
  value: string;
  enabled?: boolean;
}

interface MonacoKeyValueEditorProps {
  data: KeyValuePair[];
  onChange: (data: KeyValuePair[]) => void;
  title?: string;
  description?: string;
  className?: string;
  height?: string | number;
  showActions?: boolean;
  readOnly?: boolean;
  minimap?: boolean;
  fontSize?: number;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  allowBulkEdit?: boolean;
}

export function MonacoKeyValueEditor({
  data,
  onChange,
  title = 'Key-Value Editor',
  description = 'Edit key-value pairs',
  className = '',
  height = 300,
  showActions = true,
  readOnly = false,
  minimap = false,
  fontSize = 14,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  allowBulkEdit = true
}: MonacoKeyValueEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jsonValue, setJsonValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const editorRef = useRef<any>(null);
  const { success, error: showError } = useToast();
  const { themeMode, currentThemeId, customThemes, settings } = useStore();
  // Get code font from settings, fallback to default
  const codeFontFamily = (settings.codeFontFamily && 
    typeof settings.codeFontFamily === 'string' && 
    settings.codeFontFamily.trim().length > 0)
    ? settings.codeFontFamily.trim()
    : DEFAULT_CODE_FONT_STACK;

  // Resolve which theme should be applied
  const currentTheme = resolveTheme(themeMode, currentThemeId, customThemes);
  const isDarkMode = currentTheme.type === 'dark';
  const monacoTheme = isDarkMode ? 'vs-dark' : 'vs';

  // Convert data to JSON string for bulk editing
  useEffect(() => {
    const jsonString = JSON.stringify(
      data.reduce((acc, item) => {
        if (item.key && item.value) {
          acc[item.key] = item.value;
        }
        return acc;
      }, {} as Record<string, string>),
      null,
      2
    );
    setJsonValue(jsonString);
  }, [data]);

  // JSON validation
  useEffect(() => {
    if (jsonValue.trim()) {
      try {
        JSON.parse(jsonValue);
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
  }, [jsonValue]);

  // Handle font family changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontFamily: codeFontFamily
      });
    }
  }, [codeFontFamily]);

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontFamily: codeFontFamily,
      fontSize,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      minimap: { enabled: minimap },
      readOnly,
      automaticLayout: true,
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
    });

    // Configure JSON language features
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: false,
    });
  };

  // Handle value change
  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      setJsonValue(newValue);
    }
  };

  // Action handlers
  const handleCopy = () => {
    navigator.clipboard.writeText(jsonValue);
    success('Copied', 'JSON copied to clipboard');
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonValue(formatted);
      success('Formatted', 'JSON has been formatted');
    } catch (e: any) {
      showError('Format Error', 'Invalid JSON cannot be formatted');
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      const minified = JSON.stringify(parsed);
      setJsonValue(minified);
      success('Minified', 'JSON has been minified');
    } catch (e: any) {
      showError('Minify Error', 'Invalid JSON cannot be minified');
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleApplyJson = () => {
    if (!isValid) {
      showError('Invalid JSON', 'Please fix JSON syntax errors before applying');
      return;
    }

    try {
      const parsed = JSON.parse(jsonValue);
      const newData = Object.entries(parsed).map(([key, value]) => ({
        key,
        value: String(value),
        enabled: true
      }));
      onChange(newData);
      setShowJsonEditor(false);
      success('Applied', 'JSON data applied successfully');
    } catch (e: any) {
      showError('Apply Error', e.message);
    }
  };

  const addItem = () => {
    const newData = [...data, { key: '', value: '', enabled: true }];
    onChange(newData);
  };

  const updateItem = (index: number, field: 'key' | 'value', newValue: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: newValue };
    onChange(newData);
  };

  const removeItem = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const toggleItem = (index: number) => {
    const newData = [...data];
    newData[index] = { ...newData[index], enabled: !newData[index].enabled };
    onChange(newData);
  };

  // Dynamic height calculation
  const editorHeight = isFullscreen ? 'calc(100vh - 120px)' : height;

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-modal' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {showActions && (
            <div className="flex gap-2">
              {allowBulkEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowJsonEditor(!showJsonEditor)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {showJsonEditor ? 'Table View' : 'JSON View'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add
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
        {showJsonEditor ? (
          // JSON Editor View
          <div className="space-y-2">
            <div 
              className={`border rounded-md overflow-hidden ${
                !isValid ? 'border-red-500' : 'border-border'
              }`}
              style={{ height: editorHeight }}
            >
              <Editor
                height="100%"
                language="json"
                theme={monacoTheme}
                value={jsonValue}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  fontFamily: codeFontFamily,
                  fontSize,
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  minimap: { enabled: minimap },
                  readOnly,
                  automaticLayout: true,
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
            {isValid && jsonValue.trim() && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Valid JSON</AlertDescription>
              </Alert>
            )}

            {/* JSON Editor Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleFormat}>
                Format
              </Button>
              <Button variant="outline" size="sm" onClick={handleMinify}>
                Minify
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button onClick={handleApplyJson} disabled={!isValid || !jsonValue.trim()}>
                Apply JSON
              </Button>
            </div>
          </div>
        ) : (
          // Table View
          <div className="space-y-2">
            {data.length > 0 ? (
              data.map((item, index) => (
                <div key={`${item.key}-${item.value}-${index}`} className="flex gap-2 items-center flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.enabled !== false}
                      onChange={() => toggleItem(index)}
                      className="shrink-0"
                    />
                    <input
                      type="text"
                      value={item.key}
                      onChange={(e) => updateItem(index, 'key', e.target.value)}
                      placeholder={keyPlaceholder}
                      className="flex-1 min-w-0 px-3 py-2 border border-input rounded-md bg-background text-sm"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => updateItem(index, 'value', e.target.value)}
                      placeholder={valuePlaceholder}
                      className="flex-1 min-w-0 px-3 py-2 border border-input rounded-md bg-background text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
