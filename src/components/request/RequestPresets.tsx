/**
 * RequestPresets - Preset management sidebar
 * 
 * Manages request presets with:
 * - Collapsible sidebar
 * - Preset creation dialog
 * - Preset application
 * - Preset deletion
 * - Compact view for collapsed state
 * 
 * @example
 * ```tsx
 * <RequestPresets
 *   presets={presets}
 *   isExpanded={isPresetsExpanded}
 *   activePresetId={activePresetId}
 *   showCreateDialog={showCreatePresetDialog}
 *   newPresetName={newPresetName}
 *   newPresetDescription={newPresetDescription}
 *   onToggleExpanded={setIsPresetsExpanded}
 *   onCreatePreset={createPreset}
 *   onApplyPreset={applyPreset}
 *   onDeletePreset={deletePreset}
 *   onShowCreateDialog={setShowCreatePresetDialog}
 *   onSetNewPresetName={setNewPresetName}
 *   onSetNewPresetDescription={setNewPresetDescription}
 * />
 * ```
 */

import { Bookmark, Plus, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { RequestPreset } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export interface RequestPresetsProps {
  presets: RequestPreset[];
  isExpanded: boolean;
  activePresetId: string | null;
  showCreateDialog: boolean;
  newPresetName: string;
  newPresetDescription: string;
  onToggleExpanded: (expanded: boolean) => void;
  onCreatePreset: () => void;
  onApplyPreset: (preset: RequestPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onShowCreateDialog: (show: boolean) => void;
  onSetNewPresetName: (name: string) => void;
  onSetNewPresetDescription: (description: string) => void;
}

export const RequestPresets: React.FC<RequestPresetsProps> = ({
  presets,
  isExpanded,
  activePresetId,
  showCreateDialog,
  newPresetName,
  newPresetDescription,
  onToggleExpanded,
  onCreatePreset,
  onApplyPreset,
  onDeletePreset,
  onShowCreateDialog,
  onSetNewPresetName,
  onSetNewPresetDescription
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the name input when dialog opens
  useEffect(() => {
    if (showCreateDialog && nameInputRef.current) {
      // Small delay to ensure the dialog is fully rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [showCreateDialog]);

  return (
    <>
      {/* Wrapper - Always takes w-12 space for the collapsed sidebar */}
      <div className="relative w-12 flex-shrink-0">
        {/* Presets Panel - Absolute overlay when expanded, fills wrapper when collapsed */}
        <div className={`absolute right-0 top-0 bottom-0 transition-all duration-300 z-50 border-l border-border/50 bg-card ${
          isExpanded 
            ? 'w-80 shadow-2xl' 
            : 'w-12'
        }`}>
          <div className="p-4 h-full overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onToggleExpanded(!isExpanded)}
                className="flex items-center gap-2 hover:bg-muted/50 rounded py-1 transition-colors"
                data-testid="request-scenarios-toggle"
              >
                {isExpanded ? (
                  <>
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Bookmark className="h-4 w-4" />
                      Request Scenarios
                      {presets.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {presets.length}
                        </Badge>
                      )}
                    </h4>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div className="flex items-center justify-center w-full">
                      <Bookmark className="h-4 w-4" />
                    </div>
                    {presets.length > 0 && (
                      <Badge variant="secondary" className="h-4 w-4 p-0 text-xs flex items-center justify-center">
                        {presets.length}
                      </Badge>
                    )}
                  </div>
                )}
              </button>
              {isExpanded && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowCreateDialog(true)}
                    className="h-7 w-7 p-0"
                    title="Create Scenario"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpanded(false)}
                    className="h-7 w-7 p-0"
                    title="Close Scenarios"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {isExpanded ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {presets.length > 0 ? (
                  presets.map((preset) => (
                    <Card 
                      key={preset.id} 
                      className={`p-3 transition-colors cursor-pointer ${
                        activePresetId === preset.id 
                          ? 'bg-primary/10 border-primary/30 hover:bg-primary/15' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => onApplyPreset(preset)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-sm truncate">{preset.name}</h5>
                            {activePresetId === preset.id && (
                              <Badge variant="default" className="h-4 px-1.5 text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          {preset.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {preset.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {preset.requestData.method} • {preset.requestData.url || 'No URL'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePreset(preset.id);
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          title="Delete Scenario"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No scenarios created yet</p>
                    <p className="text-xs mt-1">Create your first scenario to save request configurations</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 flex flex-col items-center">
                {presets.map((preset, index) => (
                  <TooltipProvider key={preset.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onApplyPreset(preset)}
                          className={`w-full h-8 p-0 flex items-center justify-center transition-colors ${
                            activePresetId === preset.id 
                              ? 'bg-primary/20 hover:bg-primary/30' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <Badge 
                            variant={activePresetId === preset.id ? "default" : "secondary"}
                            className={`h-6 w-6 p-0 text-xs flex items-center justify-center font-bold ${
                              activePresetId === preset.id 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : ''
                            }`}
                          >
                            {index + 1}
                          </Badge>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{preset.name}</p>
                          {preset.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {preset.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {preset.requestData.method} • {preset.requestData.url || 'No URL'}
                          </p>
                          {activePresetId === preset.id && (
                            <p className="text-xs text-primary font-medium">Currently Active</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {presets.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-xs flex flex-col items-center">
                    <Bookmark className="h-6 w-6 mb-1 opacity-50" />
                    <p>No scenarios</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Create Preset Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={onShowCreateDialog}
        title="Create Request Scenario"
        description="Save the current request configuration as a reusable scenario"
        maxWidth="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreatePreset();
          }}
        >
          <div className="space-y-4">
                <div>
                  <Label htmlFor="preset-name">Preset Name (Optional)</Label>
                  <Input
                    ref={nameInputRef}
                    id="preset-name"
                    value={newPresetName}
                    onChange={(e) => onSetNewPresetName(e.target.value)}
                    placeholder="e.g., Success Case, Error Case (auto-generated if empty)"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="preset-description">Description (Optional)</Label>
                  <Input
                    id="preset-description"
                    value={newPresetDescription}
                    onChange={(e) => onSetNewPresetDescription(e.target.value)}
                    placeholder="Brief description of this scenario"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit">
                    Create Scenario
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => onShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
      </Dialog>
    </>
  );
};
