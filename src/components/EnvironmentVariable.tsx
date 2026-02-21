import { Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { HeadersKeyValueEditor } from './ui/headers-key-value-editor';
import { MonacoEditor } from './ui/monaco-editor';
import { ViewToggleButton } from './ui/view-toggle-button';

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
      } catch (e: any) {
        console.error('Invalid JSON:', e.message);
        return;
      }
    }
    setViewMode(viewMode === 'table' ? 'json' : 'table');
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with optional title and always-visible controls */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          {title && <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>}
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <div className="flex gap-1.5 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => {
              const newVariables = { ...variables, '': '' };
              onVariablesChange(newVariables);
            }}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
            title="Add Variable"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <ViewToggleButton currentView={viewMode} onToggle={toggleView} className="h-8 rounded-lg" />
        </div>
      </div>

      <div className="flex-1 relative">
        {viewMode === 'table' ? (
          <div className="p-4 pt-0">
            <HeadersKeyValueEditor
              headers={variables}
              onChange={onVariablesChange}
              placeholder={{ key: 'Variable Name', value: 'Variable Value' }}
              addButtonText="Add Variable"
              emptyStateText="No variables added yet"
            />
          </div>
        ) : (
          <div style={{ height: 350 }}>
            <MonacoEditor
              value={bulkEditJson}
              onChange={value => setBulkEditJson(value)}
              language="json"
              placeholder='{"base_url": "https://api.example.com", "api_key": "your-api-key"}'
              title=""
              description=""
              height={350}
              showActions={false}
              validateJson={true}
              readOnly={false}
              minimap={false}
              fontSize={13}
              className="border-0 bg-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
}
