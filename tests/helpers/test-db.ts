import fs from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';

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

  // Use .sqlite extension for SQLite database
  return path.join(testDir, 'database.sqlite');
}

/**
 * Create a clean test database
 */
export function createTestDatabase(config?: TestDatabaseConfig): string {
  const dbPath = getTestDatabasePath(config);

  // For SQLite, we just ensure the file doesn't exist yet
  // so that the initialization logic can create it fresh.
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
    if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
  }
  
  return dbPath;
}

/**
 * Clean up test database
 */
export function cleanTestDatabase(dbPath: string): void {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      // SQLite also creates WAL/SHM files
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
      
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

  // NOTE: This implementation might need specific logic to populate the SQLite table
  // but for legacy compatibility we might just write the JSON and expect the app to migrate it
  // Actually, better to just let the app handle the .json if it exists.
  const oldJsonPath = dbPath.replace('.sqlite', '.json');
  const fixtureData = fs.readFileSync(fixturePath, 'utf-8');
  fs.writeFileSync(oldJsonPath, fixtureData, 'utf-8');
  
  // If we already have a .sqlite file, we should probably delete it to force migration
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
    if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
  }
}

/**
 * Get database contents for verification
 */
export function getDatabaseContents(dbPath: string): any {
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const db = new Database(dbPath);
  try {
    const listTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const result: any = {};
    
    for (const table of listTables) {
      if (table.name === 'settings') {
        const rows = db.prepare(`SELECT key, value FROM ${table.name}`).all() as { key: string, value: string }[];
        result.settings = {};
        rows.forEach(r => {
          result.settings[r.key] = JSON.parse(r.value);
        });
      } else {
        const rows = db.prepare(`SELECT data FROM ${table.name}`).all() as { data: string }[];
        result[table.name] = rows.map(r => JSON.parse(r.data));
      }
    }
    
    return result;
  } catch (e) {
    console.error('Error reading test database:', e);
    return null;
  } finally {
    db.close();
  }
}

/**
 * Reset database to empty state
 */
export function resetDatabase(dbPath: string): void {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  // Also clean up side files
  if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
  if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
}
