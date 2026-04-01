import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

export interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  actions,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  showBackButton = false,
  onBack,
}) => {
  return (
    <div className={cn('flex flex-col gap-8', className)}>
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn('flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 p-1', headerClassName)}
      >
        <div className="space-y-4">
          {showBackButton && (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
                id="page-layout-back-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          )}
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 font-display">
              {title}
            </h1>
            {description && (
              <p className="text-base text-muted-foreground/80 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </motion.div>

      {/* Page Content */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className={cn('flex-1 min-h-0', contentClassName)}
      >
        {children}
      </motion.div>
    </div>
  );
};
