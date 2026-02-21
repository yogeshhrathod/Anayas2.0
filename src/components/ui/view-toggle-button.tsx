import { FileText, Table } from 'lucide-react';
import React from 'react';
import { Button } from './button';

interface ViewToggleButtonProps {
  currentView: 'table' | 'json';
  onToggle: () => void;
  className?: string;
}

export const ViewToggleButton: React.FC<ViewToggleButtonProps> = ({
  currentView,
  onToggle,
  className = '',
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={onToggle}
      className={`h-8 w-8 p-0 ${className}`}
      title={currentView === 'table' ? 'Switch to JSON' : 'Switch to Table'}
    >
      {currentView === 'table' ? (
        <FileText className="h-4 w-4" />
      ) : (
        <Table className="h-4 w-4" />
      )}
    </Button>
  );
};
