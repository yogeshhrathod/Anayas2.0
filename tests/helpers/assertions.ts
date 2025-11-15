import { Page, expect } from '@playwright/test';
import { getDatabaseContents } from './test-db';

/**
 * Assert that an element is rendered
 */
export async function assertRendered(
  page: Page,
  selector: string,
  message?: string
): Promise<void> {
  const element = page.locator(selector);
  await expect(element, message || `Element ${selector} should be rendered`).toBeVisible();
}

/**
 * Assert that state was updated
 */
export function assertStateUpdated(
  before: any,
  after: any,
  expectedChanges: Record<string, any>
): void {
  for (const [key, expectedValue] of Object.entries(expectedChanges)) {
    const actualValue = after[key];
    expect(actualValue, `State ${key} should be updated`).toEqual(expectedValue);
  }
}

/**
 * Assert that data was persisted to database
 */
export function assertDataPersisted(
  data: any,
  dbPath: string,
  collection: string
): void {
  const dbContents = getDatabaseContents(dbPath);
  if (!dbContents) {
    throw new Error('Database not found');
  }
  
  const collectionData = dbContents[collection] || [];
  const found = collectionData.find((item: any) => {
    // Try to match by id if available
    if (data.id && item.id === data.id) {
      return true;
    }
    // Try to match by name if available
    if (data.name && item.name === data.name) {
      return true;
    }
    return false;
  });
  
  expect(found, `Data should be persisted in ${collection}`).toBeDefined();
}

/**
 * Assert that UI was updated
 */
export async function assertUIUpdated(
  page: Page,
  selector: string,
  expectedText: string | RegExp
): Promise<void> {
  const element = page.locator(selector);
  await expect(element, `UI element ${selector} should show ${expectedText}`).toContainText(expectedText);
}

/**
 * Assert that component is mounted
 */
export async function assertComponentMounted(
  page: Page,
  componentName: string
): Promise<void> {
  // Try multiple strategies to find component
  const selectors = [
    `[data-testid="${componentName}"]`,
    `[data-component="${componentName}"]`,
    `.${componentName}`,
    `#${componentName}`,
  ];
  
  let found = false;
  for (const selector of selectors) {
    const element = page.locator(selector);
    const count = await element.count();
    if (count > 0) {
      found = true;
      break;
    }
  }
  
  expect(found, `Component ${componentName} should be mounted`).toBe(true);
}

/**
 * Assert that Zustand store was updated
 */
export async function assertStoreUpdated(
  page: Page,
  storeKey: string,
  expectedValue: any
): Promise<void> {
  const storeState = await page.evaluate((key) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) {
      return store.getState()[key];
    }
    return null;
  }, storeKey);
  
  expect(storeState, `Store key ${storeKey} should be updated`).toEqual(expectedValue);
}

/**
 * Assert that database contains expected data
 */
export function assertDatabaseContains(
  dbPath: string,
  collection: string,
  predicate: (item: any) => boolean,
  message?: string
): void {
  const dbContents = getDatabaseContents(dbPath);
  if (!dbContents) {
    throw new Error('Database not found');
  }
  
  const collectionData = dbContents[collection] || [];
  const found = collectionData.find(predicate);
  
  expect(found, message || `Database ${collection} should contain expected data`).toBeDefined();
}

/**
 * Assert that database count matches expected
 */
export function assertDatabaseCount(
  dbPath: string,
  collection: string,
  expectedCount: number
): void {
  const dbContents = getDatabaseContents(dbPath);
  if (!dbContents) {
    throw new Error('Database not found');
  }
  
  const collectionData = dbContents[collection] || [];
  expect(collectionData.length, `Database ${collection} should have ${expectedCount} items`).toBe(expectedCount);
}

