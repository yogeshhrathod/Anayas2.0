import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface EnvironmentVariable {
  key: string;
  value: string;
}

interface EnvironmentVariableProps {
  variables: Record<string, string>;
  onVariablesChange: (variables: Record<string, string>) => void;
  title?: string;
  description?: string;
  className?: string;
}

export function EnvironmentVariable({
  variables,
  onVariablesChange,
  title = "Environment Variables",
  description = "Manage key-value pairs for your environment",
  className = ""
}: EnvironmentVariableProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const variableEntries = Object.entries(variables);

  const handleAddVariable = () => {
    if (newKey.trim() && newValue.trim()) {
      const updatedVariables = {
        ...variables,
        [newKey.trim()]: newValue.trim()
      };
      onVariablesChange(updatedVariables);
      setNewKey('');
      setNewValue('');
      setIsAddingNew(false);
    }
  };

  const handleUpdateVariable = (oldKey: string, newKeyValue: string, newValueValue: string) => {
    if (newKeyValue.trim() && newValueValue.trim()) {
      const updatedVariables = { ...variables };
      
      // Remove old key if it changed
      if (oldKey !== newKeyValue.trim()) {
        delete updatedVariables[oldKey];
      }
      
      // Add/update with new key-value
      updatedVariables[newKeyValue.trim()] = newValueValue.trim();
      onVariablesChange(updatedVariables);
      setEditingKey(null);
    }
  };

  const handleDeleteVariable = (key: string) => {
    const updatedVariables = { ...variables };
    delete updatedVariables[key];
    onVariablesChange(updatedVariables);
  };

  const handleEditStart = (key: string) => {
    setEditingKey(key);
    setNewKey(key);
    setNewValue(variables[key]);
  };

  const handleEditCancel = () => {
    setEditingKey(null);
    setNewKey('');
    setNewValue('');
    setIsAddingNew(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing Variables */}
        {variableEntries.length > 0 && (
          <div className="space-y-2">
            {variableEntries.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                {editingKey === key ? (
                  // Edit Mode
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="Variable name"
                        className="text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Variable value"
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateVariable(key, newKey, newValue)}
                        disabled={!newKey.trim() || !newValue.trim()}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditCancel}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex-1 flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {key}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex-1 truncate">
                      {value}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditStart(key)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVariable(key)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add New Variable */}
        {isAddingNew && (
          <div className="p-3 border rounded-lg bg-card border-dashed">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="new-key" className="text-sm font-medium w-20">
                  Key:
                </Label>
                <Input
                  id="new-key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g., base_url, api_key"
                  className="text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="new-value" className="text-sm font-medium w-20">
                  Value:
                </Label>
                <Input
                  id="new-value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g., https://api.example.com"
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleAddVariable}
                  disabled={!newKey.trim() || !newValue.trim()}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditCancel}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {variableEntries.length === 0 && !isAddingNew && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No variables added yet</p>
            <p className="text-xs mt-1">Click "Add Variable" to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
