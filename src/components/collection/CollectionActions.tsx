/**
 * CollectionActions - Action buttons component for collection operations
 * 
 * Features:
 * - Import/Export functionality
 * - Bulk operations
 * - Search and filter controls
 * 
 * @example
 * ```tsx
 * <CollectionActions
 *   onImport={handleImport}
 *   onExport={handleExport}
 *   onSearch={handleSearch}
 *   searchValue={searchValue}
 * />
 * ```
 */

import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Upload, Download, Search } from 'lucide-react';

export interface CollectionActionsProps {
  onImport: () => void;
  onExport: () => void;
  onSearch: (value: string) => void;
  searchValue: string;
  onNewCollection: () => void;
  onNewRequest?: () => void;
}

export const CollectionActions: React.FC<CollectionActionsProps> = ({
  onImport,
  onExport,
  onSearch,
  searchValue,
  onNewCollection,
  onNewRequest
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search collections..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onImport} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
        <Button variant="outline" onClick={onExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        {onNewRequest && (
          <Button variant="outline" onClick={onNewRequest} className="flex items-center gap-2">
            <span>+</span>
            New Request
          </Button>
        )}
        <Button onClick={onNewCollection} className="flex items-center gap-2">
          <span>+</span>
          New Collection
        </Button>
      </div>
    </div>
  );
};
