import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import {
    addCollection,
    addEnvironment,
    addFolder,
    addFolderAfter,
    addPreset,
    addRequest,
    addRequestAfter,
    addRequestHistory,
    addUnsavedRequest,
    clearAllRequestHistory,
    clearUnsavedRequests,
    deleteCollection,
    deleteEnvironment,
    deleteFolder,
    deletePreset,
    deleteRequest,
    deleteRequestHistory,
    deleteUnsavedRequest,
    generateUniqueId,
    getAllPresets,
    getAllSettings,
    getAllUnsavedRequests,
    getDatabase,
    getSetting,
    promoteUnsavedRequest,
    reorderFolder,
    reorderRequest,
    resetSettings,
    saveDatabase,
    setSetting,
    updateCollection,
    updateEnvironment,
    updateFolder,
    updateRequest,
    updateUnsavedRequest,
} from '../database';
import { generateCurlCommand } from '../lib/curl-generator';
import { parseCurlCommand, parseCurlCommands } from '../lib/curl-parser';
import {
    EnvironmentExportGenerator,
    getEnvironmentImportFactory,
} from '../lib/environment';
import type { ImportOptions, ImportResult } from '../lib/import';
import { getImportFactory } from '../lib/import';
import { apiService } from '../services/api';
import { createLogger } from '../services/logger';
import { variableResolver } from '../services/variable-resolver';

const logger = createLogger('ipc-handlers');

const broadcast = (channel: string, payload?: any) => {
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send(channel, payload);
  });
};

