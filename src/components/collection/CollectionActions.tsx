/**
 * CollectionActions - Action buttons component for collection operations
 *
 * Features:
 * - Premium interactive design with full theme support
 * - Import/Export functionality
 * - Bulk operations
 * - Search and filter controls
 */

import { Download, Plus, Search, Terminal, Upload } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface CollectionActionsProps {
  onImport: () => void;
  onExport: () => void;
  onCurlImport?: () => void;
  onSearch: (value: string) => void;
  searchValue: string;
  onNewCollection: () => void;
  onNewRequest?: () => void;
}

export const CollectionActions: React.FC<CollectionActionsProps> = ({
  onImport,
  onExport,
  onCurlImport,
  onSearch,
  searchValue,
  onNewCollection,
  onNewRequest,
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8 p-1">
      <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full lg:w-auto">
        <div className="relative flex-1 w-full max-w-md group">
          <div className="absolute inset-0 bg-primary/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500" />
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-muted-foreground/70 h-4 w-4 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search..."
              value={searchValue}
              onChange={e => onSearch(e.target.value)}
              className="pl-10 bg-background border-border hover:border-primary/50 focus-visible:ring-primary/30 transition-all font-medium h-10 w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
        <div className="flex bg-muted/30 border border-border rounded-lg p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onImport}
            className="flex items-center gap-2 hover:bg-background text-muted-foreground hover:text-foreground h-9"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          {onCurlImport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCurlImport}
              className="flex items-center gap-2 hover:bg-background text-muted-foreground hover:text-foreground h-9"
            >
              <Terminal className="h-4 w-4" />
              cURL
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2 hover:bg-background text-muted-foreground hover:text-foreground h-9"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="flex gap-2">
          {onNewRequest && (
            <Button
              variant="outline"
              onClick={onNewRequest}
              className="flex items-center gap-2 h-10 border-border hover:border-primary/50 transition-all bg-background"
            >
              <Plus className="h-4 w-4" />
              Request
            </Button>
          )}
          <Button 
            onClick={onNewCollection} 
            className="flex items-center gap-2 h-10 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Collection
          </Button>
        </div>
      </div>
    </div>
  );
};

