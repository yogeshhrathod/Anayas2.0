import { describe, expect, it } from 'vitest';
import {
    calculateOrderAfter,
    calculateOrderAtEnd,
    calculateOrderBefore,
    calculateOrderForPosition
} from '../../../../src/lib/drag-drop-utils';

describe('drag-drop-utils', () => {
  describe('calculateOrderAfter', () => {
    it('should return targetOrder + 1000 if no nextOrder', () => {
      expect(calculateOrderAfter(1000)).toBe(2000);
    });

    it('should return midpoint between targetOrder and nextOrder', () => {
      expect(calculateOrderAfter(1000, 2000)).toBe(1500);
    });

    it('should return targetOrder + 1 if difference is less than 2', () => {
      expect(calculateOrderAfter(1000, 1001)).toBe(1001);
    });
  });

  describe('calculateOrderBefore', () => {
    it('should return targetOrder - 1000 (min 1) if no prevOrder', () => {
      expect(calculateOrderBefore(2000)).toBe(1000);
      expect(calculateOrderBefore(500)).toBe(1);
    });

    it('should return midpoint between prevOrder and targetOrder', () => {
      expect(calculateOrderBefore(2000, 1000)).toBe(1500);
    });

    it('should return targetOrder - 1 if difference is less than 2', () => {
      expect(calculateOrderBefore(1001, 1000)).toBe(1000);
    });
  });

  describe('calculateOrderAtEnd', () => {
    it('should return maxOrder + 1000', () => {
      expect(calculateOrderAtEnd(5000)).toBe(6000);
    });
  });

  describe('calculateOrderForPosition', () => {
    const items = [
      { order: 1000 },
      { order: 2000 },
      { order: 3000 }
    ];

    it('should return 1000 for empty items', () => {
      expect(calculateOrderForPosition([], 0)).toBe(1000);
    });

    it('should return order before first item when dropIndex is 0', () => {
      expect(calculateOrderForPosition(items, 0)).toBe(1);
    });

    it('should return order after last item when dropIndex is at end', () => {
      expect(calculateOrderForPosition(items, 3)).toBe(4000);
    });

    it('should return order between items when dropped in middle', () => {
      expect(calculateOrderForPosition(items, 1)).toBe(1500);
      expect(calculateOrderForPosition(items, 2)).toBe(2500);
    });
  });
});
