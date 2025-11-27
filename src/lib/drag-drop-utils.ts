/**
 * Drag and Drop Utilities
 *
 * Utility functions for calculating order values when reordering items
 * in drag-and-drop operations.
 */

/**
 * Calculate order value to insert after a target item
 * @param targetOrder - Order value of the item to insert after
 * @param nextOrder - Order value of the next item (if exists)
 * @returns New order value to insert between target and next
 */
export function calculateOrderAfter(
  targetOrder: number,
  nextOrder?: number
): number {
  if (nextOrder === undefined) {
    // No next item, append to end
    return targetOrder + 1000;
  }

  // Insert between target and next
  const order = targetOrder + Math.floor((nextOrder - targetOrder) / 2);

  // Ensure order is unique (not equal to target)
  if (order === targetOrder) {
    return targetOrder + 1;
  }

  return order;
}

/**
 * Calculate order value to insert before a target item
 * @param targetOrder - Order value of the item to insert before
 * @param prevOrder - Order value of the previous item (if exists)
 * @returns New order value to insert before target
 */
export function calculateOrderBefore(
  targetOrder: number,
  prevOrder?: number
): number {
  if (prevOrder === undefined) {
    // No previous item, insert at beginning
    // Use targetOrder - 1000, but ensure it's positive
    return Math.max(1, targetOrder - 1000);
  }

  // Insert between prev and target
  const order = prevOrder + Math.floor((targetOrder - prevOrder) / 2);

  // Ensure order is unique (not equal to target)
  if (order === targetOrder) {
    return targetOrder - 1;
  }

  return order;
}

/**
 * Calculate order value to append at the end
 * @param maxOrder - Maximum order value in the container
 * @returns New order value to append at end
 */
export function calculateOrderAtEnd(maxOrder: number): number {
  return maxOrder + 1000;
}

/**
 * Calculate order value for a specific drop position
 * @param items - Array of items with order values, sorted by order
 * @param dropIndex - Index where item should be inserted (0-based)
 * @returns New order value for the drop position
 */
export function calculateOrderForPosition(
  items: Array<{ order?: number }>,
  dropIndex: number
): number {
  if (items.length === 0) {
    // Empty container, start with 1000
    return 1000;
  }

  if (dropIndex === 0) {
    // Insert at beginning
    const firstOrder = items[0].order || 0;
    return Math.max(1, firstOrder - 1000);
  }

  if (dropIndex >= items.length) {
    // Append at end
    const lastOrder = items[items.length - 1].order || 0;
    return lastOrder + 1000;
  }

  // Insert between two items
  const prevOrder = items[dropIndex - 1].order || 0;
  const nextOrder = items[dropIndex].order || 0;

  return calculateOrderAfter(prevOrder, nextOrder);
}
