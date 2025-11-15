import { test as base, Page } from '@playwright/test';
import { createTestDatabase, cleanTestDatabase } from './test-db';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { getDatabaseContents } from './test-db';

export interface ElectronFixtures {
  electronPage: Page;
  testDbPath: string;
}

/**
 * Create IPC handler wrappers that can be called directly
 * This allows us to test IPC communication without actually running Electron
 */
async function createIPCHandlers(testDbPath: string) {
  // Initialize database with test path
  process.env.TEST_MODE = 'true';
  process.env.TEST_DB_PATH = testDbPath;
  
  // Use require for Node.js modules in test context
  const db = require('../../electron/database/json-db');
  const apiService = require('../../electron/services/api');
  const variableResolver = require('../../electron/services/variable-resolver');
  
  await db.initDatabase(testDbPath);
  
  // Create handler functions that match IPC handler logic
  // We'll create a simplified version that directly calls the database functions
  return {
    env: {
      list: async () => {
        const database = db.getDatabase();
        return database.environments.sort((a: any, b: any) => {
          const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return bTime - aTime;
        });
      },
      save: async (env: any) => {
        if (env.id) {
          db.updateEnvironment(env.id, {
            name: env.name,
            displayName: env.displayName,
            variables: env.variables || {},
            isDefault: env.isDefault ? 1 : 0,
          });
          return { success: true, id: env.id };
        } else {
          const id = db.addEnvironment({
            name: env.name,
            displayName: env.displayName,
            variables: env.variables || {},
            isDefault: env.isDefault ? 1 : 0,
          });
          return { success: true, id };
        }
      },
      delete: async (id: number) => {
        db.deleteEnvironment(id);
        return { success: true };
      },
      getCurrent: async () => {
        const database = db.getDatabase();
        const defaultEnv = database.environments.find((e: any) => e.isDefault === 1);
        if (!defaultEnv && database.environments.length > 0) {
          return database.environments[0];
        }
        return defaultEnv || null;
      },
      setCurrent: async (id: number) => {
        const database = db.getDatabase();
        database.environments.forEach((env: any) => {
          env.isDefault = env.id === id ? 1 : 0;
          if (env.id === id) {
            env.lastUsed = new Date().toISOString();
          }
        });
        db.saveDatabase();
        return { success: true };
      },
    },
    collection: {
      list: async () => {
        const database = db.getDatabase();
        return database.collections.sort((a: any, b: any) => {
          const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return bTime - aTime;
        });
      },
      save: async (collection: any) => {
        if (collection.id) {
          db.updateCollection(collection.id, {
            name: collection.name,
            description: collection.description,
            documentation: collection.documentation || '',
            environments: collection.environments || [],
            activeEnvironmentId: collection.activeEnvironmentId,
            isFavorite: collection.isFavorite ? 1 : 0,
          });
          return { success: true, id: collection.id };
        } else {
          const id = db.addCollection({
            name: collection.name,
            description: collection.description,
            documentation: collection.documentation || '',
            environments: collection.environments || [],
            activeEnvironmentId: collection.activeEnvironmentId,
            isFavorite: collection.isFavorite ? 1 : 0,
          });
          return { success: true, id };
        }
      },
      delete: async (id: number) => {
        db.deleteCollection(id);
        return { success: true };
      },
      toggleFavorite: async (id: number) => {
        const database = db.getDatabase();
        const collection = database.collections.find((c: any) => c.id === id);
        if (collection) {
          collection.isFavorite = collection.isFavorite === 1 ? 0 : 1;
          db.saveDatabase();
        }
        return { success: true };
      },
      setActiveEnvironment: async (collectionId: number, environmentId: number | null) => {
        const database = db.getDatabase();
        const collection = database.collections.find((c: any) => c.id === collectionId);
        if (!collection) {
          throw new Error('Collection not found');
        }
        if (environmentId !== null && environmentId !== undefined) {
          if (!collection.environments || !collection.environments.find((e: any) => e.id === environmentId)) {
            throw new Error('Environment not found');
          }
        }
        collection.activeEnvironmentId = environmentId;
        db.saveDatabase();
        const updatedCollection = database.collections.find((c: any) => c.id === collectionId);
        return { success: true, collection: updatedCollection };
      },
      run: async (collectionId: number) => {
        try {
          const database = db.getDatabase();
          
          const collection = database.collections.find((c: any) => c.id === collectionId);
          if (!collection) {
            throw new Error('Collection not found');
          }

          // Get all requests in this collection first
          const allRequests = database.requests.filter((r: any) => r.collectionId === collectionId);
          
          // If no requests, return early (don't need environment)
          if (allRequests.length === 0) {
            return { success: true, results: [], message: 'No requests found in collection' };
          }

          const globalEnv = database.environments.find((e: any) => e.isDefault === 1) || database.environments[0];
          if (!globalEnv) {
            throw new Error('No environment selected');
          }

          let collectionVariables: Record<string, string> = {};
          if (collection.environments && collection.activeEnvironmentId) {
            const activeEnv = collection.environments.find((e: any) => e.id === collection.activeEnvironmentId);
            if (activeEnv) {
              collectionVariables = activeEnv.variables || {};
            }
          }

          const variableContext = {
            globalVariables: globalEnv.variables || {},
            collectionVariables
          };
          
          const sortedRequests = allRequests.sort((a: any, b: any) => {
            const orderA = a.order || 0;
            const orderB = b.order || 0;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return (a.id || 0) - (b.id || 0);
          });

          const results: Array<{
            requestId: number;
            requestName: string;
            success: boolean;
            status?: number;
            responseTime?: number;
            error?: string;
          }> = [];

          for (let i = 0; i < sortedRequests.length; i++) {
            const request = sortedRequests[i];
            
            try {
              const resolvedUrl = variableResolver.variableResolver.resolve(request.url, variableContext);
              const resolvedHeaders = variableResolver.variableResolver.resolveObject(request.headers || {}, variableContext);
              let resolvedBody = typeof request.body === 'string' 
                ? variableResolver.variableResolver.resolve(request.body, variableContext)
                : request.body;
              
              // Parse JSON string body if it's a string
              if (typeof resolvedBody === 'string' && resolvedBody.trim().startsWith('{')) {
                try {
                  resolvedBody = JSON.parse(resolvedBody);
                } catch {
                  // If parsing fails, keep as string
                }
              }
              
              const resolvedQueryParams = (request.queryParams || []).map((param: any) => ({
                ...param,
                value: variableResolver.variableResolver.resolve(param.value, variableContext)
              }));

              // Build URL with query params if needed
              let finalUrl = resolvedUrl;
              if (resolvedQueryParams.length > 0) {
                const urlObj = new URL(resolvedUrl);
                resolvedQueryParams.forEach((param: any) => {
                  if (param.enabled) {
                    urlObj.searchParams.append(param.key, param.value);
                  }
                });
                finalUrl = urlObj.toString();
              }

              let result: any;
              switch (request.method) {
                case 'GET':
                  result = await apiService.apiService.getJson(finalUrl, resolvedHeaders);
                  break;
                case 'POST':
                  result = await apiService.apiService.postJson(finalUrl, resolvedBody, resolvedHeaders);
                  break;
                case 'PUT':
                  result = await apiService.apiService.putJson(finalUrl, resolvedBody, resolvedHeaders);
                  break;
                case 'PATCH':
                  result = await apiService.apiService.patchJson(finalUrl, resolvedBody, resolvedHeaders);
                  break;
                case 'DELETE':
                  result = await apiService.apiService.deleteJson(finalUrl, resolvedHeaders);
                  break;
                case 'HEAD':
                  result = await apiService.apiService.headJson(finalUrl, resolvedHeaders);
                  break;
                case 'OPTIONS':
                  result = await apiService.apiService.optionsJson(finalUrl, resolvedHeaders);
                  break;
                default:
                  throw new Error(`Unsupported HTTP method: ${request.method}`);
              }

              db.addRequestHistory({
                method: request.method,
                url: finalUrl,
                status: result.status,
                response_time: result.responseTime,
                response_body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body),
                headers: JSON.stringify(resolvedHeaders),
                createdAt: new Date().toISOString(),
              });

              results.push({
                requestId: request.id!,
                requestName: request.name,
                success: true,
                status: result.status,
                responseTime: result.responseTime
              });
            } catch (error: any) {
              results.push({
                requestId: request.id!,
                requestName: request.name,
                success: false,
                error: error.message
              });
            }
          }

          return {
            success: true,
            results,
            summary: {
              total: sortedRequests.length,
              passed: results.filter((r: any) => r.success && r.status && r.status < 400).length,
              failed: results.filter((r: any) => !r.success || (r.status && r.status >= 400)).length
            }
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },
    request: {
      list: async (collectionId?: number, folderId?: number) => {
        const database = db.getDatabase();
        const filteredRequests = database.requests.filter((r: any) => {
          if (folderId) {
            return r.folderId === folderId;
          }
          if (collectionId) {
            return r.collectionId === collectionId && !r.folderId;
          }
          return true;
        });
        return filteredRequests.sort((a: any, b: any) => {
          const orderA = a.order || 0;
          const orderB = b.order || 0;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return (a.id || 0) - (b.id || 0);
        });
      },
      save: async (request: any) => {
        if (request.id) {
          db.updateRequest(request.id, {
            name: request.name,
            method: request.method,
            url: request.url,
            headers: request.headers || {},
            body: request.body || null,
            queryParams: request.queryParams || [],
            auth: request.auth || null,
            collectionId: request.collectionId,
            folderId: request.folderId || null,
            isFavorite: request.isFavorite ? 1 : 0,
            order: request.order,
          });
          return { success: true, id: request.id };
        } else {
          const id = db.addRequest({
            name: request.name,
            method: request.method,
            url: request.url,
            headers: request.headers || {},
            body: request.body || null,
            queryParams: request.queryParams || [],
            auth: request.auth || null,
            collectionId: request.collectionId,
            folderId: request.folderId || null,
            isFavorite: request.isFavorite ? 1 : 0,
            order: request.order,
          });
          return { success: true, id };
        }
      },
      delete: async (id: number) => {
        db.deleteRequest(id);
        return { success: true };
      },
      send: async (options: any) => {
        try {
          const database = db.getDatabase();
          let globalEnv;
          if (options.environmentId) {
            globalEnv = database.environments.find((e: any) => e.id === options.environmentId);
          }
          if (!globalEnv) {
            globalEnv = database.environments.find((e: any) => e.isDefault === 1) || database.environments[0];
          }
          if (!globalEnv) {
            throw new Error('No environment selected');
          }

          let collectionVariables: Record<string, string> = {};
          if (options.collectionId) {
            const collection = database.collections.find((c: any) => c.id === options.collectionId);
            if (collection && collection.environments && collection.environments.length > 0) {
              let activeEnv;
              if (collection.activeEnvironmentId) {
                activeEnv = collection.environments.find((e: any) => e.id === collection.activeEnvironmentId);
              }
              if (!activeEnv) {
                activeEnv = collection.environments[0];
              }
              if (activeEnv) {
                collectionVariables = activeEnv.variables || {};
              }
            }
          }

          const variableContext = {
            globalVariables: globalEnv.variables || {},
            collectionVariables
          };

          const resolvedUrl = variableResolver.variableResolver.resolve(options.url, variableContext);
          const resolvedHeaders = variableResolver.variableResolver.resolveObject(options.headers || {}, variableContext);
          let resolvedBody = typeof options.body === 'string' 
            ? variableResolver.variableResolver.resolve(options.body, variableContext)
            : options.body;
          
          // Parse JSON string body if it's a string (postJson expects object)
          if (typeof resolvedBody === 'string' && resolvedBody.trim().startsWith('{')) {
            try {
              resolvedBody = JSON.parse(resolvedBody);
            } catch {
              // If parsing fails, keep as string
            }
          }
          
          const resolvedQueryParams = (options.queryParams || []).map((param: any) => ({
            ...param,
            value: variableResolver.variableResolver.resolve(param.value, variableContext)
          }));

          // Build URL with query params if needed
          let finalUrl = resolvedUrl;
          if (resolvedQueryParams.length > 0) {
            const urlObj = new URL(resolvedUrl);
            resolvedQueryParams.forEach((param: any) => {
              if (param.enabled) {
                urlObj.searchParams.append(param.key, param.value);
              }
            });
            finalUrl = urlObj.toString();
          }

          let result: any;
          const method = options.method || 'GET';
          
          switch (method) {
            case 'GET':
              result = await apiService.apiService.getJson(finalUrl, resolvedHeaders);
              break;
            case 'POST':
              result = await apiService.apiService.postJson(finalUrl, resolvedBody, resolvedHeaders);
              break;
            case 'PUT':
              result = await apiService.apiService.putJson(finalUrl, resolvedBody, resolvedHeaders);
              break;
            case 'PATCH':
              result = await apiService.apiService.patchJson(finalUrl, resolvedBody, resolvedHeaders);
              break;
            case 'DELETE':
              result = await apiService.apiService.deleteJson(finalUrl, resolvedHeaders);
              break;
            case 'HEAD':
              result = await apiService.apiService.headJson(finalUrl, resolvedHeaders);
              break;
            case 'OPTIONS':
              result = await apiService.apiService.optionsJson(finalUrl, resolvedHeaders);
              break;
            default:
              throw new Error(`Unsupported HTTP method: ${method}`);
          }

          db.addRequestHistory({
            method: method,
            url: finalUrl,
            status: result.status,
            response_time: result.responseTime,
            response_body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body),
            headers: JSON.stringify(resolvedHeaders),
            createdAt: new Date().toISOString(),
          });

          return { 
            success: true, 
            data: result.body, 
            responseTime: result.responseTime,
            status: result.status,
            statusText: result.statusText,
            headers: result.headers
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
      history: async (limit = 100) => {
        const database = db.getDatabase();
        return database.request_history
          .sort((a: any, b: any) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return bTime - aTime;
          })
          .slice(0, limit);
      },
      deleteHistory: async (id: number) => {
        db.deleteRequestHistory(id);
        return { success: true };
      },
    },
    folder: {
      list: async (collectionId?: number) => {
        const database = db.getDatabase();
        return database.folders.filter((f: any) => !collectionId || f.collectionId === collectionId);
      },
      save: async (folder: any) => {
        if (folder.id) {
          db.updateFolder(folder.id, {
            name: folder.name,
            description: folder.description,
            collectionId: folder.collectionId,
          });
          return { success: true, id: folder.id };
        } else {
          const id = db.addFolder({
            name: folder.name,
            description: folder.description,
            collectionId: folder.collectionId,
          });
          return { success: true, id };
        }
      },
      delete: async (id: number) => {
        db.deleteFolder(id);
        return { success: true };
      },
    },
    settings: {
      get: async (key: string) => {
        return db.getSetting(key);
      },
      set: async (key: string, value: any) => {
        db.setSetting(key, value);
        return { success: true };
      },
      getAll: async () => {
        return db.getAllSettings();
      },
    },
  };
}

/**
 * Mock electronAPI for testing IPC handlers
 * This allows us to test IPC communication without actually running Electron
 */
async function setupMockElectronAPI(page: Page, testDbPath: string) {
  const handlers = await createIPCHandlers(testDbPath);
  
  // Expose handler functions to the page context
  // We need to expose each function individually since functions can't be serialized
  await page.exposeFunction('electronAPI_env_list', handlers.env.list);
  await page.exposeFunction('electronAPI_env_save', handlers.env.save);
  await page.exposeFunction('electronAPI_env_delete', handlers.env.delete);
  await page.exposeFunction('electronAPI_env_getCurrent', handlers.env.getCurrent);
  await page.exposeFunction('electronAPI_env_setCurrent', handlers.env.setCurrent);
  
  await page.exposeFunction('electronAPI_collection_list', handlers.collection.list);
  await page.exposeFunction('electronAPI_collection_save', handlers.collection.save);
  await page.exposeFunction('electronAPI_collection_delete', handlers.collection.delete);
  await page.exposeFunction('electronAPI_collection_toggleFavorite', handlers.collection.toggleFavorite);
  await page.exposeFunction('electronAPI_collection_setActiveEnvironment', handlers.collection.setActiveEnvironment);
  await page.exposeFunction('electronAPI_collection_run', handlers.collection.run);
  
  await page.exposeFunction('electronAPI_request_list', handlers.request.list);
  await page.exposeFunction('electronAPI_request_save', handlers.request.save);
  await page.exposeFunction('electronAPI_request_delete', handlers.request.delete);
  await page.exposeFunction('electronAPI_request_send', handlers.request.send);
  await page.exposeFunction('electronAPI_request_history', handlers.request.history);
  await page.exposeFunction('electronAPI_request_deleteHistory', handlers.request.deleteHistory);
  
  await page.exposeFunction('electronAPI_folder_list', handlers.folder.list);
  await page.exposeFunction('electronAPI_folder_save', handlers.folder.save);
  await page.exposeFunction('electronAPI_folder_delete', handlers.folder.delete);
  
  await page.exposeFunction('electronAPI_settings_get', handlers.settings.get);
  await page.exposeFunction('electronAPI_settings_set', handlers.settings.set);
  await page.exposeFunction('electronAPI_settings_getAll', handlers.settings.getAll);
  
  // Create the electronAPI object in the page context
  await page.addInitScript(() => {
    (window as any).electronAPI = {
      env: {
        list: () => (window as any).electronAPI_env_list(),
        save: (env: any) => (window as any).electronAPI_env_save(env),
        delete: (id: number) => (window as any).electronAPI_env_delete(id),
        getCurrent: () => (window as any).electronAPI_env_getCurrent(),
        setCurrent: (id: number) => (window as any).electronAPI_env_setCurrent(id),
      },
      collection: {
        list: () => (window as any).electronAPI_collection_list(),
        save: (collection: any) => (window as any).electronAPI_collection_save(collection),
        delete: (id: number) => (window as any).electronAPI_collection_delete(id),
        toggleFavorite: (id: number) => (window as any).electronAPI_collection_toggleFavorite(id),
        setActiveEnvironment: (collectionId: number, environmentId: number | null) => 
          (window as any).electronAPI_collection_setActiveEnvironment(collectionId, environmentId),
        run: (collectionId: number) => (window as any).electronAPI_collection_run(collectionId),
      },
      request: {
        list: (collectionId?: number, folderId?: number) => 
          (window as any).electronAPI_request_list(collectionId, folderId),
        save: (request: any) => (window as any).electronAPI_request_save(request),
        delete: (id: number) => (window as any).electronAPI_request_delete(id),
        send: (options: any) => (window as any).electronAPI_request_send(options),
        history: (limit?: number) => (window as any).electronAPI_request_history(limit),
        deleteHistory: (id: number) => (window as any).electronAPI_request_deleteHistory(id),
      },
      folder: {
        list: (collectionId?: number) => (window as any).electronAPI_folder_list(collectionId),
        save: (folder: any) => (window as any).electronAPI_folder_save(folder),
        delete: (id: number) => (window as any).electronAPI_folder_delete(id),
      },
      settings: {
        get: (key: string) => (window as any).electronAPI_settings_get(key),
        set: (key: string, value: any) => (window as any).electronAPI_settings_set(key, value),
        getAll: () => (window as any).electronAPI_settings_getAll(),
      },
    };
  });
}

/**
 * Electron fixtures for Playwright
 * 
 * Note: We mock electronAPI for testing since Playwright doesn't run Electron.
 * The mock calls IPC handlers directly to test IPC communication.
 */
export const test = base.extend<ElectronFixtures>({
  testDbPath: async ({}, use, testInfo) => {
    // Create isolated test database for each test
    const testDbPath = createTestDatabase({
      testName: testInfo.title.replace(/\s+/g, '-').toLowerCase(),
    });
    
    await use(testDbPath);
    
    // Cleanup after test
    cleanTestDatabase(testDbPath);
  },

  electronPage: async ({ page, testDbPath }, use) => {
    // Setup mock electronAPI before navigating
    await setupMockElectronAPI(page, testDbPath);
    
    // Navigate to app
    const appUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    await page.goto(appUrl);
    await page.waitForLoadState('networkidle');
    
    // Verify electronAPI is available
    const hasAPI = await page.evaluate(() => {
      return typeof (window as any).electronAPI !== 'undefined';
    });
    
    if (!hasAPI) {
      throw new Error('electronAPI not available after setup');
    }

    await use(page);
  },
});

export { expect } from '@playwright/test';

