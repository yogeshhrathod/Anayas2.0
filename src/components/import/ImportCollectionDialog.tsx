/**
 * ImportCollectionDialog - Dialog for importing Postman collections
 *
 * Allows users to:
 * - Select a Postman collection JSON file
 * - Auto-detect format (v1 or v2)
 * - Preview collection contents before import
 * - Configure import options (environment handling)
 * - Execute import with progress feedback
 */

import { AlertCircle, Check, FileJson, Globe, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ImportPreview } from './ImportPreview';

// Types for import
interface ImportResult {
  source: {
    format: string;
    version?: string;
    originalName: string;
  };
  collection: {
    name: string;
    description?: string;
  };
  folders: Array<{
    tempId: string;
    name: string;
    description?: string;
    path: string;
    parentTempId: string | null;
    order: number;
  }>;
  requests: Array<{
    name: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
    queryParams: Array<{ key: string; value: string; enabled: boolean }>;
    auth: any;
    folderTempId: string | null;
    order: number;
  }>;
  environments?: Array<{
    name: string;
    variables: Record<string, string>;
  }>;
  warnings: Array<{ code: string; message: string }>;
  errors: Array<{ code: string; message: string }>;
  stats: {
    totalFolders: number;
    totalRequests: number;
    totalEnvironments: number;
    skippedItems: number;
  };
}

interface FormatDetectionResult {
  format: string | null;
  version?: string;
  isValid: boolean;
  confidence: number;
}

interface ImportOptions {
  environmentMode: 'collection' | 'global' | 'skip';
  duplicateHandling: 'rename' | 'replace' | 'cancel';
  includeDisabled: boolean;
}

interface ImportCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (collectionId: number) => void;
}

type ImportStep = 'select' | 'preview' | 'importing';

