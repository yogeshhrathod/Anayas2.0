import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { JsonEditor } from './json-editor';
import { Alert, AlertDescription } from './alert';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from './use-toast';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  description: string;
  initialData: any;
  dataType: 'queryParams' | 'envVars';
  placeholder?: string;
}

export function BulkEditModal({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  initialData,
  dataType,
  placeholder
}: BulkEditModalProps) {
  const [jsonValue, setJsonValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Convert initial data to JSON format
      let jsonString = '';
      
      if (dataType === 'queryParams') {
        // Convert query params array to JSON
        const paramsObj = initialData.reduce((acc: any, param: any) => {
          if (param.key && param.value) {
            acc[param.key] = param.value;
          }
          return acc;
        }, {});
        jsonString = JSON.stringify(paramsObj, null, 2);
      } else if (dataType === 'envVars') {
        // Environment variables are already an object
        jsonString = JSON.stringify(initialData, null, 2);
      }
      
      setJsonValue(jsonString);
    }
  }, [isOpen, initialData, dataType]);

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

  const handleSave = () => {
    if (!isValid) {
      showError('Invalid JSON', 'Please fix JSON syntax errors before saving');
      return;
    }

    try {
      const parsed = JSON.parse(jsonValue);
      let convertedData;

      if (dataType === 'queryParams') {
        // Convert object back to query params array format
        convertedData = Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value),
          enabled: true
        }));
      } else if (dataType === 'envVars') {
        // Environment variables stay as object
        convertedData = parsed;
      }

      onSave(convertedData);
      success('Saved', 'Bulk edit completed successfully');
      onClose();
    } catch (e: any) {
      showError('Save Error', e.message);
    }
  };

  const handleCancel = () => {
    setJsonValue('');
    setError(null);
    setIsValid(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-dialog p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 overflow-auto max-h-[calc(90vh-120px)]">
          <JsonEditor
            value={jsonValue}
            onChange={setJsonValue}
            placeholder={placeholder}
            title=""
            description=""
            rows={20}
            showActions={true}
            validateJson={true}
            className="border-0 shadow-none"
          />
          
          {!isValid && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isValid && jsonValue.trim() && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Valid JSON - Ready to save</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isValid || !jsonValue.trim()}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
