import { test as base, Page } from '@playwright/test';
import { createTestDatabase, cleanTestDatabase } from './test-db';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { getDatabaseContents } from './test-db';
import * as fs from 'fs';
import * as db from '../../electron/database/json-db';
import { apiService } from '../../electron/services/api';
import * as variableResolver from '../../electron/services/variable-resolver';
import { parseCurlCommand, parseCurlCommands } from '../../electron/lib/curl-parser';
import { generateCurlCommand } from '../../electron/lib/curl-generator';

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
      test: async (env: any) => {
        try {
          const baseUrl = env.variables?.base_url || env.baseUrl;
          if (baseUrl) {
            const isReachable = await apiService.testConnection(baseUrl);
            return { success: isReachable, message: isReachable ? 'Connection successful' : 'Connection failed' };
          }
          return { success: true, message: 'No base URL to test' };
        } catch (error: any) {
          return { success: false, message: error.message };
        }
      },
      import: async (filePath: string) => {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');
          const envData: any = {};
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const [key, ...valueParts] = trimmed.split('=');
              envData[key.trim()] = valueParts.join('=').trim();
            }
          }
          return {
            success: true,
            data: {
              name: envData.ENV || 'imported',
              displayName: envData.ENV || 'Imported Environment',
              variables: envData,
            },
          };
        } catch (error: any) {
          return { success: false, message: error.message };
        }
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
      addEnvironment: async (collectionId: number, environment: any) => {
        const database = db.getDatabase();
        const collection = database.collections.find((c: any) => c.id === collectionId);
        if (!collection) {
          throw new Error('Collection not found');
        }
        if (!collection.environments) {
          collection.environments = [];
        }
        const envId = db.generateUniqueId();
        collection.environments.push({
          id: envId,
          name: environment.name,
          variables: environment.variables || {},
        });
        if (collection.environments.length === 1) {
          collection.activeEnvironmentId = envId;
        }
        db.saveDatabase();
        const updatedCollection = database.collections.find((c: any) => c.id === collectionId);
        return { success: true, id: envId, collection: updatedCollection };
      },
      updateEnvironment: async (collectionId: number, environmentId: number, updates: any) => {
        const database = db.getDatabase();
        const collection = database.collections.find((c: any) => c.id === collectionId);
        if (!collection || !collection.environments) {
          throw new Error('Collection or environment not found');
        }
        const env = collection.environments.find((e: any) => e.id === environmentId);
        if (!env) {
          throw new Error('Environment not found');
        }
        Object.assign(env, updates);
        db.saveDatabase();
        const updatedCollection = database.collections.find((c: any) => c.id === collectionId);
        return { success: true, collection: updatedCollection };
      },
      deleteEnvironment: async (collectionId: number, environmentId: number) => {
        const database = db.getDatabase();
        const collection = database.collections.find((c: any) => c.id === collectionId);
        if (!collection || !collection.environments) {
          throw new Error('Collection or environment not found');
        }
        collection.environments = collection.environments.filter((e: any) => e.id !== environmentId);
        if (collection.activeEnvironmentId === environmentId) {
          collection.activeEnvironmentId = collection.environments.length > 0 
            ? collection.environments[0].id 
            : undefined;
        }
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
                  result = await apiService.getJson(finalUrl, resolvedHeaders);
                  break;
                case 'POST':
                  result = await apiService.postJson(finalUrl, resolvedBody, resolvedHeaders);
                  break;
                case 'PUT':
                  result = await apiService.putJson(finalUrl, resolvedBody, resolvedHeaders);
                  break;
                case 'PATCH':
                  result = await apiService.patchJson(finalUrl, resolvedBody, resolvedHeaders);
                  break;
                case 'DELETE':
                  result = await apiService.deleteJson(finalUrl, resolvedHeaders);
                  break;
                case 'HEAD':
                  result = await apiService.headJson(finalUrl, resolvedHeaders);
                  break;
                case 'OPTIONS':
                  result = await apiService.optionsJson(finalUrl, resolvedHeaders);
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
      saveAfter: async (request: any, afterRequestId: number) => {
        const id = db.addRequestAfter({
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
        }, afterRequestId);
        return { success: true, id };
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
              result = await apiService.getJson(finalUrl, resolvedHeaders);
              break;
            case 'POST':
              result = await apiService.postJson(finalUrl, resolvedBody, resolvedHeaders);
              break;
            case 'PUT':
              result = await apiService.putJson(finalUrl, resolvedBody, resolvedHeaders);
              break;
            case 'PATCH':
              result = await apiService.patchJson(finalUrl, resolvedBody, resolvedHeaders);
              break;
            case 'DELETE':
              result = await apiService.deleteJson(finalUrl, resolvedHeaders);
              break;
            case 'HEAD':
              result = await apiService.headJson(finalUrl, resolvedHeaders);
              break;
            case 'OPTIONS':
              result = await apiService.optionsJson(finalUrl, resolvedHeaders);
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
      reset: async () => {
        db.resetSettings();
        return { success: true };
      },
    },
    unsavedRequest: {
      save: async (request: any) => {
        try {
          if (request.id) {
            db.updateUnsavedRequest(request.id, {
              name: request.name,
              method: request.method,
              url: request.url,
              headers: request.headers || {},
              body: request.body || '',
              queryParams: request.queryParams || [],
              auth: request.auth || null,
            });
            return { success: true, id: request.id };
          } else {
            const id = db.addUnsavedRequest({
              name: request.name,
              method: request.method,
              url: request.url,
              headers: request.headers || {},
              body: request.body || '',
              queryParams: request.queryParams || [],
              auth: request.auth || null,
              lastModified: new Date().toISOString(),
            });
            return { success: true, id };
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
      getAll: async () => {
        try {
          return db.getAllUnsavedRequests();
        } catch (error: any) {
          return [];
        }
      },
      delete: async (id: number) => {
        try {
          db.deleteUnsavedRequest(id);
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
      clear: async () => {
        try {
          db.clearUnsavedRequests();
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
      promote: async (id: number, data: any) => {
        try {
          const savedId = db.promoteUnsavedRequest(id, data);
          return { success: true, id: savedId };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },
    preset: {
      list: async (requestId?: number) => {
        try {
          return db.getAllPresets(requestId);
        } catch (error: any) {
          return [];
        }
      },
      save: async (preset: any) => {
        try {
          const id = db.addPreset(preset);
          return { success: true, id };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
      delete: async (id: number) => {
        try {
          db.deletePreset(id);
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },
    curl: {
      parse: async (command: string) => {
        try {
          const request = parseCurlCommand(command);
          return { success: true, request };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
      generate: async (request: any) => {
        try {
          const curlCommand = generateCurlCommand(request);
          return { success: true, command: curlCommand };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
      importBulk: async (commands: string[]) => {
        try {
          const results = parseCurlCommands(commands);
          return { success: true, results };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },
    file: {
      select: async (filters?: any) => {
        // Mock file dialog - return null (cancelled) for tests
        return null;
      },
      selectDirectory: async () => {
        // Mock directory dialog - return null (cancelled) for tests
        return null;
      },
      save: async (defaultPath: string, content: string) => {
        // Mock save dialog - return success: false for tests
        return { success: false };
      },
      read: async (filePath: string) => {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          return { success: true, content };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
      write: async (filePath: string, content: string) => {
        try {
          fs.writeFileSync(filePath, content, 'utf-8');
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    },
    app: {
      getVersion: async () => {
        return '1.0.0';
      },
      getPath: async (name: string) => {
        return '/mock/path';
      },
    },
    window: {
      minimize: async () => {
        // Mock - no-op for tests
      },
      maximize: async () => {
        // Mock - no-op for tests
      },
      close: async () => {
        // Mock - no-op for tests
      },
      isMaximized: async () => {
        return false;
      },
    },
    notification: {
      show: async (options: any) => {
        // Mock notification - return success for tests
        return { success: true };
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
  await page.exposeFunction('electronAPI_env_test', handlers.env.test);
  await page.exposeFunction('electronAPI_env_import', handlers.env.import);
  
  await page.exposeFunction('electronAPI_collection_list', handlers.collection.list);
  await page.exposeFunction('electronAPI_collection_save', handlers.collection.save);
  await page.exposeFunction('electronAPI_collection_delete', handlers.collection.delete);
  await page.exposeFunction('electronAPI_collection_toggleFavorite', handlers.collection.toggleFavorite);
  await page.exposeFunction('electronAPI_collection_setActiveEnvironment', handlers.collection.setActiveEnvironment);
  await page.exposeFunction('electronAPI_collection_addEnvironment', handlers.collection.addEnvironment);
  await page.exposeFunction('electronAPI_collection_updateEnvironment', handlers.collection.updateEnvironment);
  await page.exposeFunction('electronAPI_collection_deleteEnvironment', handlers.collection.deleteEnvironment);
  await page.exposeFunction('electronAPI_collection_run', handlers.collection.run);
  
  await page.exposeFunction('electronAPI_request_list', handlers.request.list);
  await page.exposeFunction('electronAPI_request_save', handlers.request.save);
  await page.exposeFunction('electronAPI_request_saveAfter', handlers.request.saveAfter);
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
  await page.exposeFunction('electronAPI_settings_reset', handlers.settings.reset);
  
  await page.exposeFunction('electronAPI_unsavedRequest_save', handlers.unsavedRequest.save);
  await page.exposeFunction('electronAPI_unsavedRequest_getAll', handlers.unsavedRequest.getAll);
  await page.exposeFunction('electronAPI_unsavedRequest_delete', handlers.unsavedRequest.delete);
  await page.exposeFunction('electronAPI_unsavedRequest_clear', handlers.unsavedRequest.clear);
  await page.exposeFunction('electronAPI_unsavedRequest_promote', handlers.unsavedRequest.promote);
  
  await page.exposeFunction('electronAPI_preset_list', handlers.preset.list);
  await page.exposeFunction('electronAPI_preset_save', handlers.preset.save);
  await page.exposeFunction('electronAPI_preset_delete', handlers.preset.delete);
  
  await page.exposeFunction('electronAPI_curl_parse', handlers.curl.parse);
  await page.exposeFunction('electronAPI_curl_generate', handlers.curl.generate);
  await page.exposeFunction('electronAPI_curl_importBulk', handlers.curl.importBulk);
  
  await page.exposeFunction('electronAPI_file_select', handlers.file.select);
  await page.exposeFunction('electronAPI_file_selectDirectory', handlers.file.selectDirectory);
  await page.exposeFunction('electronAPI_file_save', handlers.file.save);
  await page.exposeFunction('electronAPI_file_read', handlers.file.read);
  await page.exposeFunction('electronAPI_file_write', handlers.file.write);
  
  await page.exposeFunction('electronAPI_app_getVersion', handlers.app.getVersion);
  await page.exposeFunction('electronAPI_app_getPath', handlers.app.getPath);
  
  await page.exposeFunction('electronAPI_window_minimize', handlers.window.minimize);
  await page.exposeFunction('electronAPI_window_maximize', handlers.window.maximize);
  await page.exposeFunction('electronAPI_window_close', handlers.window.close);
  await page.exposeFunction('electronAPI_window_isMaximized', handlers.window.isMaximized);
  
  await page.exposeFunction('electronAPI_notification_show', handlers.notification.show);
  
  // Create the electronAPI object in the page context
  await page.addInitScript(() => {
    // Simple in-page event subscriptions to simulate IPC push updates
    const collectionUpdatedListeners: Array<() => void> = [];
    const requestUpdatedListeners: Array<() => void> = [];
    const folderUpdatedListeners: Array<() => void> = [];

    (window as any).electronAPI = {
      env: {
        list: () => (window as any).electronAPI_env_list(),
        save: (env: any) => (window as any).electronAPI_env_save(env),
        delete: (id: number) => (window as any).electronAPI_env_delete(id),
        getCurrent: () => (window as any).electronAPI_env_getCurrent(),
        setCurrent: (id: number) => (window as any).electronAPI_env_setCurrent(id),
        test: (env: any) => (window as any).electronAPI_env_test(env),
        import: (filePath: string) => (window as any).electronAPI_env_import(filePath),
      },
      collection: {
        list: () => (window as any).electronAPI_collection_list(),
        save: async (collection: any) => {
          const result = await (window as any).electronAPI_collection_save(collection);
          collectionUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        delete: async (id: number) => {
          const result = await (window as any).electronAPI_collection_delete(id);
          collectionUpdatedListeners.forEach((cb) => cb());
          folderUpdatedListeners.forEach((cb) => cb());
          requestUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        toggleFavorite: async (id: number) => {
          const result = await (window as any).electronAPI_collection_toggleFavorite(id);
          collectionUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        setActiveEnvironment: (collectionId: number, environmentId: number | null) => 
          (window as any).electronAPI_collection_setActiveEnvironment(collectionId, environmentId),
        addEnvironment: async (collectionId: number, environment: any) => {
          const result = await (window as any).electronAPI_collection_addEnvironment(collectionId, environment);
          collectionUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        updateEnvironment: async (collectionId: number, environmentId: number, updates: any) => {
          const result = await (window as any).electronAPI_collection_updateEnvironment(
            collectionId,
            environmentId,
            updates
          );
          collectionUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        deleteEnvironment: async (collectionId: number, environmentId: number) => {
          const result = await (window as any).electronAPI_collection_deleteEnvironment(collectionId, environmentId);
          collectionUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        run: (collectionId: number) => (window as any).electronAPI_collection_run(collectionId),
        onUpdated: (callback: () => void) => {
          collectionUpdatedListeners.push(callback);
          return () => {
            const index = collectionUpdatedListeners.indexOf(callback);
            if (index >= 0) {
              collectionUpdatedListeners.splice(index, 1);
            }
          };
        },
      },
      request: {
        list: (collectionId?: number, folderId?: number) => 
          (window as any).electronAPI_request_list(collectionId, folderId),
        save: async (request: any) => {
          const result = await (window as any).electronAPI_request_save(request);
          requestUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        saveAfter: async (request: any, afterRequestId: number) => {
          const result = await (window as any).electronAPI_request_saveAfter(request, afterRequestId);
          requestUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        delete: async (id: number) => {
          const result = await (window as any).electronAPI_request_delete(id);
          requestUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        send: (options: any) => (window as any).electronAPI_request_send(options),
        history: (limit?: number) => (window as any).electronAPI_request_history(limit),
        deleteHistory: (id: number) => (window as any).electronAPI_request_deleteHistory(id),
        onUpdated: (callback: () => void) => {
          requestUpdatedListeners.push(callback);
          return () => {
            const index = requestUpdatedListeners.indexOf(callback);
            if (index >= 0) {
              requestUpdatedListeners.splice(index, 1);
            }
          };
        },
      },
      folder: {
        list: (collectionId?: number) => (window as any).electronAPI_folder_list(collectionId),
        save: async (folder: any) => {
          const result = await (window as any).electronAPI_folder_save(folder);
          folderUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        delete: async (id: number) => {
          const result = await (window as any).electronAPI_folder_delete(id);
          folderUpdatedListeners.forEach((cb) => cb());
          return result;
        },
        onUpdated: (callback: () => void) => {
          folderUpdatedListeners.push(callback);
          return () => {
            const index = folderUpdatedListeners.indexOf(callback);
            if (index >= 0) {
              folderUpdatedListeners.splice(index, 1);
            }
          };
        },
      },
      settings: {
        get: (key: string) => (window as any).electronAPI_settings_get(key),
        set: (key: string, value: any) => (window as any).electronAPI_settings_set(key, value),
        getAll: () => (window as any).electronAPI_settings_getAll(),
        reset: () => (window as any).electronAPI_settings_reset(),
      },
      unsavedRequest: {
        save: (request: any) => (window as any).electronAPI_unsavedRequest_save(request),
        getAll: () => (window as any).electronAPI_unsavedRequest_getAll(),
        delete: (id: number) => (window as any).electronAPI_unsavedRequest_delete(id),
        clear: () => (window as any).electronAPI_unsavedRequest_clear(),
        promote: (id: number, data: any) => (window as any).electronAPI_unsavedRequest_promote(id, data),
      },
      preset: {
        list: (requestId?: number) => (window as any).electronAPI_preset_list(requestId),
        save: (preset: any) => (window as any).electronAPI_preset_save(preset),
        delete: (id: number) => (window as any).electronAPI_preset_delete(id),
      },
      curl: {
        parse: (command: string) => (window as any).electronAPI_curl_parse(command),
        generate: (request: any) => (window as any).electronAPI_curl_generate(request),
        importBulk: (commands: string[]) => (window as any).electronAPI_curl_importBulk(commands),
      },
      file: {
        select: (filters?: any) => (window as any).electronAPI_file_select(filters),
        selectDirectory: () => (window as any).electronAPI_file_selectDirectory(),
        save: (defaultPath: string, content: string) => (window as any).electronAPI_file_save(defaultPath, content),
        read: (filePath: string) => (window as any).electronAPI_file_read(filePath),
        write: (filePath: string, content: string) => (window as any).electronAPI_file_write(filePath, content),
      },
      app: {
        getVersion: () => (window as any).electronAPI_app_getVersion(),
        getPath: (name: string) => (window as any).electronAPI_app_getPath(name),
      },
      window: {
        minimize: () => (window as any).electronAPI_window_minimize(),
        maximize: () => (window as any).electronAPI_window_maximize(),
        close: () => (window as any).electronAPI_window_close(),
        isMaximized: () => (window as any).electronAPI_window_isMaximized(),
      },
      notification: {
        show: (options: any) => (window as any).electronAPI_notification_show(options),
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
  testDbPath: async (_fixtures, use, testInfo) => {
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

