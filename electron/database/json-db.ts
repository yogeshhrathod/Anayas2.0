import { app } from 'electron';
import fs from 'fs';
import path from 'path';
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
  lastModified: string;
  createdAt: string;
}

interface Database {
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

let db: Database = {
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
  if (db.settings.uiFontFamily === undefined) {
    db.settings.uiFontFamily = FONT_SETTING_KEYS.uiFontFamily;
  }
  if (db.settings.codeFontFamily === undefined) {
    db.settings.codeFontFamily = FONT_SETTING_KEYS.codeFontFamily;
  }
}

export function getDatabase(): Database {
  return db;
}

export async function initDatabase(customDbPath?: string): Promise<void> {
  // Support test mode: use custom database path if provided
  if (customDbPath) {
    dbPath = customDbPath;
  } else {
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'database.json');
  }

  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  fs.mkdirSync(dbDir, { recursive: true });

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      db = JSON.parse(data);
      
      // Migration: Add folders table if it doesn't exist
      if (!db.folders) {
        db.folders = [];
        logger.info('Migrated database: Added folders table');
      }
      
      // Migration: Add unsaved_requests table if it doesn't exist
      if (!db.unsaved_requests) {
        db.unsaved_requests = [];
        logger.info('Migrated database: Added unsaved_requests table');
      }
      
      // Migration: Add presets table if it doesn't exist
      if (!db.presets) {
        db.presets = [];
        logger.info('Migrated database: Added presets table');
      }
      
      // Migration: Convert collection.variables to collection.environments
      // Also ensure all collections have environments[] array (even if empty)
      let needsMigration = false;
      for (const collection of db.collections) {
        // Migrate old variables to environments if they exist
        if (!collection.environments && collection.variables && Object.keys(collection.variables).length > 0) {
          collection.environments = [{
            id: generateUniqueId(),
            name: 'Default',
            variables: collection.variables
          }];
          collection.activeEnvironmentId = collection.environments[0].id;
          needsMigration = true;
          logger.info(`Migrated collection ${collection.id}: Converted variables to environments`);
        }
        // Ensure all collections have environments[] array (initialize if missing)
        if (!collection.environments) {
          collection.environments = [];
          needsMigration = true;
        }
      }
      
