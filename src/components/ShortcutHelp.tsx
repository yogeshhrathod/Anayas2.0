/**
 * ShortcutHelp - Keyboard shortcut reference component
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Keyboard } from 'lucide-react';
import { useShortcutContext } from '../hooks/useShortcutContext';
import { detectContext, SHORTCUTS } from '../lib/shortcuts';
import { getShortcutDisplay } from '../lib/keymap';

export function ShortcutHelp() {
  const [open, setOpen] = useState(false);
  const context = useShortcutContext();
  const activeContexts = detectContext(context);
  
  // Show only relevant shortcuts for current context
  const relevantShortcuts = Object.entries(SHORTCUTS)
    .filter(([_, shortcut]) => 
      shortcut.contexts.some(ctx => activeContexts.includes(ctx))
    )
    .sort((a, b) => {
      // Sort by context priority
      const contextOrder = ['global', 'sidebar', 'editor', 'collections-page'];
      const aContext = a[1].contexts[0];
      const bContext = b[1].contexts[0];
      return contextOrder.indexOf(aContext) - contextOrder.indexOf(bContext);
    });
  
  // Group shortcuts by context
  const groupedShortcuts = relevantShortcuts.reduce((acc, [id, shortcut]) => {
    const context = shortcut.contexts[0];
    if (!acc[context]) {
      acc[context] = [];
    }
    acc[context].push([id, shortcut]);
    return acc;
  }, {} as Record<string, Array<[string, typeof SHORTCUTS[string]]>>);
  
  const getContextTitle = (context: string) => {
    switch (context) {
      case 'global': return 'Global Shortcuts';
      case 'sidebar': return 'Sidebar Shortcuts';
      case 'editor': return 'Request Editor Shortcuts';
      case 'collections-page': return 'Collections Page Shortcuts';
      default: return 'Other Shortcuts';
    }
  };
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        <Keyboard className="h-4 w-4" />
        <span className="ml-2">Keyboard Shortcuts</span>
      </Button>
      
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                ×
              </Button>
            </div>
            
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([context, shortcuts]) => (
                <div key={context}>
                  <h3 className="text-lg font-semibold mb-3">
                    {getContextTitle(context)}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map(([id, shortcut]) => (
                      <div key={id} className="flex justify-between items-center py-1">
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">
                          {getShortcutDisplay(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
