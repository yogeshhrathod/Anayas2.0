import { FileUp, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { VariableInputUnified } from './variable-input-unified';

interface KeyValueItem {
  key: string;
  value: string;
  enabled: boolean;
}

interface KeyValueEditorProps {
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
  placeholder?: {
    key: string;
    value: string;
  };
  showEnabled?: boolean;
  allowFile?: boolean;
  className?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
  placeholder = { key: 'Key', value: 'Value' },
  showEnabled = true,
  allowFile = false,
  className = '',
}) => {
  const updateItem = (
    index: number,
    field: keyof KeyValueItem,
    value: string | boolean
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, { key: '', value: '', enabled: true }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleFileSelect = async (index: number) => {
    try {
      const filePath = await window.electronAPI.file.selectFile({});
      if (filePath) {
        updateItem(index, 'value', `FILE::${filePath}`);
      }
    } catch (error) {
      console.error('Failed to select file', error);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No items added yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {showEnabled && (
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={e => updateItem(index, 'enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
              )}
              <Input
                placeholder={placeholder.key}
                value={item.key}
                onChange={e => updateItem(index, 'key', e.target.value)}
                className="flex-1"
              />
              <VariableInputUnified
                variant="overlay"
                placeholder={placeholder.value}
                value={item.value}
                onChange={value => updateItem(index, 'value', value)}
                className="flex-1"
              />
              {allowFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileSelect(index)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  title="Select File"
                >
                  <FileUp className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      )}
    </div>
  );
};