      if (!db.folders || !db.unsaved_requests || !db.presets || needsMigration) {
        saveDatabase();
      }
    } catch (error) {
      logger.error('Failed to load database, creating new one', { error });
      db = {
        environments: [],
        collections: [],
        folders: [],
        requests: [],
        request_history: [],
        unsaved_requests: [],
        presets: [],
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
      defaultResponseSubTab: 'headers', // Default response view (headers/body/both)
      ...FONT_SETTING_KEYS,
    };
    saveDatabase();
  }
  ensureFontSettingsDefaults();
  
  // Add new settings if they don't exist (for existing databases)
  if (!db.settings.defaultResponseSubTab) {
    db.settings.defaultResponseSubTab = 'headers';
    saveDatabase();
  }

  // Seed sample data if database is empty (skip in test mode)
  if (db.environments.length === 0 && !process.env.TEST_MODE) {
    // ============================================
    // DEMO ENVIRONMENTS
    // ============================================
    
    // Development Environment
    addEnvironment({
      name: 'development',
      displayName: 'Development',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
        api_key: 'dev-api-key-12345',
        user_id: '1',
        timeout: '5000'
      },
      isDefault: 1,
    });

    // Production Environment
    addEnvironment({
      name: 'production',
      displayName: 'Production',
      variables: {
        base_url: 'https://api.example.com',
        api_key: 'prod-api-key-secret',
        user_id: '100',
        timeout: '30000'
      },
      isDefault: 0,
    });

    // ============================================
    // DEMO COLLECTION: REST API Examples
    // ============================================
    const restApiCollectionId = addCollection({
      name: '🚀 REST API Examples',
      description: 'A comprehensive collection demonstrating REST API operations with JSONPlaceholder - a free fake REST API for testing.',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
        user_id: '1',
        post_id: '1'
      },
      isFavorite: 1,
    });

    // GET - List all posts
    addRequest({
      name: 'GET All Posts',
      method: 'GET',
      url: '{{base_url}}/posts',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [
        { key: '_limit', value: '10', enabled: true },
        { key: '_page', value: '1', enabled: true }
      ],
      auth: { type: 'none' },
      collectionId: restApiCollectionId,
      isFavorite: 0,
    });

    // GET - Single post by ID
    addRequest({
      name: 'GET Post by ID',
      method: 'GET',
      url: '{{base_url}}/posts/{{post_id}}',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: restApiCollectionId,
      isFavorite: 0,
    });

    // GET - Posts with query params
    addRequest({
      name: 'GET Posts by User',
      method: 'GET',
      url: '{{base_url}}/posts',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [
        { key: 'userId', value: '{{user_id}}', enabled: true }
      ],
      auth: { type: 'none' },
      collectionId: restApiCollectionId,
      isFavorite: 0,
    });

    // POST - Create new post
    addRequest({
      name: 'POST Create Post',
      method: 'POST',
      url: '{{base_url}}/posts',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: 'My New Post',
        body: 'This is the content of my new post. It demonstrates how to create resources using POST.',
        userId: 1
      }, null, 2),
      queryParams: [],
      auth: { type: 'none' },
      collectionId: restApiCollectionId,
      isFavorite: 0,
    });

    // PUT - Update post
    addRequest({
      name: 'PUT Update Post',
      method: 'PUT',
      url: '{{base_url}}/posts/{{post_id}}',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: 1,
        title: 'Updated Post Title',
        body: 'This post has been completely updated using PUT.',
        userId: 1
      }, null, 2),
      queryParams: [],
      auth: { type: 'none' },
      collectionId: restApiCollectionId,
      isFavorite: 0,
    });

    // PATCH - Partial update
    addRequest({
      name: 'PATCH Partial Update',
      method: 'PATCH',
      url: '{{base_url}}/posts/{{post_id}}',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: 'Only Title Updated'
      }, null, 2),
      queryParams: [],
      auth: { type: 'none' },
      collectionId: restApiCollectionId,
      isFavorite: 0,
    });

    // DELETE - Delete post
    addRequest({
      name: 'DELETE Post',
      method: 'DELETE',
      url: '{{base_url}}/posts/{{post_id}}',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: restApiCollectionId,
      isFavorite: 0,
    });

    // GET - Nested resource (comments for a post)
    addRequest({
      name: 'GET Post Comments',
      method: 'GET',
      url: '{{base_url}}/posts/{{post_id}}/comments',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: restApiCollectionId,
      isFavorite: 0,
    });

    // ============================================
    // DEMO COLLECTION: User Management
    // ============================================
    const userCollectionId = addCollection({
      name: '👤 User Management',
      description: 'Examples of user-related API operations including fetching user data, albums, and todos.',
      variables: {
        base_url: 'https://jsonplaceholder.typicode.com',
        user_id: '1'
      },
      isFavorite: 0,
    });

    // GET - All users
    addRequest({
      name: 'GET All Users',
      method: 'GET',
      url: '{{base_url}}/users',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: userCollectionId,
      isFavorite: 0,
    });

    // GET - Single user
    addRequest({
      name: 'GET User Details',
      method: 'GET',
      url: '{{base_url}}/users/{{user_id}}',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: userCollectionId,
      isFavorite: 0,
    });

    // GET - User's posts
    addRequest({
      name: 'GET User Posts',
      method: 'GET',
      url: '{{base_url}}/users/{{user_id}}/posts',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: userCollectionId,
      isFavorite: 0,
    });

    // GET - User's todos
    addRequest({
      name: 'GET User Todos',
      method: 'GET',
      url: '{{base_url}}/users/{{user_id}}/todos',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [
        { key: 'completed', value: 'false', enabled: false }
      ],
      auth: { type: 'none' },
      collectionId: userCollectionId,
      isFavorite: 0,
    });

    // GET - User's albums
    addRequest({
      name: 'GET User Albums',
      method: 'GET',
      url: '{{base_url}}/users/{{user_id}}/albums',
      headers: {
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: userCollectionId,
      isFavorite: 0,
    });

    // ============================================
    // DEMO COLLECTION: HTTPBin Testing
    // ============================================
    const httpbinCollectionId = addCollection({
      name: '🔧 HTTPBin Testing',
      description: 'Test various HTTP features using httpbin.org - a simple HTTP Request & Response Service.',
      variables: {
        httpbin_url: 'https://httpbin.org'
      },
      isFavorite: 0,
    });

    // Echo request
    addRequest({
      name: 'GET Echo Headers',
      method: 'GET',
      url: '{{httpbin_url}}/headers',
      headers: {
        'X-Custom-Header': 'Luna-Test',
        'Accept': 'application/json'
      },
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: httpbinCollectionId,
      isFavorite: 0,
    });

    // Get IP
    addRequest({
      name: 'GET My IP',
      method: 'GET',
      url: '{{httpbin_url}}/ip',
      headers: {},
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: httpbinCollectionId,
      isFavorite: 0,
    });

    // User Agent
    addRequest({
      name: 'GET User Agent',
      method: 'GET',
      url: '{{httpbin_url}}/user-agent',
      headers: {},
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: httpbinCollectionId,
      isFavorite: 0,
    });

    // Delayed response
    addRequest({
      name: 'GET Delayed Response (3s)',
      method: 'GET',
      url: '{{httpbin_url}}/delay/3',
      headers: {},
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: httpbinCollectionId,
      isFavorite: 0,
    });

    // Status codes
    addRequest({
      name: 'GET Test Status 200',
      method: 'GET',
      url: '{{httpbin_url}}/status/200',
      headers: {},
      body: '',
      queryParams: [],
      auth: { type: 'none' },
      collectionId: httpbinCollectionId,
      isFavorite: 0,
    });

    // POST with JSON body
    addRequest({
      name: 'POST Echo JSON',
      method: 'POST',
      url: '{{httpbin_url}}/post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello from Luna!',
        timestamp: '{{$timestamp}}',
        nested: {
          key1: 'value1',
          key2: 'value2'
        }
      }, null, 2),
      queryParams: [],
      auth: { type: 'none' },
      collectionId: httpbinCollectionId,
      isFavorite: 0,
    });

    // Basic Auth Test
    addRequest({
      name: 'GET Basic Auth Test',
      method: 'GET',
      url: '{{httpbin_url}}/basic-auth/user/passwd',
      headers: {},
      body: '',
      queryParams: [],
      auth: { 
        type: 'basic',
        username: 'user',
        password: 'passwd'
      },
      collectionId: httpbinCollectionId,
      isFavorite: 0,
    });

    logger.info('Seeded demo collections with comprehensive examples');
  }
}

