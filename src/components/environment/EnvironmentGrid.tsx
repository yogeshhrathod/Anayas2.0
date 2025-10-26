/**
 * EnvironmentGrid - Grid layout component for displaying environments
 * 
 * Features:
 * - Responsive grid layout
 * - Empty state handling
 * - Loading state support
 * - Current environment highlighting
 * 
 * @example
 * ```tsx
 * <EnvironmentGrid
 *   environments={environments}
 *   currentEnvironment={currentEnvironment}
 *   isLoading={isLoading}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onDuplicate={handleDuplicate}
 *   onSetDefault={handleSetDefault}
 *   onTest={handleTest}
 * />
 * ```
 */

import React from 'react';
import { EnvironmentCard } from './EnvironmentCard';
import { EmptyState } from '../shared/EmptyState';
import { Button } from '../ui/button';
import { Environment } from '../../types/entities';

export interface EnvironmentGridProps {
  environments: Environment[];
  currentEnvironment?: Environment | null;
  isLoading?: boolean;
  testingEnvironmentId?: number | null;
  onEdit: (environment: Environment) => void;
  onDelete: (environment: Environment) => void;
  onDuplicate: (environment: Environment) => void;
  onSetDefault: (environment: Environment) => void;
  onTest?: (environment: Environment) => void;
}

export const EnvironmentGrid: React.FC<EnvironmentGridProps> = ({
  environments,
  currentEnvironment,
  isLoading = false,
  testingEnvironmentId,
  onEdit,
  onDelete,
  onDuplicate,
  onSetDefault,
  onTest
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    );
  }

  if (environments.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-6xl">🌍</span>}
        title="No Environments"
        description="Create your first environment to manage API configurations"
        action={<Button onClick={() => onEdit({} as Environment)}>Create Environment</Button>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {environments.map((environment) => (
        <EnvironmentCard
          key={environment.id}
          environment={environment}
          isCurrent={currentEnvironment?.id === environment.id}
          isTesting={testingEnvironmentId === environment.id}
          onEdit={() => onEdit(environment)}
          onDelete={() => onDelete(environment)}
          onDuplicate={() => onDuplicate(environment)}
          onSetDefault={() => onSetDefault(environment)}
          onTest={onTest ? () => onTest(environment) : undefined}
        />
      ))}
    </div>
  );
};
