/**
 * CurlImportDialog - Dialog for importing cURL commands
 *
 * Allows users to:
 * - Paste cURL commands in a textarea
 * - Upload a file containing cURL commands
 * - Preview parsed requests
 * - Save to collection/folder
 * - Bulk import multiple commands
 */

import { AlertCircle, Check, FileUp, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import logger from '../../lib/logger';
import { Request } from '../../types/entities';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

interface Collection {
  id: number;
  name: string;
  isFavorite: number;
}

interface Folder {
  id: number;
  name: string;
  collectionId: number;
}

interface CurlImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    requests: Request[],
    collectionId?: number,
    folderId?: number
  ) => Promise<void>;
  requireCollection?: boolean; // If false, collection selection is optional (for home page)
}

interface ParsedRequest {
  success: boolean;
  request?: Request;
  error?: string;
}

export function CurlImportDialog({
  open,
  onOpenChange,
  onImport,
  requireCollection = true,
}: CurlImportDialogProps) {
  const [curlCommands, setCurlCommands] = useState('');
  const [parsedRequests, setParsedRequests] = useState<ParsedRequest[]>([]);
  const [requestNames, setRequestNames] = useState<Record<number, string>>({});
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToastNotifications();

  useEffect(() => {
    if (open) {
      loadCollections();
      setCurlCommands('');
      setParsedRequests([]);
      setRequestNames({});
      setError(null);
      setSelectedCollectionId(null);
      setSelectedFolderId(null);
    }
  }, [open]);

  const loadCollections = async () => {
    try {
      const [collectionsData, foldersData] = await Promise.all([
        window.electronAPI.collection.list(),
        window.electronAPI.folder.list(),
      ]);
      setCollections(collectionsData);
      setFolders(foldersData);
    } catch (e: any) {
      logger.error('Failed to load collections', { error: e.message });
      showError('Load failed', 'Failed to load collections');
    }
  };

  const handleParse = async () => {
    if (!curlCommands.trim()) {
      setError('Please enter a cURL command');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      // Split by newlines to support bulk import
      const commands = curlCommands
        .split('\n')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd && cmd.toLowerCase().includes('curl'));

      if (commands.length === 0) {
        setError('No valid cURL commands found');
        setIsParsing(false);
        return;
      }

      if (commands.length === 1) {
        // Single command
        const result = await window.electronAPI.curl.parse(commands[0]);
        if (result.success && result.request) {
          setParsedRequests([{ success: true, request: result.request }]);
          // Initialize name for editing
          setRequestNames({ 0: result.request.name });
        } else {
          setParsedRequests([
            { success: false, error: result.error || 'Failed to parse' },
          ]);
          setError(result.error || 'Failed to parse cURL command');
        }
      } else {
        // Bulk import
        const results = await window.electronAPI.curl.importBulk(commands);
        if (results.success && results.results) {
          setParsedRequests(results.results);
          // Initialize names for all successful requests
          const names: Record<number, string> = {};
          results.results.forEach((r: ParsedRequest, index: number) => {
            if (r.success && r.request) {
              names[index] = r.request.name;
            }
          });
          setRequestNames(names);
          const successCount = results.results.filter(
            (r: ParsedRequest) => r.success
          ).length;
          if (successCount < results.results.length) {
            setError(
              `${results.results.length - successCount} command(s) failed to parse`
            );
          }
        } else {
          setError(results.error || 'Failed to parse cURL commands');
        }
      }
    } catch (e: any) {
      logger.error('Failed to parse cURL', { error: e.message });
      setError(e.message || 'Failed to parse cURL command');
      setParsedRequests([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setCurlCommands(text);
      // Auto-parse after file upload
      setTimeout(() => {
        handleParse();
      }, 100);
    } catch (e: any) {
      logger.error('Failed to read file for cURL import', { error: e.message });
      showError('File read failed', 'Failed to read the selected file');
    }
  };

  const handleImport = async () => {
    if (requireCollection && !selectedCollectionId) {
      setError('Please select a collection');
      return;
    }

    const successfulRequests = parsedRequests
      .map((result, index) => {
        if (!result.success || !result.request) {
          return null;
        }
        // Get the edited name or use the original
        const editedName = requestNames[index];
        return {
          ...result.request,
          name: editedName || result.request.name,
        };
      })
      .filter((r): r is Request => r !== null);

    if (successfulRequests.length === 0) {
      setError('No valid requests to import');
      return;
    }

    setIsImporting(true);
    try {
      await onImport(
        successfulRequests,
        selectedCollectionId || undefined,
        selectedFolderId || undefined
      );
      showSuccess('Import successful', {
        description: `Imported ${successfulRequests.length} request(s)`,
      });
      onOpenChange(false);
    } catch (e: any) {
      logger.error('Failed to import requests from cURL', { error: e.message });
      showError('Import failed', e.message || 'Failed to import requests');
    } finally {
      setIsImporting(false);
    }
  };

  const handleNameChange = (index: number, newName: string) => {
    setRequestNames(prev => ({
      ...prev,
      [index]: newName,
    }));
  };

  const getFoldersForCollection = (collectionId: number) => {
    return folders.filter(folder => folder.collectionId === collectionId);
  };

  if (!open) return null;

  const successfulCount = parsedRequests.filter(r => r.success).length;
  const failedCount = parsedRequests.filter(r => !r.success).length;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import cURL Commands"
      description="Paste cURL commands or upload a file to import requests"
      maxWidth="4xl"
      className="w-[90vw] max-h-[90vh]"
    >
      <div className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Label>Upload File</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.sh,.bash"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <FileUp className="h-4 w-4" />
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground">
              Supports .txt, .sh, .bash files
            </span>
          </div>
        </div>

        {/* cURL Commands Textarea */}
        <div className="space-y-2">
          <Label htmlFor="curl-commands">cURL Commands</Label>
          <Textarea
            id="curl-commands"
            value={curlCommands}
            onChange={e => setCurlCommands(e.target.value)}
            placeholder="Paste cURL command(s) here...&#10;&#10;Example:&#10;curl -X GET https://api.example.com/users&#10;&#10;For bulk import, separate commands with newlines."
            className="font-mono text-xs min-h-[200px]"
          />
        </div>

        {/* Parse Button */}
        <Button
          onClick={handleParse}
          disabled={isParsing || !curlCommands.trim()}
        >
          {isParsing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Parsing...
            </>
          ) : (
            'Parse Commands'
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Parsed Results */}
        {parsedRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Parsed Requests</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {successfulCount > 0 && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Check className="h-3 w-3" />
                    {successfulCount} successful
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <X className="h-3 w-3" />
                    {failedCount} failed
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {parsedRequests.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  {result.success && result.request ? (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label
                          htmlFor={`request-name-${index}`}
                          className="text-xs"
                        >
                          Request Name
                        </Label>
                        <Input
                          id={`request-name-${index}`}
                          value={requestNames[index] ?? result.request.name}
                          onChange={e =>
                            handleNameChange(index, e.target.value)
                          }
                          className="h-8 text-sm"
                          placeholder="Enter request name"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.request.method} {result.request.url}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>{result.error || 'Failed to parse'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Collection Selection - Only show if required */}
            {successfulCount > 0 && requireCollection && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="collection-select">Collection *</Label>
                  <Select
                    value={selectedCollectionId?.toString() || ''}
                    onValueChange={value => {
                      setSelectedCollectionId(parseInt(value));
                      setSelectedFolderId(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map(collection => (
                        <SelectItem
                          key={collection.id}
                          value={collection.id.toString()}
                        >
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Folder Selection */}
                {selectedCollectionId &&
                  getFoldersForCollection(selectedCollectionId).length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="folder-select">Folder (Optional)</Label>
                      <Select
                        value={selectedFolderId?.toString() || 'none'}
                        onValueChange={value =>
                          setSelectedFolderId(
                            value === 'none' ? null : parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No folder</SelectItem>
                          {getFoldersForCollection(selectedCollectionId).map(
                            folder => (
                              <SelectItem
                                key={folder.id}
                                value={folder.id.toString()}
                              >
                                {folder.name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* Import Button */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleImport}
                    disabled={
                      isImporting ||
                      (requireCollection && !selectedCollectionId)
                    }
                    className="flex-1"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      `Import ${successfulCount} Request(s)`
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isImporting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Import Button for Home Page (no collection required) */}
            {successfulCount > 0 && !requireCollection && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load ${successfulCount} Request(s)`
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