export function ImportCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportCollectionDialogProps) {
  const [step, setStep] = useState<ImportStep>('select');
  const [fileName, setFileName] = useState<string>('');
  const [detectedFormat, setDetectedFormat] =
    useState<FormatDetectionResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Import options
  const [environmentMode, setEnvironmentMode] =
    useState<ImportOptions['environmentMode']>('collection');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess } = useToastNotifications();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open]);

  const resetState = () => {
    setStep('select');
    setFileName('');
    setDetectedFormat(null);
    setImportResult(null);
    setIsLoading(false);
    setIsImporting(false);
    setError(null);
    setEnvironmentMode('collection');
  };

  // Handle file selection
  const handleFileSelect = async () => {
    try {
      const filePath = await window.electronAPI.file.selectFile([
        { name: 'JSON Files', extensions: ['json'] },
      ]);

      if (!filePath) return;

      setIsLoading(true);
      setError(null);

      // Read file content
      const result = await window.electronAPI.file.readFile(filePath);
      if (!result.success) {
        setError(result.error || 'Failed to read file');
        setIsLoading(false);
        return;
      }

      setFileName(
        filePath.split('/').pop() ||
          filePath.split('\\').pop() ||
          'collection.json'
      );

      // Detect format
      const detection = await window.electronAPI.import.detectFormat(
        result.content
      );
      setDetectedFormat(detection);

      if (!detection.format || !detection.isValid) {
        setError(
          'Unable to detect collection format. Please ensure this is a valid Postman collection.'
        );
        setIsLoading(false);
        return;
      }

      // Parse the collection
      const parseResult = await window.electronAPI.import.parse(
        result.content,
        detection.format
      );

      if (!parseResult.success) {
        setError(parseResult.error || 'Failed to parse collection');
        setIsLoading(false);
        return;
      }

      setImportResult(parseResult.result);
      setStep('preview');
    } catch (e: any) {
      console.error('File selection failed:', e);
      setError(e.message || 'Failed to select file');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please drop a JSON file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      setFileName(file.name);

      // Detect format
      const detection = await window.electronAPI.import.detectFormat(content);
      setDetectedFormat(detection);

      if (!detection.format || !detection.isValid) {
        setError(
          'Unable to detect collection format. Please ensure this is a valid Postman collection.'
        );
        setIsLoading(false);
        return;
      }

      // Parse the collection
      const parseResult = await window.electronAPI.import.parse(
        content,
        detection.format
      );

      if (!parseResult.success) {
        setError(parseResult.error || 'Failed to parse collection');
        setIsLoading(false);
        return;
      }

      setImportResult(parseResult.result);
      setStep('preview');
    } catch (e: any) {
      console.error('Drop handling failed:', e);
      setError(e.message || 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Execute import
  const handleImport = async () => {
    if (!importResult) return;

    setIsImporting(true);
    setStep('importing');
    setError(null);

    try {
      const options: ImportOptions = {
        environmentMode,
        duplicateHandling: 'rename',
        includeDisabled: true,
      };

      const result = await window.electronAPI.import.execute(
        importResult,
        options
      );

      if (!result.success) {
        setError(result.error || 'Import failed');
        setStep('preview');
        setIsImporting(false);
        return;
      }

      // Show success message
      const message = [
        `${result.requestCount} request(s)`,
        result.folderCount > 0 ? `${result.folderCount} folder(s)` : null,
        result.environmentCount > 0
          ? `${result.environmentCount} environment(s)`
          : null,
      ]
        .filter(Boolean)
        .join(', ');

      showSuccess('Collection imported', {
        description: `Successfully imported ${message}`,
      });

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.warn('Import warnings:', result.warnings);
      }

      onSuccess?.(result.collectionId);
      onOpenChange(false);
    } catch (e: any) {
      console.error('Import failed:', e);
      setError(e.message || 'Import failed');
      setStep('preview');
    } finally {
      setIsImporting(false);
    }
  };

  // Format display name
  const getFormatDisplayName = () => {
    if (!detectedFormat?.format) return 'Unknown';
    if (detectedFormat.format === 'postman-v2') {
      return `Postman Collection v2${detectedFormat.version ? ` (${detectedFormat.version})` : ''}`;
    }
    if (detectedFormat.format === 'postman-v1') {
      return 'Postman Collection v1 (Legacy)';
    }
    return detectedFormat.format;
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import Collection"
      description="Import a Postman collection to add it to your workspace"
      maxWidth="2xl"
      className="w-[90vw] max-w-2xl"
    >
      <div className="space-y-4">
        {/* Step 1: File Selection */}
        {step === 'select' && (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={handleFileSelect}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Processing file...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileJson className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Drop a Postman collection here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Supported Formats Info */}
            <div className="text-xs text-muted-foreground text-center">
              Supports Postman Collection v1 (Legacy) and v2.x formats
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  // Handle via drop logic
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  handleDrop({
                    dataTransfer: dt,
                    preventDefault: () => {},
                    stopPropagation: () => {},
                  } as any);
                }
              }}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && importResult && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileJson className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {getFormatDisplayName()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('select')}
              >
                Change
              </Button>
            </div>

            {/* Preview Component */}
            <ImportPreview importResult={importResult} />

            {/* Warnings */}
            {importResult.warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Warnings ({importResult.warnings.length})
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                  {importResult.warnings.slice(0, 5).map((w, i) => (
                    <li key={i}>• {w.message}</li>
                  ))}
                  {importResult.warnings.length > 5 && (
                    <li>• ...and {importResult.warnings.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Environment Options */}
            {importResult.environments &&
              importResult.environments.length > 0 && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm">Environment Variables</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Found {importResult.environments.length} environment(s) with
                    variables
                  </p>
                  <Select
                    value={environmentMode}
                    onValueChange={v =>
                      setEnvironmentMode(v as ImportOptions['environmentMode'])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collection">
                        Add to Collection (Recommended)
                      </SelectItem>
                      <SelectItem value="global">
                        Add as Global Environment
                      </SelectItem>
                      <SelectItem value="skip">
                        Don't Import Variables
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleImport}
                className="flex-1"
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Import Collection
                  </>
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

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Importing collection...
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Dialog>
  );
}
