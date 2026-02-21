import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../services/logger';

const logger = createLogger('database');

export interface UnsavedRequest {
  id: string; // UUID for unsaved requests
  name: string; // Auto-generated draft name
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  auth: any;
  lastResponse?: any;
  lastModified: string;
  createdAt: string;
}

interface AppDatabase {
  environments: any[];
  collections: any[];
  folders: any[];
  requests: any[];
  request_history: any[];
  unsaved_requests: UnsavedRequest[];
  presets: any[];
  settings: Record<string, any>;
}

const FONT_SETTING_KEYS = {
  uiFontFamily: '',
  codeFontFamily: '',
};

let dbMemory: AppDatabase = {
  environments: [],
  collections: [],
  folders: [],
  requests: [],
  request_history: [],
  unsaved_requests: [],
  presets: [],
  settings: {},
};

let dbPath: string;
let sqliteDb: Database.Database | null = null;

// Helper function to generate unique IDs
let lastId = Date.now();
export function generateUniqueId(): number {
  const now = Date.now();
  if (now <= lastId) {
    lastId += 1;
  } else {
    lastId = now;
  }
  return lastId;
}

function ensureFontSettingsDefaults(): void {
  if (dbMemory.settings.uiFontFamily === undefined) {
    dbMemory.settings.uiFontFamily = FONT_SETTING_KEYS.uiFontFamily;
  }
  if (dbMemory.settings.codeFontFamily === undefined) {
    dbMemory.settings.codeFontFamily = FONT_SETTING_KEYS.codeFontFamily;
  }
}

export function getDatabase(): AppDatabase {
  return dbMemory;
}

export async function initDatabase(customDbPath?: string): Promise<void> {
  if (customDbPath) {
    dbPath = customDbPath;
  } else {
    const userDataPath = app.getPath('userData');
    // Change from database.json to database.sqlite
    dbPath = path.join(userDataPath, 'database.sqlite');
  }

  const dbDir = path.dirname(dbPath);
  fs.mkdirSync(dbDir, { recursive: true });

  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');

  // Initialize tables
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS request_history (
      id INTEGER PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS unsaved_requests (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  logger.info('SQLite database initialized at ' + dbPath);
  
  // Migration from JSON DB if it exists and SQlite is empty
  let isNewDb = true;
  const envCount = sqliteDb.prepare('SELECT count(*) as c FROM environments').get() as { c: number };
  if (envCount.c > 0) isNewDb = false;

  const oldJsonPath = dbPath.replace('.sqlite', '.json');
  if (isNewDb && fs.existsSync(oldJsonPath)) {
    try {
      logger.info('Migrating from json db to sqlite db...');
      const oldData = fs.readFileSync(oldJsonPath, 'utf-8');
      const parsed = JSON.parse(oldData);
      dbMemory = {
        environments: parsed.environments || [],
        collections: parsed.collections || [],
        folders: parsed.folders || [],
        requests: parsed.requests || [],
        request_history: parsed.request_history || [],
        unsaved_requests: parsed.unsaved_requests || [],
        presets: parsed.presets || [],
        settings: parsed.settings || {},
      };
      saveDatabase(); // This will populate SQLite
    } catch(err) {
      logger.error('Failed to migrate from json db', { err });
    }
  } else {
    // Load from SQLite
    try {
      const loadTable = (tableName: string) => {
        const rows = sqliteDb!.prepare(`SELECT data FROM ${tableName}`).all() as { data: string }[];
        return rows.map(r => JSON.parse(r.data));
      };

      dbMemory.environments = loadTable('environments');
      dbMemory.collections = loadTable('collections');
      dbMemory.folders = loadTable('folders');
      dbMemory.requests = loadTable('requests');
      dbMemory.request_history = loadTable('request_history');
      
      const unsavedRows = sqliteDb.prepare('SELECT data FROM unsaved_requests').all() as { data: string }[];
      dbMemory.unsaved_requests = unsavedRows.map(r => JSON.parse(r.data));

      const presetRows = sqliteDb.prepare('SELECT data FROM presets').all() as { data: string }[];
      dbMemory.presets = presetRows.map(r => JSON.parse(r.data));

      const settingRows = sqliteDb.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
      dbMemory.settings = {};
      settingRows.forEach(r => {
        dbMemory.settings[r.key] = JSON.parse(r.value);
      });
    } catch(err) {
      logger.error('Failed to load DB from SQLite', { err });
    }
  }

  // Common init operations
  let needsMigration = false;
  for (const collection of dbMemory.collections) {
    if (
      !collection.environments &&
      collection.variables &&
      Object.keys(collection.variables).length > 0
    ) {
      collection.environments = [
        {
          id: generateUniqueId(),
          name: 'Default',
          variables: collection.variables,
        },
      ];
      collection.activeEnvironmentId = collection.environments[0].id;
      needsMigration = true;
    }
    if (!collection.environments) {
      collection.environments = [];
      needsMigration = true;
    }
  }

  if (needsMigration) await saveDatabase();

  if (Object.keys(dbMemory.settings).length === 0) {
    dbMemory.settings = {
      theme: 'system',
      defaultMethod: 'GET',
      requestTimeout: 30000,
      followRedirects: true,
      sslVerification: true,
      autoSaveRequests: true,
      maxHistory: 1000,
      debugMode: false,
      defaultResponseSubTab: 'headers',
      telemetryEnabled: true,
      telemetryId: uuidv4(),
      ...FONT_SETTING_KEYS,
    };
    await saveDatabase();
  }
  
  if (!dbMemory.settings.telemetryId) {
    dbMemory.settings.telemetryId = uuidv4();
    await saveDatabase();
  }
  ensureFontSettingsDefaults();

  if (!dbMemory.settings.defaultResponseSubTab) {
    dbMemory.settings.defaultResponseSubTab = 'headers';
    await saveDatabase();
  }

  if (dbMemory.environments.length === 0 && !process.env.TEST_MODE) {
    // Seed Demo
    addEnvironment({
      name: 'demo',
      displayName: 'Demo Environment',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
        post_id: '1',
      },
      isDefault: 1,
    });

    const collectionId = addCollection({
      name: 'Sample API Collection',
      description: 'Demo collection with example requests using JSONPlaceholder API',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
        post_id: '1',
      },
      isFavorite: 1,
    });

    addRequest({
      name: 'Get Posts',
      method: 'GET',
      url: '{{base_url}}/posts',
      headers: { Accept: 'application/json' },
      body: '',
      queryParams: [{ key: '_limit', value: '5', enabled: true }],
      auth: { type: 'none' },
      collectionId: collectionId,
      isFavorite: 0,
    });
    // Add other requests similarly if needed...
  }
}

