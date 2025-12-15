/**
 * FormatSelector - Reusable format selection component
 *
 * Allows users to select import/export format (JSON, .env, Postman)
 */

import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export type Format = 'json' | 'env' | 'postman';

interface FormatSelectorProps {
  value: Format;
  onValueChange: (value: Format) => void;
  label?: string;
  disabled?: boolean;
  formats?: Format[];
}

const formatLabels: Record<Format, string> = {
  json: 'JSON (Anayas)',
  env: '.env File',
  postman: 'Postman Environment',
};

export function FormatSelector({
  value,
  onValueChange,
  label = 'Format',
  disabled = false,
  formats = ['json', 'env', 'postman'],
}: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="format-select">{label}</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id="format-select">
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent>
          {formats.map((format) => (
            <SelectItem key={format} value={format}>
              {formatLabels[format]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

