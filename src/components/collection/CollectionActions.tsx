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
    <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-10">
      {/* Search Bar Container */}
      <div className="relative flex-1 w-full max-w-md group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/0 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 text-muted-foreground/50 h-4 w-4 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Filter by name..."
            value={searchValue}
            onChange={e => onSearch(e.target.value)}
            className="pl-10 h-11 bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/30 focus:border-primary/50 focus:ring-primary/10 rounded-xl transition-all font-medium w-full"
          />
          {searchValue && (
            <button 
              onClick={() => onSearch('')}
              className="absolute right-3 p-1 hover:bg-muted rounded-md text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5 rotate-45" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        {/* Import/Export Group */}
        <div className="flex bg-muted/40 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onImport}
            className="h-8 rounded-lg gap-2 text-muted-foreground hover:text-foreground hover:bg-background/80 px-3"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Import</span>
          </Button>
          
          {onCurlImport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCurlImport}
              className="h-8 rounded-lg gap-2 text-muted-foreground hover:text-foreground hover:bg-background/80 px-3 border-x border-border/10"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">cURL</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="h-8 rounded-lg gap-2 text-muted-foreground hover:text-foreground hover:bg-background/80 px-3"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Export</span>
          </Button>
        </div>

        <div className="h-6 w-px bg-border/40 mx-1 hidden sm:block" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onNewRequest && (
            <Button
              variant="outline"
              onClick={onNewRequest}
              className="h-10 px-4 rounded-xl border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all font-semibold gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Request</span>
            </Button>
          )}
          
          <Button 
            onClick={onNewCollection} 
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-semibold gap-2 border-0"
          >
            <Plus className="h-4 w-4" />
            <span>Collection</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