export async function saveDatabase(): Promise<void> {
  if (!sqliteDb) return;
  // Use a promise to make it "async" as requested, though better-sqlite3 is sync
  // This allows the caller to not block if we ever move to a worker
  return new Promise((resolve, reject) => {
    try {
      const insertMany = (tableName: string, items: any[], isTextId: boolean = false) => {
        sqliteDb!.exec(`DELETE FROM ${tableName}`);
        const insert = sqliteDb!.prepare(`INSERT INTO ${tableName} (id, data) VALUES (?, ?)`);
        const insertManyTrans = sqliteDb!.transaction((elements) => {
          for (const el of elements) {
            insert.run(isTextId ? el.id : Number(el.id), JSON.stringify(el));
          }
        });
        insertManyTrans(items);
      };

      sqliteDb!.transaction(() => {
        insertMany('environments', dbMemory.environments);
        insertMany('collections', dbMemory.collections);
        insertMany('folders', dbMemory.folders);
        insertMany('requests', dbMemory.requests);
        insertMany('request_history', dbMemory.request_history);
        insertMany('unsaved_requests', dbMemory.unsaved_requests, true);
        insertMany('presets', dbMemory.presets, true);
        
        sqliteDb!.exec('DELETE FROM settings');
        const insertSettings = sqliteDb!.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        for (const [key, val] of Object.entries(dbMemory.settings)) {
          insertSettings.run(key, JSON.stringify(val));
        }
      })();
      resolve();
    } catch (error) {
      logger.error('Failed to save sqlite database', { error });
      reject(error);
    }
  });
}

export async function closeDatabase(): Promise<void> {
  await saveDatabase();
  if (sqliteDb) {
    sqliteDb.close();
  }
}

// ... All remaining CRUD helpers exact same ...
export async function addEnvironment(env: any): Promise<number> {
  const id = generateUniqueId();
  dbMemory.environments.push({ ...env, id, createdAt: new Date().toISOString() });
  await saveDatabase();
  return id;
}

export async function updateEnvironment(id: number, env: any): Promise<void> {
  const index = dbMemory.environments.findIndex(e => e.id === id);
  if (index !== -1) {
    dbMemory.environments[index] = { ...dbMemory.environments[index], ...env, id };
    await saveDatabase();
  }
}

export async function deleteEnvironment(id: number): Promise<void> {
  dbMemory.environments = dbMemory.environments.filter(e => e.id !== id);
  await saveDatabase();
}

export async function addCollection(collection: any): Promise<number> {
  const id = generateUniqueId();
  dbMemory.collections.push({
    ...collection,
    id,
    createdAt: new Date().toISOString(),
  });
  await saveDatabase();
  return id;
}