export function registerIpcHandlers() {
  // Environment operations
  ipcMain.handle('env:list', async () => {
    const db = getDatabase();
    return JSON.parse(JSON.stringify(db.environments.sort((a, b) => {
      const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return bTime - aTime;
    })));
  });

  ipcMain.handle('env:save', async (_, env) => {
    if (!env) throw new Error('Environment data is required');
    if (env.id) {
      await updateEnvironment(env.id, {
        name: env.name,
        displayName: env.displayName,
        variables: env.variables || {},
        isDefault: env.isDefault ? 1 : 0,
      });
      return { success: true, id: env.id };
    } else {
      const id = await addEnvironment({
        name: env.name,
        displayName: env.displayName,
        variables: env.variables || {},
        isDefault: env.isDefault ? 1 : 0,
      });
      return { success: true, id };
    }
  });

  ipcMain.handle('env:delete', async (_, id) => {
    if (id === undefined || id === null) throw new Error('ID is required');
    await deleteEnvironment(id);
    return { success: true };
  });

  ipcMain.handle('env:test', async (_, env) => {
    try {
      // Test connection to base URL if provided
      const baseUrl = env.variables?.base_url || env.baseUrl;
      if (baseUrl) {
        const isReachable = await apiService.testConnection(baseUrl);
        return {
          success: isReachable,
          message: isReachable ? 'Connection successful' : 'Connection failed',
        };
      }
      return { success: true, message: 'No base URL to test' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  // Enhanced environment import handler
  ipcMain.handle(
    'env:import',
    async (
      _,
      content: string,
      format?: 'json' | 'env' | 'postman' | 'auto'
    ) => {
      const memBefore = process.memoryUsage().heapUsed;
      const startTime = Date.now();

      try {
        const factory = getEnvironmentImportFactory();
        const parsedEnvironments = await factory.parse(
          content,
          format || 'auto'
        );

        // Validate parsed environments
        const validationResults = parsedEnvironments.map(env => {
          const strategy = factory.getStrategy(env.name || 'json');
          return (
            strategy?.validate([env]) || {
              isValid: true,
              errors: [],
              warnings: [],
            }
          );
        });

        const allErrors: string[] = [];
        const allWarnings: string[] = [];

        validationResults.forEach(result => {
          allErrors.push(...result.errors);
          allWarnings.push(...result.warnings);
        });

        // Detect conflicts with existing environments
        const db = getDatabase();
        const conflicts = parsedEnvironments
          .map(env => {
            const existing = db.environments.find(e => e.name === env.name);
            if (existing) {
              return {
                environmentName: env.name,
                existingId: existing.id!,
                importedEnvironment: env,
              };
            }
            return null;
          })
          .filter((c): c is NonNullable<typeof c> => c !== null);

        const memAfter = process.memoryUsage().heapUsed;
        const loadTime = Date.now() - startTime;

        logger.info('Environment import', {
          delta: (memAfter - memBefore) / 1024 / 1024,
          format: format || 'auto',
          count: parsedEnvironments.length,
          loadTime,
        });

        return {
          success: true,
          environments: parsedEnvironments,
          warnings: allWarnings,
          errors: allErrors,
          conflicts,
        };
      } catch (error: any) {
        logger.error('Environment import failed', { error: error.message });
        return {
          success: false,
          environments: [],
          warnings: [],
          errors: [error.message || 'Failed to import environments'],
          conflicts: [],
        };
      }
    }
  );

  // Environment export handler
  ipcMain.handle(
    'env:export',
    async (_, environmentIds: number[], format: 'json' | 'env' | 'postman') => {
      try {
        const db = getDatabase();
        let environmentsToExport;

        if (environmentIds.length === 0) {
          // Export all environments
          environmentsToExport = db.environments;
        } else {
          // Export selected environments
          environmentsToExport = db.environments.filter(env =>
            environmentIds.includes(env.id!)
          );
        }

        if (environmentsToExport.length === 0) {
          return {
            success: false,
            content: '',
            filename: '',
            error: 'No environments to export',
          };
        }

        const generator = new EnvironmentExportGenerator();
        const content = generator.generate({
          format,
          environments: environmentsToExport,
        });
        const filename = generator.generateFilename(
          format,
          environmentsToExport.length
        );

        return {
          success: true,
          content,
          filename,
        };
      } catch (error: any) {
        logger.error('Environment export failed', { error: error.message });
        return {
          success: false,
          content: '',
          filename: '',
          error: error.message || 'Failed to export environments',
        };
      }
    }
  );

  // Format detection handler
  ipcMain.handle('env:detect-format', async (_, content: string) => {
    if (!content) return { format: 'unknown', isValid: false, confidence: 0 };
    try {
      const factory = getEnvironmentImportFactory();
      const detection = factory.detectFormat(content);
      return detection;
    } catch (error: any) {
      logger.error('Format detection failed', { error: error.message });
      return {
        format: 'unknown' as const,
        isValid: false,
        confidence: 0,
      };
    }
  });

  // Supported formats handler
  ipcMain.handle('env:supported-formats', async () => {
    try {
      const factory = getEnvironmentImportFactory();
      const formats = factory.getSupportedFormats();
      return { formats };
    } catch (error: any) {
      return { formats: [] };
    }
  });

  ipcMain.handle('env:getCurrent', async () => {
    const db = getDatabase();
    const defaultEnv = db.environments.find(e => e.isDefault === 1);
    if (!defaultEnv && db.environments.length > 0) {
      return db.environments[0];
    }
    return defaultEnv || null;
  });

  ipcMain.handle('env:setCurrent', async (_, id) => {
    const db = getDatabase();
    db.environments.forEach(env => {
      env.isDefault = env.id === id ? 1 : 0;
      if (env.id === id) {
        env.lastUsed = new Date().toISOString();
      }
    });
    await saveDatabase();
    return { success: true };
  });

  // Collection operations
  ipcMain.handle('collection:list', async () => {
    const db = getDatabase();
    return JSON.parse(JSON.stringify(db.collections.sort((a, b) => {
      const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return bTime - aTime;
    })));
  });

  ipcMain.handle('collection:save', async (_, collection) => {
    if (!collection) throw new Error('Collection data is required');
    if (collection.id) {
      await updateCollection(collection.id, {
        name: collection.name,
        description: collection.description,
        documentation: collection.documentation || '',
        environments: collection.environments || [],
        activeEnvironmentId: collection.activeEnvironmentId,
        isFavorite: collection.isFavorite ? 1 : 0,
      });
      broadcast('collections:updated');
      return { success: true, id: collection.id };
    } else {
      const id = await addCollection({
        name: collection.name,
        description: collection.description,
        documentation: collection.documentation || '',
        environments: collection.environments || [],
        activeEnvironmentId: collection.activeEnvironmentId,
        isFavorite: collection.isFavorite ? 1 : 0,
      });
      broadcast('collections:updated');
      return { success: true, id };
    }
  });

  ipcMain.handle('collection:delete', async (_, id) => {
    await deleteCollection(id);
    broadcast('collections:updated');
    broadcast('requests:updated');
    return { success: true };
  });

  ipcMain.handle('collection:toggleFavorite', async (_, id) => {
    const db = getDatabase();
    const collection = db.collections.find(c => c.id === id);
    if (collection) {
      collection.isFavorite = collection.isFavorite ? 0 : 1;
      await saveDatabase();
    }
    broadcast('collections:updated');
    return { success: true };
  });

  // Collection Environment operations
  ipcMain.handle(
    'collection:addEnvironment',
    async (_, collectionId, environment) => {
      const db = getDatabase();
      const collection = db.collections.find(c => c.id === collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      if (!collection.environments) {
        collection.environments = [];
      }

      const envId = generateUniqueId();
      collection.environments.push({
        id: envId,
        name: environment.name,
        variables: environment.variables || {},
      });

      // If this is the first environment, set it as active
      if (collection.environments.length === 1) {
        collection.activeEnvironmentId = envId;
      }

      await saveDatabase();
      const updatedCollection = db.collections.find(c => c.id === collectionId);
      broadcast('collections:updated');
      return { success: true, id: envId, collection: updatedCollection };
    }
  );

  ipcMain.handle(
    'collection:updateEnvironment',
    async (_, collectionId, environmentId, updates) => {
      const db = getDatabase();
      const collection = db.collections.find(c => c.id === collectionId);
      if (!collection || !collection.environments) {
        throw new Error('Collection or environment not found');
      }

      const env = collection.environments.find(e => e.id === environmentId);
      if (!env) {
        throw new Error('Environment not found');
      }

      Object.assign(env, updates);
      await saveDatabase();
      const updatedCollection = db.collections.find(c => c.id === collectionId);
      broadcast('collections:updated');
      return { success: true, collection: updatedCollection };
    }
  );

  ipcMain.handle(
    'collection:deleteEnvironment',
    async (_, collectionId, environmentId) => {
      const db = getDatabase();
      const collection = db.collections.find(c => c.id === collectionId);
      if (!collection || !collection.environments) {
        throw new Error('Collection or environment not found');
      }

      collection.environments = collection.environments.filter(
        e => e.id !== environmentId
      );

      // If we deleted the active environment, set first available as active
      if (collection.activeEnvironmentId === environmentId) {
        collection.activeEnvironmentId =
          collection.environments.length > 0
            ? collection.environments[0].id
            : undefined;
      }

      await saveDatabase();
      const updatedCollection = db.collections.find(c => c.id === collectionId);
      broadcast('collections:updated');
      return { success: true, collection: updatedCollection };
    }
  );

  ipcMain.handle(
    'collection:setActiveEnvironment',
    async (_, collectionId, environmentId) => {
      const db = getDatabase();
      const collection = db.collections.find(c => c.id === collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      if (environmentId !== null && environmentId !== undefined) {
        if (
          !collection.environments ||
          !collection.environments.find(e => e.id === environmentId)
        ) {
          throw new Error('Environment not found');
        }
      }

      collection.activeEnvironmentId = environmentId;
      await saveDatabase();
      const updatedCollection = db.collections.find(c => c.id === collectionId);
      broadcast('collections:updated');
      return { success: true, collection: updatedCollection };
    }
  );

  // Folder operations
  ipcMain.handle('folder:list', async (_, collectionId) => {
    const db = getDatabase();
    const filteredFolders = db.folders.filter(
      f => !collectionId || f.collectionId === collectionId
    );

    // Sort by order field, then by id as fallback
    return JSON.parse(JSON.stringify(filteredFolders.sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.id || 0) - (b.id || 0);
    })));
  });

  ipcMain.handle('folder:save', async (_, folder) => {
    if (folder.id) {
      updateFolder(folder.id, {
        name: folder.name,
        description: folder.description,
        collectionId: folder.collectionId,
        order: folder.order,
      });
      broadcast('folders:updated');
      return { success: true, id: folder.id };
    } else {
      const id = await addFolder({
        name: folder.name,
        description: folder.description,
        collectionId: folder.collectionId,
        order: folder.order,
      });
      broadcast('folders:updated');
      return { success: true, id };
    }
  });

  ipcMain.handle('folder:saveAfter', async (_, folder, afterFolderId) => {
    const id = await addFolderAfter(folder, afterFolderId);
    broadcast('folders:updated');
    return { success: true, id };
  });

  ipcMain.handle('folder:reorder', async (_, folderId, newOrder) => {
    await reorderFolder(folderId, newOrder);
    broadcast('folders:updated');
    return { success: true };
  });

  ipcMain.handle('folder:delete', async (_, id) => {
    await deleteFolder(id);
    broadcast('folders:updated');
    return { success: true };
  });

  // Request operations
  ipcMain.handle('request:list', async (_, collectionId, folderId) => {
    const db = getDatabase();
    const filteredRequests = db.requests.filter(r => {
      if (folderId) {
        return r.folderId === folderId;
      }
      if (collectionId) {
        return r.collectionId === collectionId && !r.folderId;
      }
      return true;
    });

    // Sort by order field, then by id as fallback
    return JSON.parse(JSON.stringify(filteredRequests.sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.id || 0) - (b.id || 0);
    })));
  });

  ipcMain.handle('request:get', async (_, id) => {
    const db = getDatabase();
    return db.requests.find(r => r.id === id) || null;
  });

  ipcMain.handle('request:save', async (_, request) => {
    if (!request) throw new Error('Request data is required');
    if (request.id) {
      updateRequest(request.id, {
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
        lastResponse: request.lastResponse || null,
      });
      broadcast('requests:updated');
      return { success: true, id: request.id };
    } else {
      const id = await addRequest({
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
        lastResponse: request.lastResponse || null,
      });
      broadcast('requests:updated');
      return { success: true, id };
    }
  });

  ipcMain.handle('request:saveAfter', async (_, request, afterRequestId) => {
    const id = await addRequestAfter(
      {
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
      },
      afterRequestId
    );
    broadcast('requests:updated');
    return { success: true, id };
  });

  ipcMain.handle('request:reorder', async (_, requestId, newOrder) => {
    await reorderRequest(requestId, newOrder);
    broadcast('requests:updated');
    return { success: true };
  });

  ipcMain.handle('request:delete', async (_, id) => {
    await deleteRequest(id);
    broadcast('requests:updated');
    return { success: true };
  });

  ipcMain.handle('request:send', async (_, options) => {
    const startTime = Date.now();
    try {
      const db = getDatabase();

      // Get global environment - use provided environmentId if available, otherwise use default
      let globalEnv;
      if (options.environmentId) {
        globalEnv = db.environments.find(e => e.id === options.environmentId);
      }
      // Fallback to default or first environment
      if (!globalEnv) {
        globalEnv =
          db.environments.find(e => e.isDefault === 1) || db.environments[0];
      }
      if (!globalEnv) {
        throw new Error('No environment selected');
      }

      // Get collection variables if request has a collection
      // CRITICAL: Match frontend fallback logic - use first env if no activeEnvironmentId
      let collectionVariables: Record<string, string> = {};
      if (options.collectionId) {
        const collection = db.collections.find(
          c => c.id === options.collectionId
        );
        if (
          collection &&
          collection.environments &&
          collection.environments.length > 0
        ) {
          let activeEnv;

          // If activeEnvironmentId is set, try to find that environment
          if (collection.activeEnvironmentId) {
            activeEnv = collection.environments.find(
              e => e.id === collection.activeEnvironmentId
            );
          }

          // If activeEnvironmentId not set or points to deleted environment, use first as fallback
          if (!activeEnv) {
            activeEnv = collection.environments[0];
          }

          if (activeEnv) {
            collectionVariables = activeEnv.variables || {};
          }
        }
      }

      // Create variable context
      const variableContext = {
        globalVariables: globalEnv.variables || {},
        collectionVariables,
      };

      // Resolve variables in all request parts
      const resolvedUrl = variableResolver.resolve(
        options.url,
        variableContext
      );
      const resolvedHeaders = variableResolver.resolveObject(
        options.headers || {},
        variableContext
      );
      const resolvedBody =
        typeof options.body === 'string'
          ? variableResolver.resolve(options.body, variableContext)
          : options.body;

      const resolvedQueryParams = (options.queryParams || []).map(param => ({
        ...param,
        value: variableResolver.resolve(param.value, variableContext),
      }));

      // Execute HTTP request using apiService with resolved values
      let result: any;
      const method = options.method || 'GET';

      switch (method) {
        case 'GET':
          result = await apiService.getJson(resolvedUrl, resolvedHeaders);
          break;
        case 'POST':
          result = await apiService.postJson(
            resolvedUrl,
            resolvedBody,
            resolvedHeaders
          );
          break;
        case 'PUT':
          result = await apiService.putJson(
            resolvedUrl,
            resolvedBody,
            resolvedHeaders
          );
          break;
        case 'PATCH':
          result = await apiService.patchJson(
            resolvedUrl,
            resolvedBody,
            resolvedHeaders
          );
          break;
        case 'DELETE':
          result = await apiService.deleteJson(resolvedUrl, resolvedHeaders);
          break;
        case 'HEAD':
          result = await apiService.headJson(resolvedUrl, resolvedHeaders);
          break;
        case 'OPTIONS':
          result = await apiService.optionsJson(resolvedUrl, resolvedHeaders);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Get request name if requestId exists
      let requestName: string | undefined;
      if (options.requestId) {
        const savedRequest = db.requests.find(r => r.id === options.requestId);
        if (savedRequest) {
          requestName = savedRequest.name;
        }
      }

      // Save to history with original URL and request metadata for reference
      await addRequestHistory({
        method: method,
        url: resolvedUrl,
        status: result.status,
        response_time: result.responseTime,
        response_body:
          typeof result.body === 'string'
            ? result.body
            : JSON.stringify(result.body),
        headers: JSON.stringify(resolvedHeaders),
        requestId: options.requestId, // Link to saved request if available
        collectionId: options.collectionId, // Link to collection if available
        requestBody:
          typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body || ''),
        queryParams: options.queryParams || [],
        auth: options.auth || null,
        requestName: requestName, // Store request name for display
        createdAt: new Date().toISOString(),
      });
      broadcast('history:updated');

      return {
        success: true,
        data: result.body,
        responseTime: result.responseTime,
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Return a proper ResponseData object even for errors
      // Use status 0 to indicate network/request errors (not HTTP errors)
      return {
        success: false,
        error: error.message,
        // Return ResponseData structure for error cases
        data: { error: error.message },
        responseTime: responseTime,
        status: 0, // 0 indicates network/request error (not an HTTP status)
        statusText: error.message || 'Request Failed',
        headers: {},
      };
    }
  });

  // Collection Runner - Execute all requests in a collection sequentially
  ipcMain.handle('collection:run', async (_, collectionId, onProgress) => {
    try {
      const db = getDatabase();

      // Get collection
      const collection = db.collections.find(c => c.id === collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }

      // Get global environment
      const globalEnv =
        db.environments.find(e => e.isDefault === 1) || db.environments[0];
      if (!globalEnv) {
        throw new Error('No environment selected');
      }

      // Get collection variables
      let collectionVariables: Record<string, string> = {};
      if (collection.environments && collection.activeEnvironmentId) {
        const activeEnv = collection.environments.find(
          e => e.id === collection.activeEnvironmentId
        );
        if (activeEnv) {
          collectionVariables = activeEnv.variables || {};
        }
      }

      // Create variable context
      const variableContext = {
        globalVariables: globalEnv.variables || {},
        collectionVariables,
      };

      // Get all requests in this collection (including folders)
      const allRequests = db.requests.filter(
        r => r.collectionId === collectionId
      );

      // Sort by order or id
      const sortedRequests = allRequests.sort((a, b) => {
        const orderA = a.order || 0;
        const orderB = b.order || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.id || 0) - (b.id || 0);
      });

      if (sortedRequests.length === 0) {
        return {
          success: true,
          results: [],
          message: 'No requests found in collection',
        };
      }

      const results: Array<{
        requestId: number;
        requestName: string;
        success: boolean;
        status?: number;
        responseTime?: number;
        error?: string;
      }> = [];

      // Execute requests sequentially
      for (let i = 0; i < sortedRequests.length; i++) {
        const request = sortedRequests[i];

        try {
          // Resolve variables in request
          const resolvedUrl = variableResolver.resolve(
            request.url,
            variableContext
          );
          const resolvedHeaders = variableResolver.resolveObject(
            request.headers || {},
            variableContext
          );
          const resolvedBody =
            typeof request.body === 'string'
              ? variableResolver.resolve(request.body, variableContext)
              : request.body;

          const resolvedQueryParams = (request.queryParams || []).map(
            param => ({
              ...param,
              value: variableResolver.resolve(param.value, variableContext),
            })
          );

          // Execute request
          let result: any;
          switch (request.method) {
            case 'GET':
              result = await apiService.getJson(resolvedUrl, resolvedHeaders);
              break;
            case 'POST':
              result = await apiService.postJson(
                resolvedUrl,
                resolvedBody,
                resolvedHeaders
              );
              break;
            case 'PUT':
              result = await apiService.putJson(
                resolvedUrl,
                resolvedBody,
                resolvedHeaders
              );
              break;
            case 'PATCH':
              result = await apiService.patchJson(
                resolvedUrl,
                resolvedBody,
                resolvedHeaders
              );
              break;
            case 'DELETE':
              result = await apiService.deleteJson(
                resolvedUrl,
                resolvedHeaders
              );
              break;
            case 'HEAD':
              result = await apiService.headJson(resolvedUrl, resolvedHeaders);
              break;
            case 'OPTIONS':
              result = await apiService.optionsJson(
                resolvedUrl,
                resolvedHeaders
              );
              break;
            default:
              throw new Error(`Unsupported HTTP method: ${request.method}`);
          }

          // Save to history with request metadata
          await addRequestHistory({
            method: request.method,
            url: resolvedUrl,
            status: result.status,
            response_time: result.responseTime,
            response_body:
              typeof result.body === 'string'
                ? result.body
                : JSON.stringify(result.body),
            headers: JSON.stringify(resolvedHeaders),
            requestId: request.id, // Link to saved request
            collectionId: request.collectionId, // Link to collection
            requestBody:
              typeof request.body === 'string'
                ? request.body
                : JSON.stringify(request.body || ''),
            queryParams: request.queryParams || [],
            auth: request.auth || null,
            requestName: request.name, // Store request name for display
            createdAt: new Date().toISOString(),
          });
          broadcast('history:updated');

          results.push({
            requestId: request.id!,
            requestName: request.name,
            success: true,
            status: result.status,
            responseTime: result.responseTime,
          });

          // Send progress update
          if (onProgress && typeof onProgress === 'function') {
            onProgress({
              current: i + 1,
              total: sortedRequests.length,
              requestName: request.name,
              requestId: request.id,
              status: 'completed',
            });
          }
        } catch (error: any) {
          results.push({
            requestId: request.id!,
            requestName: request.name,
            success: false,
            error: error.message,
          });

          // Send progress update for error
          if (onProgress && typeof onProgress === 'function') {
            onProgress({
              current: i + 1,
              total: sortedRequests.length,
              requestName: request.name,
              requestId: request.id,
              status: 'error',
              error: error.message,
            });
          }
        }
      }

      return {
        success: true,
        results,
        summary: {
          total: sortedRequests.length,
          passed: results.filter(r => r.success && r.status && r.status < 400)
            .length,
          failed: results.filter(
            r => !r.success || (r.status && r.status >= 400)
          ).length,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Request History operations
  ipcMain.handle('request:history', async (_, limit = 100) => {
    const db = getDatabase();
    return db.request_history
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.created_at).getTime();
        const bTime = new Date(b.createdAt || b.created_at).getTime();
        return bTime - aTime;
      })
      .slice(0, limit)
      .map((entry: any) => ({
        ...entry,
        responseTime: entry.responseTime || entry.response_time || 0,
        response_body: entry.response_body || entry.responseBody,
        createdAt: entry.createdAt || entry.created_at,
      }));
  });

  ipcMain.handle('request:deleteHistory', async (_, id) => {
    await deleteRequestHistory(id);
    broadcast('history:updated');
    return { success: true };
  });

  ipcMain.handle('request:clearAllHistory', async () => {
    await clearAllRequestHistory();
    broadcast('history:updated');
    return { success: true };
  });

  // Settings operations
  ipcMain.handle('settings:get', async (_, key) => {
    return getSetting(key);
  });

  ipcMain.handle('settings:set', async (_, key, value) => {
    await setSetting(key, value);
    return { success: true };
  });

  ipcMain.handle('settings:getAll', async () => {
    return getAllSettings();
  });

  ipcMain.handle('settings:reset', async () => {
    await resetSettings();
    return { success: true };
  });

  // Sidebar state operations
  ipcMain.handle('settings:getSidebarState', async () => {
    const state = getSetting('sidebar');
    // Return default state if not set
    if (!state) {
      return {
        expandedSections: ['collections'],
        sectionOrder: ['unsaved', 'collections'],
      };
    }
    return state;
  });

  ipcMain.handle('settings:setSidebarState', async (_, state) => {
    await setSetting('sidebar', state);
    return { success: true };
  });

  // File operations
  ipcMain.handle('file:select', async (_, filters) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('file:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('file:save', async (_, defaultPath, content) => {
    const result = await dialog.showSaveDialog({ defaultPath });
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content);
      return { success: true, filePath: result.filePath };
    }
    return { success: false };
  });

  ipcMain.handle('file:read', async (_, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:write', async (_, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // App operations
  ipcMain.handle('app:getVersion', async () => {
    return app.getVersion();
  });

  ipcMain.handle('app:getPath', async (_, name) => {
    return app.getPath(name as any);
  });

  // Window controls
  ipcMain.handle('window:minimize', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) window.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });

  ipcMain.handle('window:close', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) window.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    const window = BrowserWindow.getFocusedWindow();
    return window ? window.isMaximized() : false;
  });

  // Notification operations
  ipcMain.handle(
    'notification:show',
    async (_, options: { title: string; body: string; filePath?: string }) => {
      try {
        const { Notification } = require('electron');
        const notification = new Notification({
          title: options.title,
          body: options.body,
          silent: false,
        });

        // Store file path for click handler
        if (options.filePath) {
          notification.on('click', async () => {
            const { shell } = require('electron');
            await shell.openPath(options.filePath!);
          });
        }

        notification.show();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  );

  // Unsaved Request operations
  ipcMain.handle('unsaved-request:save', async (_, request) => {
    try {
      if (request.id) {
        await updateUnsavedRequest(request.id, {
          name: request.name,
          method: request.method,
          url: request.url,
          headers: request.headers || {},
          body: request.body || '',
          queryParams: request.queryParams || [],
          auth: request.auth || null,
          lastResponse: request.lastResponse,
        });
        return { success: true, id: request.id };
      } else {
        const id = await addUnsavedRequest({
          name: request.name,
          method: request.method,
          url: request.url,
          headers: request.headers || {},
          body: request.body || '',
          queryParams: request.queryParams || [],
          auth: request.auth || null,
          lastResponse: request.lastResponse,
          lastModified: new Date().toISOString(),
        });
        return { success: true, id };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('unsaved-request:get-all', async () => {
    try {
      return getAllUnsavedRequests();
    } catch (error: any) {
      return [];
    }
  });

  ipcMain.handle('unsaved-request:delete', async (_, id) => {
    try {
      await deleteUnsavedRequest(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('unsaved-request:clear', async () => {
    try {
      await clearUnsavedRequests();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('unsaved-request:promote', async (_, id, data) => {
    try {
      const savedId = await promoteUnsavedRequest(id, data);
      return { success: true, id: savedId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Preset operations
  ipcMain.handle('preset:list', async (_, requestId?: number) => {
    try {
      return getAllPresets(requestId);
    } catch (error: any) {
      logger.error('Failed to list presets', { error: error.message });
      return [];
    }
  });

  ipcMain.handle('preset:save', async (_, preset) => {
    try {
      const id = await addPreset(preset);
      return { success: true, id };
    } catch (error: any) {
      logger.error('Failed to save preset', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('preset:delete', async (_, id) => {
    try {
      await deletePreset(id);
      return { success: true };
    } catch (error: any) {
      logger.error('Failed to delete preset', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  // cURL operations
  ipcMain.handle('curl:parse', async (_, command: string) => {
    try {
      const request = parseCurlCommand(command);
      return { success: true, request };
    } catch (error: any) {
      logger.error('Failed to parse cURL command', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('curl:generate', async (_, request: any) => {
    try {
      const db = getDatabase();

      // Get global environment
      const globalEnv =
        db.environments.find(e => e.isDefault === 1) || db.environments[0];
      if (!globalEnv) {
        throw new Error('No environment selected');
      }

      // Get collection variables if collectionId is provided
      let collectionVariables: Record<string, string> = {};
      if (request.collectionId) {
        const collection = db.collections.find(
          c => c.id === request.collectionId
        );
        if (
          collection &&
          collection.environments &&
          collection.environments.length > 0
        ) {
          let activeEnv;

          // If activeEnvironmentId is set, try to find that environment
          if (collection.activeEnvironmentId) {
            activeEnv = collection.environments.find(
              e => e.id === collection.activeEnvironmentId
            );
          }

          // If activeEnvironmentId not set or points to deleted environment, use first as fallback
          if (!activeEnv) {
            activeEnv = collection.environments[0];
          }

          if (activeEnv) {
            collectionVariables = activeEnv.variables || {};
          }
        }
      }

      // Create variable context
      const variableContext = {
        globalVariables: globalEnv.variables || {},
        collectionVariables,
      };

      // Resolve variables in all request parts
      const resolvedUrl = variableResolver.resolve(
        request.url || '',
        variableContext
      );
      const resolvedHeaders = variableResolver.resolveObject(
        request.headers || {},
        variableContext
      );
      const resolvedBody =
        typeof request.body === 'string'
          ? variableResolver.resolve(request.body, variableContext)
          : request.body || '';

      const resolvedQueryParams = (request.queryParams || []).map(param => ({
        ...param,
        value: variableResolver.resolve(param.value || '', variableContext),
      }));

      // Resolve auth variables
      const resolvedAuth = { ...request.auth };
      if (resolvedAuth.type === 'bearer' && resolvedAuth.token) {
        resolvedAuth.token = variableResolver.resolve(
          resolvedAuth.token,
          variableContext
        );
      }
      if (resolvedAuth.type === 'basic') {
        if (resolvedAuth.username) {
          resolvedAuth.username = variableResolver.resolve(
            resolvedAuth.username,
            variableContext
          );
        }
        if (resolvedAuth.password) {
          resolvedAuth.password = variableResolver.resolve(
            resolvedAuth.password,
            variableContext
          );
        }
      }
      if (resolvedAuth.type === 'apikey') {
        if (resolvedAuth.apiKey) {
          resolvedAuth.apiKey = variableResolver.resolve(
            resolvedAuth.apiKey,
            variableContext
          );
        }
        if (resolvedAuth.apiKeyHeader) {
          resolvedAuth.apiKeyHeader = variableResolver.resolve(
            resolvedAuth.apiKeyHeader,
            variableContext
          );
        }
      }

      // Generate cURL command with resolved values
      const resolvedRequest = {
        method: request.method,
        url: resolvedUrl,
        headers: resolvedHeaders,
        body: resolvedBody,
        queryParams: resolvedQueryParams,
        auth: resolvedAuth,
      };

      const curlCommand = generateCurlCommand(resolvedRequest);
      return { success: true, command: curlCommand };
    } catch (error: any) {
      logger.error('Failed to generate cURL command', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('curl:import-bulk', async (_, commands: string[]) => {
    try {
      const results = parseCurlCommands(commands);
      return { success: true, results };
    } catch (error: any) {
      logger.error('Failed to parse bulk cURL commands', { error: error.message });
      return { success: false, error: error.message };
    }
  });

  // ============================================================================
  // Collection Import operations
  // ============================================================================

  ipcMain.handle('import:detect-format', async (_, content: string) => {
    try {
      logger.info('[Import] Detecting format', {
        contentLength: content?.length || 0,
      });
      const factory = getImportFactory();
      const result = await factory.detectFormat(content);
      logger.info('[Import] Format detection result', { result });
      return result;
    } catch (error: any) {
      logger.error('[Import] Failed to detect import format', {
        error: error.message,
      });
      return {
        format: null,
        isValid: false,
        confidence: 0,
        error: error.message,
      };
    }
  });

  ipcMain.handle(
    'import:parse',
    async (_, content: string, format?: string) => {
      try {
        logger.info('[Import] Parsing content', { format });
        const factory = getImportFactory();
        const result = await factory.parse(content, format);
        logger.info('[Import] Parse result', {
          success: result.success,
          error: result.error || '',
        });
        if (result.success && result.result) {
          logger.info('[Import] Parsed metadata', {
            collection: result.result.collection.name,
            folders: result.result.folders.length,
            requests: result.result.requests.length,
            warnings: result.result.warnings.length,
            errors: result.result.errors.length,
          });
        }
        return result;
      } catch (error: any) {
        logger.error('[Import] Failed to parse import', {
          error: error.message,
        });
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    'import:execute',
    async (_, importResult: ImportResult, options: ImportOptions) => {
      try {
        const db = getDatabase();
        const warnings: string[] = [];

        // Create the collection first
        const collectionId = await addCollection({
          name: importResult.collection.name,
          description: importResult.collection.description || '',
          documentation: importResult.collection.documentation || '',
          environments: [],
          isFavorite: 0,
        });

        // Create folder ID mapping (tempId -> actual ID)
        const folderIdMap = new Map<string, number>();

        // Sort folders by path depth to ensure parents are created first
        const sortedFolders = [...importResult.folders].sort((a, b) => {
          const depthA = a.path.split('/').length;
          const depthB = b.path.split('/').length;
          return depthA - depthB;
        });

        // Create folders
        for (const folder of sortedFolders) {
          const folderId = await addFolder({
            name: folder.name,
            description: folder.description || '',
            collectionId: collectionId,
            order: folder.order,
          });
          folderIdMap.set(folder.tempId, folderId);
        }

        // Create requests
        let requestCount = 0;
        for (const request of importResult.requests) {
          try {
            // Resolve folder ID
            const folderId = request.folderTempId
              ? folderIdMap.get(request.folderTempId) || null
              : null;

            await addRequest({
              name: request.name,
              method: request.method,
              url: request.url,
              headers: request.headers || {},
              body: request.body || '',
              queryParams: request.queryParams || [],
              auth: request.auth || { type: 'none' },
              collectionId: collectionId,
              folderId: folderId,
              isFavorite: 0,
              order: request.order,
            });
            requestCount++;
          } catch (err: any) {
            warnings.push(
              `Failed to import request "${request.name}": ${err.message}`
            );
          }
        }

        // Handle environments based on options
        let environmentCount = 0;
        if (
          options.environmentMode !== 'skip' &&
          importResult.environments &&
          importResult.environments.length > 0
        ) {
          if (options.environmentMode === 'collection') {
            // Add as collection environments
            const collection = db.collections.find(c => c.id === collectionId);
            if (collection) {
              collection.environments = importResult.environments.map(
                (env, index) => ({
                  id: generateUniqueId(),
                  name: env.name,
                  variables: env.variables,
                })
              );
              if (collection.environments.length > 0) {
                collection.activeEnvironmentId = collection.environments[0].id;
              }
              await saveDatabase();
              environmentCount = importResult.environments.length;
            }
          } else if (options.environmentMode === 'global') {
            // Add as global environments
            for (const env of importResult.environments) {
              await addEnvironment({
                name: env.name,
                displayName: env.name,
                variables: env.variables,
                isDefault: 0,
              });
              environmentCount++;
            }
          }
        }

        // Broadcast updates
        broadcast('collections:updated');
        broadcast('folders:updated');
        broadcast('requests:updated');

        return {
          success: true,
          collectionId,
          folderCount: sortedFolders.length,
          requestCount,
          environmentCount,
          warnings,
        };
      } catch (error: any) {
        logger.error('Failed to execute import', { error });
        return {
          success: false,
          error: error.message,
          folderCount: 0,
          requestCount: 0,
          environmentCount: 0,
          warnings: [],
        };
      }
    }
  );

  ipcMain.handle('import:supported-formats', async () => {
    try {
      const factory = getImportFactory();
      const formats = await factory.getSupportedFormats();
      return formats;
    } catch (error: any) {
      logger.error('Failed to get supported formats', { error: error.message });
      return [];
    }
  });

  // Logger operations from renderer
  ipcMain.handle('logger:info', (_event, message, args) => {
    logger.info(`[Renderer] ${message}`, { args });
  });

  ipcMain.handle('logger:error', (_event, message, args) => {
    logger.error(`[Renderer] ${message}`, { args });
  });

  ipcMain.handle('logger:warn', (_event, message, args) => {
    logger.warn(`[Renderer] ${message}`, { args });
  });

  ipcMain.handle('logger:debug', (_event, message, args) => {
    logger.debug(`[Renderer] ${message}`, { args });
  });
}
