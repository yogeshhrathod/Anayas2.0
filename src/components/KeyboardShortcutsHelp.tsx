import { Command } from 'lucide-react';
import { useState } from 'react';
import { formatShortcut, getPlatform } from '../lib/platform';
import { SHORTCUTS } from '../lib/shortcuts/shortcuts';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import { Kbd } from './ui/kbd';

/**
 * Keyboard shortcuts help dialog showing OS-specific shortcuts
 */
export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const platform = getPlatform();
  const platformName = platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux';

  // Group shortcuts by category
  const shortcutCategories = [
    {
      title: 'Global',
      shortcuts: [
        { id: 'GLOBAL_SEARCH', label: 'Global Search' },
        { id: 'TOGGLE_SIDEBAR', label: 'Toggle Sidebar' },
        { id: 'SHOW_SHORTCUTS', label: 'Show Shortcuts' },
      ],
    },
    {
      title: 'Request Editor',
      shortcuts: [
        { id: 'NEW_REQUEST', label: 'New Request' },
        { id: 'SEND_REQUEST', label: 'Send Request' },
        { id: 'SAVE_REQUEST', label: 'Save Request' },
        { id: 'SAVE_REQUEST_AS', label: 'Save Request As' },
        { id: 'CLOSE_TAB', label: 'Close Tab' },
        { id: 'FOCUS_URL', label: 'Focus URL Bar' },
        { id: 'TOGGLE_SPLIT_VIEW', label: 'Toggle Split View' },
      ],
    },
    {
      title: 'Sidebar',
      shortcuts: [
        { id: 'EDIT_SELECTED_ITEM', label: 'Edit Selected' },
        { id: 'DUPLICATE_SELECTED_ITEM', label: 'Duplicate Selected' },
        { id: 'DELETE_SELECTED_ITEM', label: 'Delete Selected' },
        { id: 'ADD_REQUEST', label: 'Add Request' },
        { id: 'ADD_FOLDER', label: 'Add Folder' },
      ],
    },
    {
      title: 'Collection',
      shortcuts: [
        { id: 'NEW_COLLECTION', label: 'New Collection' },
        { id: 'EXPORT_COLLECTION', label: 'Export Collection' },
        { id: 'IMPORT_COLLECTION', label: 'Import Collection' },
      ],
    },
  ];

  const renderShortcutKeys = (keys: string) => {
    // Split by + to render each key separately
    return keys.split('+').map((key, index, array) => (
      <span key={index} className="inline-flex items-center">
        <Kbd className="group-hover:bg-background group-hover:text-foreground transition-colors justify-center h-7 min-w-[28px] text-xs">
          {key === ' ' ? 'Space' : key}
        </Kbd>
        {index < array.length - 1 && (
          <span className="text-muted-foreground/40 mx-1.5">+</span>
        )}
      </span>
    ));
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 w-8 p-0"
        title="Keyboard Shortcuts"
      >
        <Command className="h-4 w-4" />
      </Button>

      <Dialog 
        open={open} 
        onOpenChange={setOpen}
        title="Keyboard Shortcuts"
        description={
          <div className="flex items-center gap-2">
            <span>Quick reference for all available keyboard shortcuts</span>
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
              {platformName}
            </span>
          </div>
        }
        maxWidth="4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {shortcutCategories.map((category) => (
            <div key={category.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map(({ id, label }) => {
                  const shortcut = SHORTCUTS[id];
                  if (!shortcut) return null;

                  const keys = formatShortcut(shortcut.key, {
                    meta: shortcut.metaKey,
                    ctrl: shortcut.ctrlKey,
                    shift: shortcut.shiftKey,
                    alt: shortcut.altKey,
                  });

                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-4 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors group"
                    >
                      <span className="text-sm text-foreground group-hover:text-foreground/80">
                        {label}
                      </span>
                      <div className="flex items-center gap-1">
                        {renderShortcutKeys(keys)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            Press <Kbd className="h-4 min-w-[16px] px-1 text-[9px]">Esc</Kbd> to close this dialog
          </p>
        </div>
      </Dialog>
    </>
  );
}
