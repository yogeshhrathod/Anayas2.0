/**
 * EnvironmentExportDialog - Dialog for exporting environments
 *
 * Allows users to:
 * - Select environments to export
 * - Choose export format (JSON, .env, Postman)
 * - Download exported file
 */

import { Download, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useToastNotifications } from '../../hooks/useToastNotifications';
import logger from '../../lib/logger';
import type { Environment } from '../../types/entities';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Label } from '../ui/label';
import { FormatSelector, type Format } from './FormatSelector';

interface EnvironmentExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environments: Environment[];
}

export function EnvironmentExportDialog({
  open,
  onOpenChange,
  environments,
}: EnvironmentExportDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [format, setFormat] = useState<Format>('json');
  const [isExporting, setIsExporting] = useState(false);
  const { showSuccess, showError } = useToastNotifications();

  // Select all by default when dialog opens
  useEffect(() => {
    if (open && environments.length > 0) {
      setSelectedIds(new Set(environments.map(e => e.id!).filter(Boolean)));
    }
  }, [open, environments]);

  const handleToggleAll = useCallback(() => {
    if (selectedIds.size === environments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(environments.map(e => e.id!).filter(Boolean)));
    }
  }, [selectedIds, environments]);

  const handleToggleEnvironment = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (selectedIds.size === 0) {
      showError(
        'No environments selected',
        'Please select at least one environment to export'
      );
      return;
    }

    setIsExporting(true);
    try {
      const result = await window.electronAPI.env.export(
        Array.from(selectedIds),
        format
      );

      if (!result.success) {
        showError(
          'Export failed',
          result.error || 'Failed to export environments'
        );
        return;
      }

      // Create download
      const blob = new Blob([result.content], {
        type:
          format === 'json' || format === 'postman'
            ? 'application/json'
            : 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Export successful', {
        description: `Exported ${selectedIds.size} environment${selectedIds.size !== 1 ? 's' : ''} as ${format.toUpperCase()}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      logger.error('Failed to export environments', { error });
      showError(
        'Export failed',
        error.message || 'Failed to export environments'
      );
    } finally {
      setIsExporting(false);
    }
  }, [selectedIds, format, showSuccess, showError, onOpenChange]);

  const allSelected =
    selectedIds.size === environments.length && environments.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Export Environments"
      description="Select environments to export and choose a format"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <FormatSelector
            value={format}
            onValueChange={setFormat}
            label="Export Format"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Environments</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleAll}
                className="h-8 text-xs"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="h-[300px] overflow-y-auto rounded-md border">
              <div className="p-4 space-y-2">
                {environments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No environments to export
                  </p>
                ) : (
                  environments.map(env => {
                    const isSelected = selectedIds.has(env.id!);
                    const variableCount = Object.keys(
                      env.variables || {}
                    ).length;
                    return (
                      <div
                        key={env.id || `env-${env.name}`}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handleToggleEnvironment(env.id!)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleEnvironment(env.id!)}
                          onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                            e.stopPropagation()
                          }
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {env.displayName}
                            </p>
                            {env.isDefault === 1 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {variableCount} variable
                            {variableCount !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Name: {env.name}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {environments.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedIds.size} of {environments.length} environment
                {environments.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedIds.size === 0 || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
