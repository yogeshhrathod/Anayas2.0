/**
 * ImportPreview - Tree view preview of collection to be imported
 *
 * Shows:
 * - Collection name and description
 * - Folder structure with nesting
 * - Request list with methods
 * - Summary statistics
 */

import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';

// Method badge colors
const methodColors: Record<string, string> = {
  GET: 'bg-green-500/10 text-green-600 dark:text-green-400',
  POST: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  PUT: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  PATCH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400',
  HEAD: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  OPTIONS: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
};

interface ImportResult {
  collection: {
    name: string;
    description?: string;
  };
  folders: Array<{
    tempId: string;
    name: string;
    path: string;
    parentTempId: string | null;
  }>;
  requests: Array<{
    name: string;
    method: string;
    url: string;
    folderTempId: string | null;
  }>;
  stats: {
    totalFolders: number;
    totalRequests: number;
    totalEnvironments: number;
  };
}

interface ImportPreviewProps {
  importResult: ImportResult;
}

interface TreeNode {
  id: string;
  type: 'folder' | 'request';
  name: string;
  method?: string;
  url?: string;
  children?: TreeNode[];
}

export function ImportPreview({ importResult }: ImportPreviewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['root'])
  );

  // Build tree structure
  const tree = useMemo(() => {
    const rootNodes: TreeNode[] = [];
    const folderMap = new Map<string, TreeNode>();

    // Create folder nodes
    for (const folder of importResult.folders) {
      const node: TreeNode = {
        id: folder.tempId,
        type: 'folder',
        name: folder.name,
        children: [],
      };
      folderMap.set(folder.tempId, node);
    }

    // Build folder hierarchy
    for (const folder of importResult.folders) {
      const node = folderMap.get(folder.tempId)!;
      if (folder.parentTempId) {
        const parent = folderMap.get(folder.parentTempId);
        if (parent) {
          parent.children!.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    }

    // Add requests
    for (const request of importResult.requests) {
      const node: TreeNode = {
        id: `req-${request.name}-${request.method}-${request.url}`,
        type: 'request',
        name: request.name,
        method: request.method,
        url: request.url,
      };

      if (request.folderTempId) {
        const parent = folderMap.get(request.folderTempId);
        if (parent) {
          parent.children!.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    }

    return rootNodes;
  }, [importResult]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Expand all folders on initial render
  useState(() => {
    const allFolderIds = importResult.folders.map(f => f.tempId);
    setExpandedFolders(new Set(['root', ...allFolderIds]));
  });

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer',
            depth > 0 && 'ml-4'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() =>
            node.type === 'folder' && hasChildren && toggleFolder(node.id)
          }
        >
          {node.type === 'folder' ? (
            <>
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )
              ) : (
                <span className="w-3" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-yellow-500" />
              ) : (
                <Folder className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm truncate flex-1">{node.name}</span>
              {hasChildren && (
                <span className="text-xs text-muted-foreground">
                  {node.children!.length}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="w-3" />
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded w-12 text-center flex-shrink-0',
                  methodColors[node.method || 'GET']
                )}
              >
                {node.method}
              </span>
              <span className="text-sm truncate flex-1">{node.name}</span>
            </>
          )}
        </div>

        {node.type === 'folder' && isExpanded && node.children && (
          <div>{node.children.map(child => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Collection Header */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <h3 className="font-medium text-sm">{importResult.collection.name}</h3>
        {importResult.collection.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {importResult.collection.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Folder className="h-3 w-3" />
          {importResult.stats.totalFolders} folder(s)
        </span>
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {importResult.stats.totalRequests} request(s)
        </span>
        {importResult.stats.totalEnvironments > 0 && (
          <span>{importResult.stats.totalEnvironments} environment(s)</span>
        )}
      </div>

      {/* Tree View */}
      <div className="h-[250px] border rounded-lg overflow-y-auto">
        <div className="p-2">
          {tree.length > 0 ? (
            tree.map(node => renderNode(node))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              No items to import
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



