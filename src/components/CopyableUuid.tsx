import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface CopyableUuidProps {
  uuid: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'compact' | 'inline';
}

export function CopyableUuid({
  uuid,
  label = 'UUID',
  className,
  showLabel = true,
  variant = 'default',
}: CopyableUuidProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy UUID:', err);
    }
  };

  // Format UUID with ellipsis in the middle for compact display
  const formatUuidWithEllipsis = (id: string, maxLength: number = 24) => {
    if (id.length <= maxLength) return id;
    const charsToShow = Math.floor((maxLength - 3) / 2);
    return `${id.slice(0, charsToShow)}...${id.slice(-charsToShow)}`;
  };

  if (variant === 'inline') {
    return (
      <span
        onClick={handleCopy}
        className={cn(
          'inline-flex items-center gap-1 font-mono text-xs cursor-pointer hover:text-primary transition-colors group',
          className
        )}
        title={`Click to copy: ${uuid}`}
      >
        {showLabel && <span className="font-semibold">{label}:</span>}
        <span className="underline decoration-dotted">
          {formatUuidWithEllipsis(uuid, 30)}
        </span>
        {copied ? (
          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
        ) : (
          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleCopy}
        className={cn(
          'inline-flex items-center gap-2 px-2 py-1 rounded border bg-muted/50 hover:bg-muted transition-colors text-xs font-mono group',
          className
        )}
        title={`Click to copy: ${uuid}`}
      >
        {showLabel && (
          <span className="text-muted-foreground font-semibold shrink-0">
            {label}:
          </span>
        )}
        <span className="text-muted-foreground">
          {formatUuidWithEllipsis(uuid)}
        </span>
        {copied ? (
          <Check className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0" />
        )}
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg border-2 bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all group',
        className
      )}
      title={`Click to copy: ${uuid}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showLabel && (
          <span className="text-xs font-semibold text-muted-foreground shrink-0">
            {label}:
          </span>
        )}
        <span className="text-xs font-mono text-foreground">
          {formatUuidWithEllipsis(uuid, 40)}
        </span>
      </div>
      <div className="shrink-0">
        {copied ? (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span className="text-xs font-medium">Copied!</span>
          </div>
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
    </button>
  );
}
