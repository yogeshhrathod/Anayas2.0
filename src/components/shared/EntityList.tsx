/**
 * EntityList - Generic list component with filtering, search, and sorting
 * 
 * Provides a consistent list layout with:
 * - Search and filter controls
 * - Sortable columns
 * - Pagination
 * - Empty state handling
 * - Loading states
 * 
 * @example
 * ```tsx
 * <EntityList
 *   items={collections}
 *   columns={[
 *     { key: 'name', label: 'Name', sortable: true },
 *     { key: 'requests', label: 'Requests', sortable: true }
 *   ]}
 *   onItemClick={(item) => handleItemClick(item)}
 *   renderItem={(item) => <CollectionItem item={item} />}
 *   emptyState={{
 *     icon: <FolderPlus className="h-12 w-12" />,
 *     title: 'No collections yet',
 *     description: 'Create your first collection to get started'
 *   }}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EntityListColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface EntityListFilter {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

export interface EntityListEmptyState {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export interface EntityListProps<T> {
  items: T[];
  columns: EntityListColumn<T>[];
  filters?: EntityListFilter[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  onItemClick?: (item: T) => void;
  renderItem?: (item: T) => React.ReactNode;
  emptyState?: EntityListEmptyState;
  loading?: boolean;
  className?: string;
  itemClassName?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export const EntityList = <T extends Record<string, any>>({
  items,
  columns,
  filters = [],
  searchPlaceholder = 'Search...',
  searchKeys = [],
  onItemClick,
  renderItem,
  emptyState,
  loading = false,
  className = '',
  itemClassName = ''
}: EntityListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply search
    if (searchTerm && searchKeys.length > 0) {
      filtered = filtered.filter(item =>
        searchKeys.some(key => {
          const value = item[key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        filtered = filtered.filter(item => {
          const value = item[filterKey];
          return value && value.toString() === filterValue;
        });
      }
    });

    return filtered;
  }, [items, searchTerm, searchKeys, activeFilters]);

  // Sort items
  const sortedItems = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (sortedItems.length === 0 && emptyState) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-muted-foreground mb-4">
          {emptyState.icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{emptyState.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {emptyState.description}
        </p>
        {emptyState.action}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={activeFilters[filter.key] || 'all'}
            onValueChange={(value) => 
              setActiveFilters(prev => ({ ...prev, [filter.key]: value }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sortedItems.length} of {items.length} items
        </p>
      </div>

      {/* List Items */}
      <div className="space-y-2">
        {sortedItems.map((item, index) => (
          <div
            key={index}
            className={cn(
              'p-4 rounded-lg border bg-card hover:shadow-md transition-shadow',
              onItemClick && 'cursor-pointer hover:bg-accent/5',
              itemClassName
            )}
            onClick={() => onItemClick?.(item)}
          >
            {renderItem ? (
              renderItem(item)
            ) : (
              <div className="space-y-2">
                {columns.map((column) => (
                  <div key={String(column.key)} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{column.label}:</span>
                    <div className="flex items-center gap-2">
                      {column.render ? (
                        column.render(item)
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {item[column.key]}
                        </span>
                      )}
                      {column.sortable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSort(String(column.key));
                          }}
                        >
                          {getSortIcon(String(column.key))}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
