/**
 * ActionMenu - Dropdown menu pattern used across collection/request items
 * 
 * Provides a consistent action menu with:
 * - Trigger button with icon
 * - Dropdown menu with actions and keyboard shortcuts
 * - Consistent styling and behavior
 * - Support for destructive actions
 * - shadcn-style layout with shortcuts on the right
 * 
 * @example
 * ```tsx
 * <ActionMenu
 *   actions={[
 *     { label: 'Edit', onClick: handleEdit, shortcut: '⌘E' },
 *     { label: 'Duplicate', onClick: handleDuplicate, shortcut: '⌘D' },
 *     { type: 'separator' },
 *     { label: 'Delete', onClick: handleDelete, destructive: true, shortcut: '⌘⌫' }
 *   ]}
 * />
 * ```
 */

import React from 'react';
import { Button } from '../ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

export interface ActionMenuSeparator {
  type: 'separator';
}

export type ActionMenuAction = ActionMenuItem | ActionMenuSeparator;

export interface ActionMenuProps {
  actions: ActionMenuAction[];
  trigger?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  trigger,
  align = 'end',
  className = '',
  size = 'sm'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 p-0',
    md: 'h-8 w-8 p-0',
    lg: 'h-10 w-10 p-0'
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(sizeClasses[size], className)}
    >
      <MoreVertical className="h-3 w-3" />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {actions.map((action, index) => {
          if ('type' in action && action.type === 'separator') {
            return <DropdownMenuSeparator key={index} />;
          }

          const menuAction = action as ActionMenuItem;
          return (
            <DropdownMenuItem
              key={index}
              onClick={menuAction.onClick}
              disabled={menuAction.disabled}
              className={cn(
                menuAction.destructive && 'text-red-600 focus:text-red-600'
              )}
            >
              <span className="flex-1">{menuAction.label}</span>
              {menuAction.shortcut && (
                <span className="ml-auto text-xs tracking-widest text-muted-foreground">
                  {menuAction.shortcut}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
