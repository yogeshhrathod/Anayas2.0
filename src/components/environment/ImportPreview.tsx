/**
 * ImportPreview - Preview imported environments before committing
 *
 * Shows environment names, variable counts, and conflicts
 */

import { AlertCircle, Check, X } from 'lucide-react';
import type { Environment } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export interface EnvironmentConflict {
  environmentName: string;
  existingId: number;
  importedEnvironment: Environment;
}

export type ConflictResolution = 'skip' | 'overwrite' | 'rename';

interface ImportPreviewProps {
  environments: Environment[];
  conflicts: EnvironmentConflict[];
  conflictResolutions: Map<string, ConflictResolution>;
  onConflictResolution: (
    environmentName: string,
    resolution: ConflictResolution
  ) => void;
}

export function ImportPreview({
  environments,
  conflicts,
  conflictResolutions,
  onConflictResolution,
}: ImportPreviewProps) {
  const getConflictResolution = (envName: string): ConflictResolution | null => {
    return conflictResolutions.get(envName) || null;
  };

  const hasConflict = (envName: string): boolean => {
    return conflicts.some((c) => c.environmentName === envName);
  };

  const getVariableCount = (env: Environment): number => {
    return Object.keys(env.variables || {}).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Preview ({environments.length} environment{environments.length !== 1 ? 's' : ''})
        </h3>
        {conflicts.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="h-[300px] overflow-y-auto rounded-md border">
        <div className="p-4 space-y-3">
          {environments.map((env, index) => {
            const conflict = hasConflict(env.name);
            const resolution = conflict ? getConflictResolution(env.name) : null;

            return (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  conflict && !resolution
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{env.displayName}</h4>
                      {conflict && (
                        <Badge variant="destructive" className="text-xs">
                          Conflict
                        </Badge>
                      )}
                      {resolution && (
                        <Badge variant="outline" className="text-xs">
                          {resolution === 'skip' && 'Skipping'}
                          {resolution === 'overwrite' && 'Overwriting'}
                          {resolution === 'rename' && 'Renaming'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getVariableCount(env)} variable{getVariableCount(env) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Name: {env.name}
                    </p>
                  </div>
                  {conflict && !resolution && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onConflictResolution(env.name, 'skip')}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onConflictResolution(env.name, 'overwrite')
                        }
                        className="h-7 text-xs"
                      >
                        Overwrite
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onConflictResolution(env.name, 'rename')}
                        className="h-7 text-xs"
                      >
                        Rename
                      </Button>
                    </div>
                  )}
                  {!conflict && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div className="flex-1 text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">Conflicts detected</p>
            <p className="text-xs mt-1">
              Some environments have the same name as existing ones. Please
              choose how to resolve each conflict.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

