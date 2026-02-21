/**
 * EnvironmentImportDialog - Dialog for importing environments
 *
 * Allows users to:
 * - Select an environment file
 * - Auto-detect format (JSON, .env, Postman)
 * - Preview imported environments
 * - Resolve conflicts
 * - Execute import
 */

import { AlertCircle, FileText, Loader2, Upload } from 'lucide-react';
import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import logger from '../../lib/logger';
import type { Environment } from '../../types/entities';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { FormatSelector, type Format } from './FormatSelector';
import { ImportPreview, type ConflictResolution } from './ImportPreview';

// Lazy load ImportPreview to reduce initial bundle
const ImportPreviewLazy = lazy(() =>
  Promise.resolve({ default: ImportPreview })
);

interface EnvironmentConflict {
  environmentName: string;
  existingId: number;
  importedEnvironment: Environment;
}

interface ImportResult {
  success: boolean;
  environments: Environment[];
  warnings: string[];
  errors: string[];
  conflicts: EnvironmentConflict[];
}

type ImportStep = 'select' | 'preview' | 'importing';

interface EnvironmentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EnvironmentImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: EnvironmentImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('select');
  const [fileName, setFileName] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<Format | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<Format>('json');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<
    Map<string, ConflictResolution>
  >(new Map());
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToastNotifications();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep('select');
      setFileName('');
      setFileContent('');
      setDetectedFormat(null);
      setSelectedFormat('json');
      setImportResult(null);
      setConflictResolutions(new Map());
      setIsImporting(false);
    }
  }, [open]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setFileName(file.name);
        const content = await file.text();
        setFileContent(content);

        // Auto-detect format
        const detection = await window.electronAPI.env.detectFormat(content);
        if (detection.format !== 'unknown' && detection.isValid) {
          setDetectedFormat(detection.format as Format);
          setSelectedFormat(detection.format as Format);
        }

        // Parse immediately
        await handleParse(content, detection.format as Format);
      } catch (error: any) {
        logger.error('Failed to read environment file', { error });
        showError(
          'File read failed',
          error.message || 'Failed to read the selected file'
        );
      }
    },
    [showError]
  );

  const handleParse = useCallback(
    async (content: string, format?: Format) => {
      try {
        const result = await window.electronAPI.env.import(
          content,
          format || 'auto'
        );

        if (result.success) {
          setImportResult(result);
          setStep('preview');
        } else {
          showError(
            'Import failed',
            result.errors.join(', ') || 'Failed to parse file'
          );
        }
      } catch (error: any) {
        logger.error('Failed to parse environment file', { error });
        showError('Parse failed', error.message || 'Failed to parse file');
      }
    },
    [showError]
  );

  const handleConflictResolution = useCallback(
    (environmentName: string, resolution: ConflictResolution) => {
      setConflictResolutions(prev => {
        const next = new Map(prev);
        next.set(environmentName, resolution);
        return next;
      });
    },
    []
  );

  const handleImport = useCallback(async () => {
    if (!importResult) return;

    setIsImporting(true);
    try {
      const db = await window.electronAPI.env.list();
      const existingEnvironments = db as Environment[];

      // Process environments with conflict resolutions
      const environmentsToImport: Environment[] = [];
      const skippedNames = new Set<string>();

      for (const env of importResult.environments) {
        const conflict = importResult.conflicts.find(
          c => c.environmentName === env.name
        );
        const resolution = conflict ? conflictResolutions.get(env.name) : null;

        if (resolution === 'skip') {
          skippedNames.add(env.name);
          continue;
        }

        if (resolution === 'overwrite') {
          // Find existing environment and update it
          const existing = existingEnvironments.find(e => e.name === env.name);
          if (existing?.id) {
            await window.electronAPI.env.save({
              ...env,
              id: existing.id,
            });
          } else {
            environmentsToImport.push(env);
          }
        } else if (resolution === 'rename') {
          // Generate new unique name
          let newName = `${env.name}_imported`;
          let counter = 1;
          while (
            existingEnvironments.some(e => e.name === newName) ||
            environmentsToImport.some(e => e.name === newName)
          ) {
            newName = `${env.name}_imported_${counter}`;
            counter++;
          }
          environmentsToImport.push({
            ...env,
            name: newName,
            displayName: `${env.displayName} (Imported)`,
          });
        } else {
          // No conflict, import as-is
          environmentsToImport.push(env);
        }
      }

      // Import new environments
      for (const env of environmentsToImport) {
        await window.electronAPI.env.save(env);
      }

      const importedCount =
        environmentsToImport.length +
        (importResult.environments.length -
          environmentsToImport.length -
          skippedNames.size);

      showSuccess('Import successful', {
        description: `Imported ${importedCount} environment${importedCount !== 1 ? 's' : ''}`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      logger.error('Failed to import environments', { error });
      showError(
        'Import failed',
        error.message || 'Failed to import environments'
      );
    } finally {
      setIsImporting(false);
    }
  }, [
    importResult,
    conflictResolutions,
    showSuccess,
    showError,
    onSuccess,
    onOpenChange,
  ]);

  const handleBack = useCallback(() => {
    setStep('select');
    setImportResult(null);
    setConflictResolutions(new Map());
  }, []);

  const allConflictsResolved = useCallback(() => {
    if (!importResult || importResult.conflicts.length === 0) return true;
    return importResult.conflicts.every(conflict =>
      conflictResolutions.has(conflict.environmentName)
    );
  }, [importResult, conflictResolutions]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import Environments"
      description="Import environments from JSON, .env, or Postman format"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {step === 'select' && (
          <>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="file-input"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JSON, .env, or Postman format
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".json,.env"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {fileName && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{fileName}</span>
                  {detectedFormat && (
                    <span className="text-xs text-muted-foreground">
                      Detected: {detectedFormat}
                    </span>
                  )}
                </div>
              )}

              <FormatSelector
                value={selectedFormat}
                onValueChange={setSelectedFormat}
                label="Format (optional)"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {fileContent && (
                <Button
                  onClick={() => handleParse(fileContent, selectedFormat)}
                >
                  Continue
                </Button>
              )}
            </div>
          </>
        )}

        {step === 'preview' && importResult && (
          <>
            <Suspense fallback={<div>Loading preview...</div>}>
              <ImportPreviewLazy
                environments={importResult.environments}
                conflicts={importResult.conflicts}
                conflictResolutions={conflictResolutions}
                onConflictResolution={handleConflictResolution}
              />
            </Suspense>

            {importResult.warnings.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="flex-1 text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">Warnings</p>
                  <ul className="list-disc list-inside mt-1 text-xs">
                    {importResult.warnings.map((warning, i) => (
                      <li key={`warning-${i}-${warning.substring(0, 20)}`}>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!allConflictsResolved() || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import'
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </Dialog>
  );
}
