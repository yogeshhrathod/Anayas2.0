import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Test database utilities for creating isolated test databases
 */

export interface TestDatabaseConfig {
  basePath?: string;
  testName?: string;
}

let testDbCounter = 0;

/**
 * Get a unique test database path
 */
export function getTestDatabasePath(config?: TestDatabaseConfig): string {
  const basePath = config?.basePath || path.join(os.tmpdir(), 'anayas-test-db');
  const testName = config?.testName || `test-${Date.now()}-${++testDbCounter}`;
  const testDir = path.join(basePath, testName);

  // Ensure directory exists
  fs.mkdirSync(testDir, { recursive: true });

  return path.join(testDir, 'database.json');
}

/**
 * Create a clean test database
 */
export function createTestDatabase(config?: TestDatabaseConfig): string {
  const dbPath = getTestDatabasePath(config);

  // Initialize with empty database structure
  const emptyDb = {
    environments: [],
    collections: [],
    folders: [],
    requests: [],
    request_history: [],
    unsaved_requests: [],
    presets: [],
    settings: {
      theme: 'system',
      defaultMethod: 'GET',
      requestTimeout: 30000,
      followRedirects: true,
      sslVerification: true,
      autoSaveRequests: true,
      maxHistory: 1000,
      debugMode: false,
    },
  };

  fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), 'utf-8');
  return dbPath;
}

/**
 * Clean up test database
 */
export function cleanTestDatabase(dbPath: string): void {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      // Try to remove parent directory if empty
      const dir = path.dirname(dbPath);
      try {
        const files = fs.readdirSync(dir);
        if (files.length === 0) {
          fs.rmdirSync(dir);
        }
      } catch {
        // Ignore errors when removing directory
      }
    }
  } catch (error) {
    // Ignore cleanup errors
    console.warn('Failed to clean test database:', error);
  }
}

/**
 * Load test data from fixture file
 */
export function loadTestData(dbPath: string, fixturePath: string): void {
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Test fixture not found: ${fixturePath}`);
  }

  const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  fs.writeFileSync(dbPath, JSON.stringify(fixtureData, null, 2), 'utf-8');
}

/**
 * Get database contents for verification
 */
export function getDatabaseContents(dbPath: string): any {
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

/**
 * Reset database to empty state
 */
export function resetDatabase(dbPath: string): void {
  const emptyDb = {
    environments: [],
    collections: [],
    folders: [],
    requests: [],
    request_history: [],
    unsaved_requests: [],
    presets: [],
    settings: {
      theme: 'system',
      defaultMethod: 'GET',
      requestTimeout: 30000,
      followRedirects: true,
      sslVerification: true,
      autoSaveRequests: true,
      maxHistory: 1000,
      debugMode: false,
    },
  };

  fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), 'utf-8');
}
