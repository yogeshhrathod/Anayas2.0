import { describe, expect, it } from 'vitest';
import { cn } from '../../../../src/lib/utils';

describe('cn utility', () => {
  it('should merge tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle conditional classes', () => {
    expect(cn('p-4', false && 'm-2', true && 'text-white')).toBe('p-4 text-white');
  });

  it('should handle arrays and objects', () => {
    expect(cn(['p-4', 'm-2'], { 'text-white': true, 'bg-black': false })).toBe('p-4 m-2 text-white');
  });
});
