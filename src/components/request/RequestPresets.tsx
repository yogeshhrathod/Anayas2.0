import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, HelpCircle, Info, Plus, Save, Sparkles, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { RequestPreset } from '../../types/entities';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

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

const methodColorMap: Record<string, string> = {
  GET: 'text-green-500 border-green-500/20 bg-green-500/5',
  POST: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
  PUT: 'text-orange-500 border-orange-500/20 bg-orange-500/5',
  PATCH: 'text-purple-500 border-purple-500/20 bg-purple-500/5',
  DELETE: 'text-red-500 border-red-500/20 bg-red-500/5',
  HEAD: 'text-gray-500 border-gray-500/20 bg-gray-500/5',
  OPTIONS: 'text-gray-500 border-gray-500/20 bg-gray-500/5',
};

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
  onSetNewPresetDescription,
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the name input when dialog opens
  useEffect(() => {
    if (showCreateDialog && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [showCreateDialog]);

  return (
    <>
      <div className="relative w-12 flex-shrink-0">
        <motion.div
          animate={{ width: isExpanded ? 320 : 48 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 z-50 border-l border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/40"
        >
          <div className="flex flex-col h-full">
            <div className={`border-b border-border/40 flex items-center bg-muted/20 transition-all ${isExpanded ? 'p-4 justify-between' : 'h-14 justify-center'}`}>
              <button
                onClick={() => onToggleExpanded(!isExpanded)}
                className={`flex items-center hover:bg-muted/50 rounded-lg transition-all active:scale-95 ${
                  isExpanded ? 'gap-2 p-1.5' : 'justify-center w-10 h-10 mx-auto'
                }`}
                data-testid="request-scenarios-toggle"
              >
                <div className="relative flex items-center justify-center">
                  <Bookmark
                    className={`h-4 w-4 transition-colors ${isExpanded ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  {!isExpanded && presets.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}
                </div>
                {isExpanded && (
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    Scenarios
                    {presets.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[10px] font-bold bg-primary/10 text-primary border-none"
                      >
                        {presets.length}
                      </Badge>
                    )}
                  </h4>
                )}
              </button>

              {isExpanded && (
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onShowCreateDialog(true)}
                          className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create Scenario</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpanded(false)}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-3">
                {isExpanded ? (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {presets.length > 0 ? (
                        presets.map(preset => (
                          <motion.div
                            key={preset.id}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: 20 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card
                              className={`group relative overflow-hidden border-border/40 hover:border-primary/40 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                                activePresetId === preset.id
                                  ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                                  : 'hover:bg-muted/30'
                              }`}
                              onClick={() => onApplyPreset(preset)}
                            >
                              <div className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge
                                        variant="outline"
                                        className={`px-1.5 py-0 text-[10px] font-bold font-mono transition-colors ${
                                          methodColorMap[preset.requestData.method] ||
                                          'text-gray-500 border-gray-500/20'
                                        }`}
                                      >
                                        {preset.requestData.method}
                                      </Badge>
                                      <h5
                                        className={`font-semibold text-sm truncate ${
                                          activePresetId === preset.id
                                            ? 'text-primary'
                                            : 'text-foreground'
                                        }`}
                                      >
                                        {preset.name}
                                      </h5>
                                    </div>

                                    {preset.description && (
                                      <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                                        "{preset.description}"
                                      </p>
                                    )}
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={e => {
                                      e.stopPropagation();
                                      onDeletePreset(preset.id);
                                    }}
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all rounded-full"
                                    title="Delete Scenario"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {activePresetId === preset.id && (
                                <div className="absolute top-0 right-0 p-1">
                                  <div className="bg-primary h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                                </div>
                              )}
                            </Card>
                          </motion.div>
                        ))
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-4 space-y-6"
                        >
                          {/* Welcome Hero Card */}
                          <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 shadow-inner">
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 blur-3xl rounded-full" />
                            <div className="relative z-10 space-y-3">
                              <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary/30">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <h5 className="font-bold text-base bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                  Welcome to Scenarios
                                </h5>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  Capture your request snapshots and switch between Success, Error,
                                  or Auth states instantly.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* How to use */}
                          <div className="space-y-4 px-1 border border-transparent">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <HelpCircle className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">
                                Getting Started
                              </span>
                            </div>

                            <div className="space-y-6 relative ml-1">
                              {/* Connector line */}
                              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-muted/40 z-0 rounded-full" />
                              
                              {[
                                {
                                  step: 1,
                                  title: 'Configure',
                                  desc: 'Setup your request URL, headers, and body.',
                                  icon: <Info className="h-3 w-3" />,
                                },
                                {
                                  step: 2,
                                  title: 'Capture',
                                  desc: 'Click the + button above to save a snapshot.',
                                  icon: <Save className="h-3 w-3" />,
                                },
                                {
                                  step: 3,
                                  title: 'Switch',
                                  desc: 'Restore any scenario with a single click.',
                                  icon: <Bookmark className="h-3 w-3" />,
                                },
                              ].map((item, idx) => (
                                <div key={idx} className="relative z-10 flex items-start gap-4">
                                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] font-bold text-primary">
                                      {item.step}
                                    </span>
                                  </div>
                                  <div className="space-y-1 pt-0.5">
                                    <h6 className="text-xs font-semibold flex items-center gap-1.5">
                                      {item.title}
                                    </h6>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                      {item.desc}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full text-xs gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-95"
                              onClick={() => onShowCreateDialog(true)}
                            >
                              <Plus className="h-3 w-3" />
                              Create First Scenario
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Collapsed State */
                  <div className="flex flex-col items-center gap-2 py-2">
                    <TooltipProvider>
                      <AnimatePresence>
                        {presets.map((preset, index) => (
                          <motion.div
                            key={preset.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onApplyPreset(preset)}
                                  className={`group relative h-9 w-9 flex items-center justify-center rounded-xl transition-all ${
                                    activePresetId === preset.id
                                      ? 'bg-primary shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2 ring-offset-background'
                                      : 'bg-muted hover:bg-muted-foreground/10 hover:scale-110 active:scale-90'
                                  }`}
                                >
                                  <span
                                    className={`text-[12px] font-black ${
                                      activePresetId === preset.id
                                        ? 'text-primary-foreground'
                                        : 'text-muted-foreground group-hover:text-primary'
                                    }`}
                                  >
                                    {index + 1}
                                  </span>
                                  {activePresetId === preset.id && (
                                    <motion.div
                                      layoutId="active-indicator"
                                      className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary-foreground shadow-sm"
                                    />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="p-3 max-w-xs backdrop-blur-md">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`px-1 py-0 text-[9px] font-bold ${
                                        methodColorMap[preset.requestData.method] || ''
                                      }`}
                                    >
                                      {preset.requestData.method}
                                    </Badge>
                                    <span className="font-bold text-sm tracking-tight text-foreground">
                                      {preset.name}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-mono bg-muted/40 p-1 rounded truncate border border-border/40">
                                    {preset.requestData.url || 'No URL'}
                                  </div>
                                  {preset.description && (
                                    <p className="text-[11px] italic text-muted-foreground/80 leading-tight">
                                      {preset.description}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </TooltipProvider>

                    {presets.length === 0 && (
                      <div className="mt-4 opacity-30 group cursor-pointer" onClick={() => onToggleExpanded(true)}>
                        <Bookmark className="h-5 w-5 hover:text-primary transition-colors hover:scale-125" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Create Preset Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={onShowCreateDialog}
        title="New Request Scenario"
        description="Preserve current request configuration for quick restoration."
        maxWidth="sm"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            onCreatePreset();
          }}
          className="p-1"
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scenario Name</Label>
                <Input
                  ref={nameInputRef}
                  id="preset-name"
                  value={newPresetName}
                  onChange={e => onSetNewPresetName(e.target.value)}
                  placeholder="e.g., Auth Flow - Success"
                  className="bg-muted/30 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preset-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed Description</Label>
                <Input
                  id="preset-description"
                  value={newPresetDescription}
                  onChange={e => onSetNewPresetDescription(e.target.value)}
                  placeholder="What is this scenario testing?"
                  className="bg-muted/30 focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
              <Button type="submit" className="flex-1 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />
                Create Scenario
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onShowCreateDialog(false)}
                className="flex-1"
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