export async function updateCollection(id: number, collection: any): Promise<void> {
  const index = dbMemory.collections.findIndex(c => c.id === id);
  if (index !== -1) {
    dbMemory.collections[index] = { ...dbMemory.collections[index], ...collection, id };
    await saveDatabase();
  }
}

export async function deleteCollection(id: number): Promise<void> {
  const deletedRequestIds = new Set(
    dbMemory.requests.filter(r => r.collectionId === id).map(r => r.id)
  );

  dbMemory.collections = dbMemory.collections.filter(c => c.id !== id);
  dbMemory.folders = dbMemory.folders.filter(f => f.collectionId !== id);
  dbMemory.requests = dbMemory.requests.filter(r => r.collectionId !== id);

  if (deletedRequestIds.size > 0) {
    dbMemory.request_history = dbMemory.request_history.filter(
      h => !deletedRequestIds.has(h.requestId)
    );
    dbMemory.presets = dbMemory.presets.filter(
      p => !deletedRequestIds.has(p.requestId)
    );
  }

  await saveDatabase();
}

export async function addFolder(folder: any): Promise<number> {
  const id = generateUniqueId();
  let order = folder.order;
  if (order === undefined) {
    const maxOrder = Math.max(...dbMemory.folders.map(f => f.order || 0), 0);
    order = maxOrder + 1000;
  }

  dbMemory.folders.push({
    ...folder,
    id,
    order,
    createdAt: new Date().toISOString(),
  });
  await saveDatabase();
  return id;
}

