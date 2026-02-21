import { Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { VariableInputUnified } from './variable-input-unified';

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
  emptyStateText = 'No headers added yet',
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
    <div className={`space-y-4 ${className}`}>
      {headerEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/50 bg-muted/5">
          <p className="text-sm text-muted-foreground mb-4">{emptyStateText}</p>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={addHeader}
            className="h-9 gap-2 px-4 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary"
          >
            <Plus className="h-4 w-4" />
            {addButtonText}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-center gap-3 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            <div className="flex-1">Variable Name</div>
            <div className="flex-1">Variable Value</div>
            <div className="w-9" /> {/* Spacer for delete button */}
          </div>

          <div className="space-y-2">
            {headerEntries.map(([key, value], index) => (
              <div 
                key={index} 
                className="group flex items-center gap-3 p-1 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <Input
                    placeholder={placeholder.key}
                    value={key}
                    onChange={e => updateHeader(key, e.target.value, value)}
                    className="h-9 bg-background/50 border-border/50 focus:bg-background transition-all"
                  />
                </div>
                <div className="flex-1">
                  <VariableInputUnified
                    variant="overlay"
                    placeholder={placeholder.value}
                    value={value}
                    onChange={newValue => updateHeader(key, key, newValue)}
                    className="h-9 bg-background/50 border-border/50 focus:bg-background transition-all"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => removeHeader(key)}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={addHeader}
            className="w-full h-10 gap-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            {addButtonText}
          </Button>
        </div>
      )}
    </div>
  );
};
