import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus } from 'lucide-react';
import { HeadersKeyValueEditor } from './ui/headers-key-value-editor';
import { ViewToggleButton } from './ui/view-toggle-button';
import { MonacoEditor } from './ui/monaco-editor';

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
  title = 'Environment Variables',
  description = 'Manage key-value pairs for your environment',
  className = '',
}: EnvironmentVariableProps) {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [bulkEditJson, setBulkEditJson] = useState('');

  // Toggle between table and JSON view
  const toggleView = () => {
    if (viewMode === 'table') {
      // Convert variables to JSON
      const jsonData = Object.keys(variables).reduce(
        (acc, key) => {
          if (key && variables[key]) {
            acc[key] = variables[key];
          }
          return acc;
        },
        {} as Record<string, string>
      );
      setBulkEditJson(JSON.stringify(jsonData, null, 2));
    } else {
      // Convert JSON back to variables
      try {
        const parsed = JSON.parse(bulkEditJson);
        onVariablesChange(parsed);
      } catch (e: unknown) {
        console.error(
          'Invalid JSON:',
          e instanceof Error ? e.message : 'Invalid JSON'
        );
        return;
      }
    }
    setViewMode(viewMode === 'table' ? 'json' : 'table');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                const newVariables = { ...variables, '': '' };
                onVariablesChange(newVariables);
              }}
              className="h-7 w-7 p-0"
              title="Add Variable"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <ViewToggleButton currentView={viewMode} onToggle={toggleView} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="border rounded-md bg-card">
          {viewMode === 'table' ? (
            <div className="p-3">
              <HeadersKeyValueEditor
                headers={variables}
                onChange={onVariablesChange}
                placeholder={{ key: 'Variable Name', value: 'Variable Value' }}
                addButtonText="Add Variable"
                emptyStateText="No variables added yet"
              />
            </div>
          ) : (
            <MonacoEditor
              value={bulkEditJson}
              onChange={value => setBulkEditJson(value)}
              language="json"
              placeholder='{"base_url": "https://api.example.com", "api_key": "your-api-key"}'
              title=""
              description=""
              height={200}
              showActions={true}
              validateJson={true}
              readOnly={false}
              minimap={false}
              fontSize={13}
              className="border-0"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