export async function addFolderAfter(folder: any, afterFolderId: number): Promise<number> {
  const id = generateUniqueId();
  const afterFolder = dbMemory.folders.find(f => f.id === afterFolderId);
  if (!afterFolder) return addFolder(folder);

  const afterOrder = afterFolder.order || 0;
  const nextFolder = dbMemory.folders
    .filter(f => f.collectionId === afterFolder.collectionId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .find(f => (f.order || 0) > afterOrder);

  let order;
  if (nextFolder) {
    order = afterOrder + Math.floor(((nextFolder.order || 0) - afterOrder) / 2);
    if (order === afterOrder) order = afterOrder + 1;
  } else {
    order = afterOrder + 1000;
  }

  dbMemory.folders.push({
    ...folder,
    id,
    order,
    createdAt: new Date().toISOString(),
  });
  await saveDatabase();
  return id;
}

export async function updateFolder(id: number, folder: any): Promise<void> {
  const index = dbMemory.folders.findIndex(f => f.id === id);
  if (index !== -1) {
    dbMemory.folders[index] = { ...dbMemory.folders[index], ...folder, id };
    await saveDatabase();
  }
}

export async function reorderFolder(id: number, newOrder: number): Promise<void> {
  const index = dbMemory.folders.findIndex(f => f.id === id);
  if (index !== -1) {
    dbMemory.folders[index].order = newOrder;
    await saveDatabase();
  }
}

export async function reorderRequest(id: number, newOrder: number): Promise<void> {
  const index = dbMemory.requests.findIndex(r => r.id === id);
  if (index !== -1) {
    dbMemory.requests[index].order = newOrder;
    await saveDatabase();
  }
}

export async function deleteFolder(id: number): Promise<void> {
  dbMemory.folders = dbMemory.folders.filter(f => f.id !== id);
  dbMemory.requests = dbMemory.requests.filter(r => r.folderId !== id);
  await saveDatabase();
}

export async function addRequest(request: any): Promise<number> {
  const id = generateUniqueId();
  let order = request.order;
  if (order === undefined) {
    const maxOrder = Math.max(...dbMemory.requests.map(r => r.order || 0), 0);
    order = maxOrder + 1000;
  }

  dbMemory.requests.push({
    ...request,
    id,
    order,
    queryParams: request.queryParams || [],
    createdAt: new Date().toISOString(),
  });
  await saveDatabase();
  return id;
}

export async function addRequestAfter(request: any, afterRequestId: number): Promise<number> {
  const id = generateUniqueId();
  const afterRequest = dbMemory.requests.find(r => r.id === afterRequestId);
  if (!afterRequest) return await addRequest(request);

  const afterOrder = afterRequest.order || 0;
  const nextRequest = dbMemory.requests
    .filter(
      r => r.collectionId === afterRequest.collectionId && r.folderId === afterRequest.folderId
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .find(r => (r.order || 0) > afterOrder);

  let order;
  if (nextRequest) {
    order = afterOrder + Math.floor(((nextRequest.order || 0) - afterOrder) / 2);
    if (order === afterOrder) order = afterOrder + 1;
  } else {
    order = afterOrder + 1000;
  }

  dbMemory.requests.push({
    ...request,
    id,
    order,
    queryParams: request.queryParams || [],
    createdAt: new Date().toISOString(),
  });
  await saveDatabase();
  return id;
}

export async function updateRequest(id: number, request: any): Promise<void> {
  const index = dbMemory.requests.findIndex(r => r.id === id);
  if (index !== -1) {
    dbMemory.requests[index] = {
      ...dbMemory.requests[index],
      ...request,
      id,
      queryParams: request.queryParams || dbMemory.requests[index].queryParams || [],
    };
    await saveDatabase();
  }
}

export async function deleteRequest(id: number): Promise<void> {
  dbMemory.requests = dbMemory.requests.filter(r => r.id !== id);
  await saveDatabase();
}

export async function addRequestHistory(history: any): Promise<number> {
  const id = generateUniqueId();
  dbMemory.request_history.push({
    ...history,
    id,
    createdAt: new Date().toISOString(),
  });
  await saveDatabase();
  return id;
}

export async function deleteRequestHistory(id: number): Promise<void> {
  dbMemory.request_history = dbMemory.request_history.filter(h => h.id !== id);
  await saveDatabase();
}

export async function clearAllRequestHistory(): Promise<void> {
  dbMemory.request_history = [];
  await saveDatabase();
}

export async function setSetting(key: string, value: any): Promise<void> {
  if (value === undefined || value === null) {
    delete dbMemory.settings[key];
  } else {
    dbMemory.settings[key] = value;
  }
  await saveDatabase();
}

export function getSetting(key: string): any {
  return dbMemory.settings[key];
}

export function getAllSettings(): Record<string, any> {
  return { ...dbMemory.settings };
}

export async function resetSettings(): Promise<void> {
  dbMemory.settings = {
    theme: 'system',
    defaultMethod: 'GET',
    requestTimeout: 30000,
    followRedirects: true,
    sslVerification: true,
    autoSaveRequests: true,
    maxHistory: 1000,
    debugMode: false,
    ...FONT_SETTING_KEYS,
  };
  await saveDatabase();
}

export async function addUnsavedRequest(request: Omit<UnsavedRequest, 'id' | 'createdAt'>): Promise<string> {
  const id = `unsaved-${generateUniqueId()}`;
  dbMemory.unsaved_requests.push({
    ...request,
    id,
    createdAt: new Date().toISOString(),
  });
  await saveDatabase();
  return id;
}

export async function updateUnsavedRequest(id: string, request: Partial<UnsavedRequest>): Promise<void> {
  const index = dbMemory.unsaved_requests.findIndex(r => r.id === id);
  if (index !== -1) {
    dbMemory.unsaved_requests[index] = {
      ...dbMemory.unsaved_requests[index],
      ...request,
      id,
      lastModified: new Date().toISOString(),
    };
    await saveDatabase();
  }
}

export async function deleteUnsavedRequest(id: string): Promise<void> {
  dbMemory.unsaved_requests = dbMemory.unsaved_requests.filter(r => r.id !== id);
  await saveDatabase();
}

export function getAllUnsavedRequests(): UnsavedRequest[] {
  return [...dbMemory.unsaved_requests];
}

export async function clearUnsavedRequests(): Promise<void> {
  dbMemory.unsaved_requests = [];
  await saveDatabase();
}

export async function promoteUnsavedRequest(id: string, requestData: any): Promise<number> {
  const unsaved = dbMemory.unsaved_requests.find(r => r.id === id);
  if (!unsaved) throw new Error('Unsaved request not found');

  const savedId = await addRequest({
    name: requestData.name || unsaved.name,
    method: unsaved.method,
    url: unsaved.url,
    headers: unsaved.headers,
    body: unsaved.body,
    queryParams: unsaved.queryParams,
    auth: unsaved.auth,
    collectionId: requestData.collectionId,
    folderId: requestData.folderId,
    isFavorite: requestData.isFavorite ? 1 : 0,
  });

  await deleteUnsavedRequest(id);
  return savedId;
}

export async function addPreset(preset: any): Promise<string> {
  const id = preset.id || `preset-${Date.now()}`;
  const existingIndex = dbMemory.presets.findIndex(p => p.id === id);

  if (existingIndex !== -1) {
    dbMemory.presets[existingIndex] = {
      ...preset,
      id,
      updatedAt: new Date().toISOString(),
    };
    await saveDatabase();
    return id;
  } else {
    dbMemory.presets.push({
      ...preset,
      id,
      createdAt: new Date().toISOString(),
    });
    await saveDatabase();
    return id;
  }
}

export function getAllPresets(requestId?: number): any[] {
  if (requestId === undefined) return [...dbMemory.presets];
  return dbMemory.presets.filter(p => p.requestId === requestId);
}

export async function deletePreset(id: string): Promise<void> {
  dbMemory.presets = dbMemory.presets.filter(p => p.id !== id);
  await saveDatabase();
}
