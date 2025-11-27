import { useState, useEffect } from 'react';
import { Button } from './button';
import { Dialog } from './dialog';
import { JsonEditor } from './json-editor';
import { Alert, AlertDescription } from './alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from './use-toast';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string> | Array<{ key: string; value: string; enabled: boolean }>) => void;
  title: string;
  description: string;
  initialData: Record<string, string> | Array<{ key: string; value: string; enabled: boolean }>;
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
        const paramsObj = (initialData as Array<{ key: string; value: string; enabled: boolean }>).reduce((acc: Record<string, string>, param) => {
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
      } catch (e: unknown) {
        setIsValid(false);
        setError(e instanceof Error ? e.message : 'Invalid JSON');
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
    } catch (e: unknown) {
      showError('Save Error', e instanceof Error ? e.message : 'Failed to save changes');
    }
  };

  const handleCancel = () => {
    setJsonValue('');
    setError(null);
    setIsValid(true);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && handleCancel()}
      title={title}
      description={description}
      maxWidth="4xl"
    >
      <div className="space-y-4">
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
      </div>
    </Dialog>
  );
}
