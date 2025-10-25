import fs from 'fs';
import path from 'path';
import { app } from 'electron';

interface Database {
  environments: any[];
  collections: any[];
  folders: any[];
  requests: any[];
  request_history: any[];
  settings: Record<string, any>;
}

let db: Database = {
  environments: [],
  collections: [],
  folders: [],
  requests: [],
  request_history: [],
  settings: {},
};

let dbPath: string;

export function getDatabase(): Database {
  return db;
}

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'database.json');

  // Ensure directory exists
  fs.mkdirSync(userDataPath, { recursive: true });

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      db = JSON.parse(data);
      
      // Migration: Add folders table if it doesn't exist
      if (!db.folders) {
        db.folders = [];
        console.log('Migrated database: Added folders table');
        saveDatabase();
      }
    } catch (error) {
      console.error('Failed to load database, creating new one:', error);
      db = {
        environments: [],
        collections: [],
        folders: [],
        requests: [],
        request_history: [],
        settings: {},
      };
    }
  }

  // Seed default settings if empty
  if (Object.keys(db.settings).length === 0) {
    db.settings = {
      theme: 'system',
      defaultMethod: 'GET',
      requestTimeout: 30000,
      followRedirects: true,
      sslVerification: true,
      autoSaveRequests: true,
      maxHistory: 1000,
      debugMode: false,
    };
    saveDatabase();
  }

  // Seed sample data if database is empty
  if (db.environments.length === 0) {
    // Add sample environment
    addEnvironment({
      name: 'development',
      display_name: 'Development',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
        api_key: 'dev-key-123'
      },
      is_default: 1,
    });

    // Add sample collection
    addCollection({
      name: 'JSONPlaceholder API',
      description: 'Sample REST API for testing',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
        user_id: '1'
      },
      is_favorite: 1,
    });

    // Add sample request
    addRequest({
      name: 'Get Users',
      method: 'GET',
      url: '{{base_url}}/users',
      headers: {
        'Content-Type': 'application/json'
      },
      body: null,
      collection_id: 1,
      is_favorite: 0,
    });

    // Add sample request history
    addRequestHistory({
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/users',
      status: 200,
      response_time: 245,
      response_body: JSON.stringify([
        {
          "id": 1,
          "name": "Leanne Graham",
          "username": "Bret",
          "email": "Sincere@april.biz"
        }
      ]),
      headers: JSON.stringify({
        'content-type': 'application/json'
      }),
    });
  }
}

export function saveDatabase(): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

export function closeDatabase(): void {
  saveDatabase();
}

// Helper functions for CRUD operations
export function addEnvironment(env: any): number {
  const id = Date.now();
  db.environments.push({ ...env, id, created_at: new Date().toISOString() });
  saveDatabase();
  return id;
}

export function updateEnvironment(id: number, env: any): void {
  const index = db.environments.findIndex((e) => e.id === id);
  if (index !== -1) {
    db.environments[index] = { ...db.environments[index], ...env, id };
    saveDatabase();
  }
}

export function deleteEnvironment(id: number): void {
  db.environments = db.environments.filter((e) => e.id !== id);
  saveDatabase();
}

export function addCollection(collection: any): number {
  const id = Date.now();
  db.collections.push({ ...collection, id, created_at: new Date().toISOString() });
  saveDatabase();
  return id;
}

export function updateCollection(id: number, collection: any): void {
  const index = db.collections.findIndex((c) => c.id === id);
  if (index !== -1) {
    db.collections[index] = { ...db.collections[index], ...collection, id };
    saveDatabase();
  }
}

export function deleteCollection(id: number): void {
  db.collections = db.collections.filter((c) => c.id !== id);
  // Also delete all folders and requests in this collection
  db.folders = db.folders.filter((f) => f.collection_id !== id);
  db.requests = db.requests.filter((r) => r.collection_id !== id);
  saveDatabase();
}

// Folder CRUD operations
export function addFolder(folder: any): number {
  const id = Date.now();
  db.folders.push({ ...folder, id, created_at: new Date().toISOString() });
  saveDatabase();
  return id;
}

export function updateFolder(id: number, folder: any): void {
  const index = db.folders.findIndex((f) => f.id === id);
  if (index !== -1) {
    db.folders[index] = { ...db.folders[index], ...folder, id };
    saveDatabase();
  }
}

export function deleteFolder(id: number): void {
  db.folders = db.folders.filter((f) => f.id !== id);
  // Also delete all requests in this folder
  db.requests = db.requests.filter((r) => r.folder_id !== id);
  saveDatabase();
}

export function addRequest(request: any): number {
  const id = Date.now();
  db.requests.push({ ...request, id, created_at: new Date().toISOString() });
  saveDatabase();
  return id;
}

export function updateRequest(id: number, request: any): void {
  const index = db.requests.findIndex((r) => r.id === id);
  if (index !== -1) {
    db.requests[index] = { ...db.requests[index], ...request, id };
    saveDatabase();
  }
}

export function deleteRequest(id: number): void {
  db.requests = db.requests.filter((r) => r.id !== id);
  saveDatabase();
}

export function addRequestHistory(history: any): number {
  const id = Date.now();
  db.request_history.push({ ...history, id, created_at: new Date().toISOString() });
  saveDatabase();
  return id;
}

export function deleteRequestHistory(id: number): void {
  db.request_history = db.request_history.filter((h) => h.id !== id);
  saveDatabase();
}

export function setSetting(key: string, value: any): void {
  db.settings[key] = value;
  saveDatabase();
}

export function getSetting(key: string): any {
  return db.settings[key];
}

export function getAllSettings(): Record<string, any> {
  return db.settings;
}

export function resetSettings(): void {
  db.settings = {
    theme: 'system',
    defaultMethod: 'GET',
    requestTimeout: 30000,
    followRedirects: true,
    sslVerification: true,
    autoSaveRequests: true,
    maxHistory: 1000,
    debugMode: false,
  };
  saveDatabase();
}