export function saveDatabase(): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Failed to save database', { error });
  }
}

export function closeDatabase(): void {
  saveDatabase();
}

// Helper functions for CRUD operations
export function addEnvironment(env: any): number {
  const id = generateUniqueId();
  db.environments.push({ ...env, id, createdAt: new Date().toISOString() });
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
  const id = generateUniqueId();
  db.collections.push({ ...collection, id, createdAt: new Date().toISOString() });
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
  db.folders = db.folders.filter((f) => f.collectionId !== id);
  db.requests = db.requests.filter((r) => r.collectionId !== id);
  saveDatabase();
}

// Folder CRUD operations
export function addFolder(folder: any): number {
  const id = generateUniqueId();
  
  // Generate order value - if not provided, use a large number to append to end
  let order = folder.order;
  if (order === undefined) {
    const db = getDatabase();
    const maxOrder = Math.max(...db.folders.map(f => f.order || 0), 0);
    order = maxOrder + 1000; // Add 1000 to ensure it goes to the end
  }
  
  db.folders.push({ ...folder, id, order, createdAt: new Date().toISOString() });
  saveDatabase();
  return id;
}

export function addFolderAfter(folder: any, afterFolderId: number): number {
  const id = generateUniqueId();
  const db = getDatabase();
  
  // Find the folder to insert after
  const afterFolder = db.folders.find(f => f.id === afterFolderId);
  if (!afterFolder) {
    // Fallback to regular addFolder if afterFolder not found
    return addFolder(folder);
  }
  
  // Calculate order value - insert between afterFolder and the next folder
  const afterOrder = afterFolder.order || 0;
  const nextFolder = db.folders
    .filter(f => f.collectionId === afterFolder.collectionId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .find(f => (f.order || 0) > afterOrder);
  
  let order;
  if (nextFolder) {
    // Insert between afterFolder and nextFolder
    order = afterOrder + Math.floor(((nextFolder.order || 0) - afterOrder) / 2);
    if (order === afterOrder) {
      order = afterOrder + 1;
    }
  } else {
    // Insert after afterFolder
    order = afterOrder + 1000;
  }
  
  const newFolder = { 
    ...folder, 
    id, 
    order,
    createdAt: new Date().toISOString() 
  };
  
  db.folders.push(newFolder);
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

export function reorderFolder(id: number, newOrder: number): void {
  const index = db.folders.findIndex((f) => f.id === id);
  if (index !== -1) {
    db.folders[index].order = newOrder;
    saveDatabase();
  }
}

export function reorderRequest(id: number, newOrder: number): void {
  const index = db.requests.findIndex((r) => r.id === id);
  if (index !== -1) {
    db.requests[index].order = newOrder;
    saveDatabase();
  }
}

export function deleteFolder(id: number): void {
  db.folders = db.folders.filter((f) => f.id !== id);
  // Also delete all requests in this folder
  db.requests = db.requests.filter((r) => r.folderId !== id);
  saveDatabase();
}

export function addRequest(request: any): number {
  const id = generateUniqueId();
  
  // Generate order value - if not provided, use a large number to append to end
  let order = request.order;
  if (order === undefined) {
    const db = getDatabase();
    const maxOrder = Math.max(...db.requests.map(r => r.order || 0), 0);
    order = maxOrder + 1000; // Add 1000 to ensure it goes to the end
  }
  
  db.requests.push({ 
    ...request, 
    id, 
    order,
    queryParams: request.queryParams || [],
    createdAt: new Date().toISOString() 
  });
  saveDatabase();
  return id;
}

export function addRequestAfter(request: any, afterRequestId: number): number {
  const id = generateUniqueId();
  const db = getDatabase();
  
  // Find the request to insert after
  const afterRequest = db.requests.find(r => r.id === afterRequestId);
  if (!afterRequest) {
    // Fallback to regular addRequest if afterRequest not found
    return addRequest(request);
  }
  
  // Calculate order value - insert between afterRequest and the next request
  const afterOrder = afterRequest.order || 0;
  const nextRequest = db.requests
    .filter(r => r.collectionId === afterRequest.collectionId && r.folderId === afterRequest.folderId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .find(r => (r.order || 0) > afterOrder);
  
  let order;
  if (nextRequest) {
    // Insert between afterRequest and nextRequest
    order = afterOrder + Math.floor(((nextRequest.order || 0) - afterOrder) / 2);
    if (order === afterOrder) {
      order = afterOrder + 1;
    }
  } else {
    // Insert after afterRequest
    order = afterOrder + 1000;
  }
  
  const newRequest = { 
    ...request, 
    id, 
    order,
    queryParams: request.queryParams || [],
    createdAt: new Date().toISOString() 
  };
  
  db.requests.push(newRequest);
  saveDatabase();
  return id;
}

export function updateRequest(id: number, request: any): void {
  const index = db.requests.findIndex((r) => r.id === id);
  if (index !== -1) {
    db.requests[index] = { 
      ...db.requests[index], 
      ...request, 
      id,
      queryParams: request.queryParams || db.requests[index].queryParams || []
    };
    saveDatabase();
  }
}

export function deleteRequest(id: number): void {
  db.requests = db.requests.filter((r) => r.id !== id);
  saveDatabase();
}

export function addRequestHistory(history: any): number {
  const id = generateUniqueId();
  db.request_history.push({ ...history, id, createdAt: new Date().toISOString() });
  saveDatabase();
  return id;
}

export function deleteRequestHistory(id: number): void {
  db.request_history = db.request_history.filter((h) => h.id !== id);
  saveDatabase();
}

export function clearAllRequestHistory(): void {
  db.request_history = [];
  saveDatabase();
}

export function setSetting(key: string, value: any): void {
  if (value === undefined || value === null) {
    // Delete the key if value is undefined or null
    delete db.settings[key];
    logger.debug(`Deleted setting: ${key}`);
  } else {
    db.settings[key] = value;
    logger.debug(`Set setting: ${key}`);
  }
  saveDatabase();
}

export function getSetting(key: string): any {
  return db.settings[key];
}

export function getAllSettings(): Record<string, any> {
  return { ...db.settings };
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
    ...FONT_SETTING_KEYS,
  };
  saveDatabase();
}

// Unsaved Request CRUD operations
export function addUnsavedRequest(request: Omit<UnsavedRequest, 'id' | 'createdAt'>): string {
  const id = `unsaved-${generateUniqueId()}`;
  db.unsaved_requests.push({ 
    ...request, 
    id, 
    createdAt: new Date().toISOString() 
  });
  saveDatabase();
  return id;
}

export function updateUnsavedRequest(id: string, request: Partial<UnsavedRequest>): void {
  const index = db.unsaved_requests.findIndex((r) => r.id === id);
  if (index !== -1) {
    db.unsaved_requests[index] = { 
      ...db.unsaved_requests[index], 
      ...request, 
      id,
      lastModified: new Date().toISOString()
    };
    saveDatabase();
  }
}

export function deleteUnsavedRequest(id: string): void {
  db.unsaved_requests = db.unsaved_requests.filter((r) => r.id !== id);
  saveDatabase();
}

export function getAllUnsavedRequests(): UnsavedRequest[] {
  return [...db.unsaved_requests];
}

export function clearUnsavedRequests(): void {
  db.unsaved_requests = [];
  saveDatabase();
}

export function promoteUnsavedRequest(id: string, requestData: any): number {
  // Convert unsaved request to saved request
  const unsaved = db.unsaved_requests.find(r => r.id === id);
  if (!unsaved) {
    throw new Error('Unsaved request not found');
  }
  
  // Create saved request
  const savedId = addRequest({
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
  
  // Delete unsaved request
  deleteUnsavedRequest(id);
  
  return savedId;
}

// Preset CRUD operations
export function addPreset(preset: any): string {
  const id = preset.id || `preset-${Date.now()}`;
  const existingIndex = db.presets.findIndex((p) => p.id === id);
  
  if (existingIndex !== -1) {
    // Update existing preset
    db.presets[existingIndex] = { 
      ...preset, 
      id,
      updatedAt: new Date().toISOString()
    };
    saveDatabase();
    return id;
  } else {
    // Add new preset
    db.presets.push({ 
      ...preset, 
      id, 
      createdAt: new Date().toISOString() 
    });
    saveDatabase();
    return id;
  }
}

export function getAllPresets(requestId?: number): any[] {
  if (requestId === undefined) {
    return [...db.presets];
  }
  return db.presets.filter(p => p.requestId === requestId);
}

export function deletePreset(id: string): void {
  db.presets = db.presets.filter((p) => p.id !== id);
  saveDatabase();
}
