import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { VariableInputUnified } from './variable-input-unified';
import { Trash2, Plus } from 'lucide-react';

interface HeadersKeyValueEditorProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
  placeholder?: {
    key: string;
    value: string;
  };
  className?: string;
  addButtonText?: string;
  emptyStateText?: string;
}

export const HeadersKeyValueEditor: React.FC<HeadersKeyValueEditorProps> = ({
  headers,
  onChange,
  placeholder = { key: 'Header Name', value: 'Header Value' },
  className = '',
  addButtonText = 'Add Header',
  emptyStateText = 'No headers added yet'
}) => {
  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    const newHeaders = { ...headers };
    if (oldKey !== newKey) {
      delete newHeaders[oldKey];
    }
    if (newKey.trim()) {
      newHeaders[newKey] = value;
    }
    onChange(newHeaders);
  };

  const addHeader = () => {
    onChange({ ...headers, '': '' });
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    onChange(newHeaders);
  };

  const headerEntries = Object.entries(headers);

  return (
    <div className={`space-y-2 ${className}`}>
      {headerEntries.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">{emptyStateText}</p>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={addHeader}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            {addButtonText}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {headerEntries.map(([key, value], index) => (
            <div key={`${key}-${value}-${index}`} className="flex items-center gap-2">
              <Input
                placeholder={placeholder.key}
                value={key}
                onChange={(e) => updateHeader(key, e.target.value, value)}
                className="flex-1"
              />
              <VariableInputUnified
                variant="overlay"
                placeholder={placeholder.value}
                value={value}
                onChange={(newValue) => updateHeader(key, key, newValue)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => removeHeader(key)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={addHeader}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {addButtonText}
          </Button>
        </div>
      )}
    </div>
  );
};
