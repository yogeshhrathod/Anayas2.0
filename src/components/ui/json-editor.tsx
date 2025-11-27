import { AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { MonacoEditor } from './monaco-editor';
import { Textarea } from './textarea';
import { useToast } from './use-toast';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  description?: string;
  className?: string;
  rows?: number;
  showActions?: boolean;
  validateJson?: boolean;
  useMonaco?: boolean;
  height?: string | number;
  readOnly?: boolean;
  minimap?: boolean;
  fontSize?: number;
}

export function JsonEditor({
  value,
  onChange,
  placeholder = '{}',
  title = 'JSON Editor',
  description = 'Edit JSON data',
  className = '',
  rows = 12,
  showActions = true,
  validateJson = true,
  useMonaco = true,
  height = 400,
  readOnly = false,
  minimap = true,
  fontSize = 14,
}: JsonEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (validateJson && value.trim()) {
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
  }, [value, validateJson]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    success('Copied', 'JSON copied to clipboard');
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      success('Formatted', 'JSON has been formatted');
    } catch {
      showError('Format Error', 'Invalid JSON cannot be formatted');
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(value);
      const minified = JSON.stringify(parsed);
      onChange(minified);
      success('Minified', 'JSON has been minified');
    } catch {
      showError('Minify Error', 'Invalid JSON cannot be minified');
    }
  };

  // Use Monaco Editor by default
  if (useMonaco) {
    return (
      <MonacoEditor
        value={value}
        onChange={onChange}
        language="json"
        placeholder={placeholder}
        title={title}
        description={description}
        className={className}
        height={height}
        showActions={showActions}
        validateJson={validateJson}
        readOnly={readOnly}
        minimap={minimap}
        fontSize={fontSize}
      />
    );
  }

  // Fallback to simple textarea
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          {showActions && (
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
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`font-mono text-sm resize-none ${
              !isValid ? 'border-red-500 focus:border-red-500' : ''
            }`}
          />
          {!isValid && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isValid && value.trim() && (
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
