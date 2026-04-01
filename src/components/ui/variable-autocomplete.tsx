import { 
  Building2, 
  Check, 
  Globe, 
  Sparkles, 
  Command,
  Variable
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '../../lib/utils';

interface VariableAutocompleteProps {
  variables: Array<{
    name: string;
    value: string;
    scope: 'collection' | 'global' | 'dynamic';
  }>;
  onSelect: (variableName: string) => void;
  onClose: () => void;
  searchTerm?: string;
  showOnlyDynamic?: boolean;
}

export function VariableAutocomplete({
  variables,
  searchTerm = '',
  onSelect,
  onClose,
  showOnlyDynamic = false,
}: VariableAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter and prioritize variables
  const filteredVariables = useMemo(() => {
    let filtered = showOnlyDynamic
      ? variables.filter(v => v.scope === 'dynamic')
      : searchTerm && searchTerm.length > 0
        ? variables.filter(v => {
            const searchLower = searchTerm.toLowerCase();
            const nameLower = v.name.toLowerCase();
            if (v.scope === 'dynamic' && nameLower.startsWith('$')) {
              return (
                nameLower.includes(searchLower) ||
                nameLower.slice(1).includes(searchLower)
              );
            }
            return nameLower.includes(searchLower);
          })
        : variables;

    // Grouping for flattened list used in keyboard nav
    return [
      ...filtered.filter(v => v.scope === 'collection'),
      ...filtered.filter(v => v.scope === 'global'),
      ...filtered.filter(v => v.scope === 'dynamic'),
    ];
  }, [variables, searchTerm, showOnlyDynamic]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredVariables.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredVariables.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredVariables.length) % filteredVariables.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredVariables[selectedIndex]) {
            onSelect(filteredVariables[selectedIndex].name);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (filteredVariables[selectedIndex]) {
            onSelect(filteredVariables[selectedIndex].name);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredVariables, selectedIndex, onSelect, onClose]);

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm, showOnlyDynamic]);

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case 'collection':
        return (
          <div className="flex h-5 items-center gap-1.5 rounded-md bg-blue-500/10 px-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-500 ring-1 ring-inset ring-blue-500/20">
            <Building2 className="h-3 w-3" />
            Collection
          </div>
        );
      case 'global':
        return (
          <div className="flex h-5 items-center gap-1.5 rounded-md bg-emerald-500/10 px-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
            <Globe className="h-3 w-3" />
            Global
          </div>
        );
      case 'dynamic':
        return (
          <div className="flex h-5 items-center gap-1.5 rounded-md bg-purple-500/10 px-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-500 ring-1 ring-inset ring-purple-500/20">
            <Sparkles className="h-3 w-3" />
            Dynamic
          </div>
        );
      default:
        return null;
    }
  };

  const currentGroups = useMemo(() => {
    const groups: Array<{ label: string; icon: any; items: typeof filteredVariables }> = [];
    
    const collectionItems = filteredVariables.filter(v => v.scope === 'collection');
    if (collectionItems.length > 0) groups.push({ label: 'Collection', icon: Building2, items: collectionItems });
    
    const globalItems = filteredVariables.filter(v => v.scope === 'global');
    if (globalItems.length > 0) groups.push({ label: 'Global', icon: Globe, items: globalItems });
    
    const dynamicItems = filteredVariables.filter(v => v.scope === 'dynamic');
    if (dynamicItems.length > 0) groups.push({ label: 'Dynamic', icon: Sparkles, items: dynamicItems });
    
    return groups;
  }, [filteredVariables]);

  let globalItemIndex = 0;
  
  useEffect(() => {
    const activeItem = document.getElementById(`var-item-${selectedIndex}`);
    if (activeItem) {
      activeItem.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="absolute top-full left-0 mt-2 z-popover w-[340px] rounded-2xl border border-border/40 bg-popover/90 backdrop-blur-xl shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden flex flex-col"
    >
      {/* Header Info */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/20 bg-muted/30">
        <div className="flex items-center gap-2">
          <Variable className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Available Variables</span>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50">
          <Command className="h-2.5 w-2.5 text-muted-foreground/60" />
          <span className="text-[9px] font-bold text-muted-foreground">Select</span>
        </div>
      </div>

      <div className="max-h-[360px] overflow-auto p-1.5 space-y-3">
        {filteredVariables.length === 0 ? (
          <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
               <Variable className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No variables found</p>
          </div>
        ) : (
          currentGroups.map((group) => (
            <div key={group.label} className="space-y-1">
               {/* Subtle Section Header */}
               <div className="px-2 pb-1 flex items-center gap-2 mt-1">
                  <group.icon className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{group.label}</span>
                  <div className="h-px flex-1 bg-border/20" />
               </div>

               {group.items.map((variable) => {
                 const itemIdx = globalItemIndex++;
                 const isSelected = selectedIndex === itemIdx;
                 
                 return (
                   <button
                     key={`${group.label}-${variable.name}`}
                     id={`var-item-${itemIdx}`}
                     onClick={() => onSelect(variable.name)}
                     onMouseEnter={() => setSelectedIndex(itemIdx)}
                     className={cn(
                       'relative w-full flex flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-all duration-200 group overflow-hidden',
                       isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                     )}
                   >
                     {/* Active Indicator Bar */}
                     {isSelected && (
                       <motion.div 
                         layoutId="active-var-bar"
                         className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full" 
                       />
                     )}

                     <div className="flex items-center justify-between w-full">
                       <span className={cn(
                         "text-sm font-bold tracking-tight font-mono truncate max-w-[180px]",
                         isSelected ? "text-primary" : "text-foreground"
                       )}>
                         {variable.name}
                       </span>
                       <div className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                         {getScopeBadge(variable.scope)}
                       </div>
                     </div>

                     <div className={cn(
                       "text-[11px] font-medium truncate max-w-[280px] font-mono",
                       isSelected ? "text-primary/70" : "text-muted-foreground/60"
                     )}>
                       {variable.value || 'Generated at runtime'}
                     </div>

                     {isSelected && (
                       <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40">
                         <Check className="h-4 w-4 text-primary" />
                       </div>
                     )}
                   </button>
                 );
               })}
            </div>
          ))
        )}
      </div>

      {/* Footer / Help */}
      {filteredVariables.length > 0 && (
         <div className="px-3 py-2 border-t border-border/20 bg-muted/20 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase">
               <span className="px-1 py-0.5 rounded bg-muted/50 border border-border/50 text-foreground">↑↓</span>
               <span>Move</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase">
               <span className="px-1 py-0.5 rounded bg-muted/50 border border-border/50 text-foreground">↵</span>
               <span>Select</span>
            </div>
         </div>
      )}
    </motion.div>
  );
}

