import { ipcMain, dialog, app, BrowserWindow, Notification, shell } from 'electron';
import {
  getDatabase,
  saveDatabase,
  addEnvironment,
  updateEnvironment,
  deleteEnvironment,
  addCollection,
  updateCollection,
  deleteCollection,
  addFolder,
  addFolderAfter,
  updateFolder,
  deleteFolder,
  reorderFolder,
  reorderRequest,
  addRequest,
  addRequestAfter,
  updateRequest,
  deleteRequest,
  addRequestHistory,
  deleteRequestHistory,
  setSetting,
  getSetting,
  getAllSettings,
  resetSettings,
  addUnsavedRequest,
  updateUnsavedRequest,
  deleteUnsavedRequest,
  getAllUnsavedRequests,
  clearUnsavedRequests,
  promoteUnsavedRequest,
  addPreset,
  getAllPresets,
  deletePreset,
  generateUniqueId,
} from '../database';
import { apiService } from '../services/api';
import { variableResolver } from '../services/variable-resolver';
import { parseCurlCommand, parseCurlCommands } from '../lib/curl-parser';
import { generateCurlCommand } from '../lib/curl-generator';
import fs from 'fs';

const broadcast = (channel: string, payload?: any) => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, payload);
  });
};

export function registerIpcHandlers() {

  // Environment operations
  ipcMain.handle('env:list', async () => {
    const db = getDatabase();
    return db.environments.sort((a, b) => {
      const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return bTime - aTime;
    });
  });

  ipcMain.handle('env:save', async (_, env) => {
    if (env.id) {
      updateEnvironment(env.id, {
        name: env.name,
        displayName: env.displayName,
        variables: env.variables || {},
        isDefault: env.isDefault ? 1 : 0,
      });
      return { success: true, id: env.id };
    } else {
      const id = addEnvironment({
        name: env.name,
        displayName: env.displayName,
        variables: env.variables || {},
        isDefault: env.isDefault ? 1 : 0,
      });
      return { success: true, id };
    }
  });

  ipcMain.handle('env:delete', async (_, id) => {
    deleteEnvironment(id);
    return { success: true };
  });

  ipcMain.handle('env:test', async (_, env) => {
    try {
      // Test connection to base URL if provided
      const baseUrl = env.variables?.base_url || env.baseUrl;
      if (baseUrl) {
        const isReachable = await apiService.testConnection(baseUrl);
        return { success: isReachable, message: isReachable ? 'Connection successful' : 'Connection failed' };
      }
      return { success: true, message: 'No base URL to test' };
    } catch (_error: any) {
      return { success: false, message: _error.message };
    }
  });

  ipcMain.handle('env:import', async (_, filePath) => {
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
    } catch (_error: any) {
      return { success: false, message: _error.message };
    }
  });

  ipcMain.handle('env:getCurrent', async () => {
    const db = getDatabase();
    const defaultEnv = db.environments.find((e) => e.isDefault === 1);
    if (!defaultEnv && db.environments.length > 0) {
      return db.environments[0];
    }
    return defaultEnv || null;
  });

  ipcMain.handle('env:setCurrent', async (_, id) => {
    const db = getDatabase();
    db.environments.forEach((env) => {
      env.isDefault = env.id === id ? 1 : 0;
      if (env.id === id) {
        env.lastUsed = new Date().toISOString();
      }
    });
    saveDatabase();
    return { success: true };
  });

  // Collection operations
  ipcMain.handle('collection:list', async () => {
    const db = getDatabase();
    return db.collections.sort((a, b) => {
      const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return bTime - aTime;
    });
  });

  ipcMain.handle('collection:save', async (_, collection) => {
    if (collection.id) {
      updateCollection(collection.id, {
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
      const id = addCollection({
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
    deleteCollection(id);
    broadcast('collections:updated');
    broadcast('requests:updated');
    return { success: true };
  });

  ipcMain.handle('collection:toggleFavorite', async (_, id) => {
    const db = getDatabase();
    const collection = db.collections.find((c) => c.id === id);
    if (collection) {
      collection.isFavorite = collection.isFavorite ? 0 : 1;
      saveDatabase();
    }
    broadcast('collections:updated');
    return { success: true };
  });

  // Collection Environment operations
  ipcMain.handle('collection:addEnvironment', async (_, collectionId, environment) => {
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
      variables: environment.variables || {}
    });
    
    // If this is the first environment, set it as active
    if (collection.environments.length === 1) {
      collection.activeEnvironmentId = envId;
    }
    
    saveDatabase();
    const updatedCollection = db.collections.find(c => c.id === collectionId);
    broadcast('collections:updated');
    return { success: true, id: envId, collection: updatedCollection };
  });

  ipcMain.handle('collection:updateEnvironment', async (_, collectionId, environmentId, updates) => {
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
    saveDatabase();
    const updatedCollection = db.collections.find(c => c.id === collectionId);
    broadcast('collections:updated');
    return { success: true, collection: updatedCollection };
  });

  ipcMain.handle('collection:deleteEnvironment', async (_, collectionId, environmentId) => {
    const db = getDatabase();
    const collection = db.collections.find(c => c.id === collectionId);
    if (!collection || !collection.environments) {
      throw new Error('Collection or environment not found');
    }
    
    collection.environments = collection.environments.filter(e => e.id !== environmentId);
    
    // If we deleted the active environment, set first available as active
    if (collection.activeEnvironmentId === environmentId) {
      collection.activeEnvironmentId = collection.environments.length > 0 
        ? collection.environments[0].id 
        : undefined;
    }
    
    saveDatabase();
    const updatedCollection = db.collections.find(c => c.id === collectionId);
    broadcast('collections:updated');
    return { success: true, collection: updatedCollection };
  });

  ipcMain.handle('collection:setActiveEnvironment', async (_, collectionId, environmentId) => {
    const db = getDatabase();
    const collection = db.collections.find(c => c.id === collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    if (environmentId !== null && environmentId !== undefined) {
      if (!collection.environments || !collection.environments.find(e => e.id === environmentId)) {
        throw new Error('Environment not found');
      }
    }
    
    collection.activeEnvironmentId = environmentId;
    saveDatabase();
    const updatedCollection = db.collections.find(c => c.id === collectionId);
    broadcast('collections:updated');
    return { success: true, collection: updatedCollection };
  });

  // Folder operations
  ipcMain.handle('folder:list', async (_, collectionId) => {
    const db = getDatabase();
    const filteredFolders = db.folders.filter(f => !collectionId || f.collectionId === collectionId);
    
    // Sort by order field, then by id as fallback
    return filteredFolders.sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.id || 0) - (b.id || 0);
    });
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
      const id = addFolder({
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
    const id = addFolderAfter(folder, afterFolderId);
    broadcast('folders:updated');
    return { success: true, id };
  });

  ipcMain.handle('folder:reorder', async (_, folderId, newOrder) => {
    reorderFolder(folderId, newOrder);
    broadcast('folders:updated');
    return { success: true };
  });

  ipcMain.handle('folder:delete', async (_, id) => {
    deleteFolder(id);
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
    return filteredRequests.sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.id || 0) - (b.id || 0);
    });
  });

  ipcMain.handle('request:save', async (_, request) => {
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
      const id = addRequest({
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
    const id = addRequestAfter({
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
    broadcast('requests:updated');
    return { success: true, id };
  });

  ipcMain.handle('request:reorder', async (_, requestId, newOrder) => {
    reorderRequest(requestId, newOrder);
    broadcast('requests:updated');
    return { success: true };
  });

  ipcMain.handle('request:delete', async (_, id) => {
    deleteRequest(id);
    broadcast('requests:updated');
    return { success: true };
  });

  ipcMain.handle('request:send', async (_, options) => {
    try {
      const db = getDatabase();
      
      // Get global environment - use provided environmentId if available, otherwise use default
      let globalEnv;
      if (options.environmentId) {
        globalEnv = db.environments.find((e) => e.id === options.environmentId);
      }
      // Fallback to default or first environment
      if (!globalEnv) {
        globalEnv = db.environments.find((e) => e.isDefault === 1) || db.environments[0];
      }
      if (!globalEnv) {
        throw new Error('No environment selected');
      }

      // Get collection variables if request has a collection
      // CRITICAL: Match frontend fallback logic - use first env if no activeEnvironmentId
      let collectionVariables: Record<string, string> = {};
      if (options.collectionId) {
        const collection = db.collections.find(c => c.id === options.collectionId);
        if (collection && collection.environments && collection.environments.length > 0) {
          let activeEnv;
          
          // If activeEnvironmentId is set, try to find that environment
          if (collection.activeEnvironmentId) {
            activeEnv = collection.environments.find(e => e.id === collection.activeEnvironmentId);
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
        collectionVariables
      };

      // Resolve variables in all request parts
      const resolvedUrl = variableResolver.resolve(options.url, variableContext);
      const resolvedHeaders = variableResolver.resolveObject(options.headers || {}, variableContext);
      const resolvedBody = typeof options.body === 'string' 
        ? variableResolver.resolve(options.body, variableContext)
        : options.body;
      
      // Resolve query params variables (currently not used but kept for future use)
      const _resolvedQueryParams = (options.queryParams || []).map(param => ({
        ...param,
        value: variableResolver.resolve(param.value, variableContext)
      }));

      // Execute HTTP request using apiService with resolved values
      let result: any;
      const method = options.method || 'GET';
      
      switch (method) {
        case 'GET':
          result = await apiService.getJson(resolvedUrl, resolvedHeaders);
          break;
        case 'POST':
          result = await apiService.postJson(resolvedUrl, resolvedBody, resolvedHeaders);
          break;
        case 'PUT':
          result = await apiService.putJson(resolvedUrl, resolvedBody, resolvedHeaders);
          break;
        case 'PATCH':
          result = await apiService.patchJson(resolvedUrl, resolvedBody, resolvedHeaders);
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

      // Save to history with original URL for reference
      addRequestHistory({
        method: method,
        url: resolvedUrl,
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
    } catch (_error: any) {
      return { success: false, error: _error.message };
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
      const globalEnv = db.environments.find((e) => e.isDefault === 1) || db.environments[0];
      if (!globalEnv) {
        throw new Error('No environment selected');
      }

      // Get collection variables
      let collectionVariables: Record<string, string> = {};
      if (collection.environments && collection.activeEnvironmentId) {
        const activeEnv = collection.environments.find(e => e.id === collection.activeEnvironmentId);
        if (activeEnv) {
          collectionVariables = activeEnv.variables || {};
        }
      }

      // Create variable context
      const variableContext = {
        globalVariables: globalEnv.variables || {},
        collectionVariables
      };

      // Get all requests in this collection (including folders)
      const allRequests = db.requests.filter(r => r.collectionId === collectionId);
      
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
        return { success: true, results: [], message: 'No requests found in collection' };
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
          const resolvedUrl = variableResolver.resolve(request.url, variableContext);
          const resolvedHeaders = variableResolver.resolveObject(request.headers || {}, variableContext);
          const resolvedBody = typeof request.body === 'string' 
            ? variableResolver.resolve(request.body, variableContext)
            : request.body;
          
          // Resolve query params variables (currently not used but kept for future use)
          const _resolvedQueryParams = (request.queryParams || []).map(param => ({
            ...param,
            value: variableResolver.resolve(param.value, variableContext)
          }));

          // Execute request
          let result: any;
          switch (request.method) {
            case 'GET':
              result = await apiService.getJson(resolvedUrl, resolvedHeaders);
              break;
            case 'POST':
              result = await apiService.postJson(resolvedUrl, resolvedBody, resolvedHeaders);
              break;
            case 'PUT':
              result = await apiService.putJson(resolvedUrl, resolvedBody, resolvedHeaders);
              break;
            case 'PATCH':
              result = await apiService.patchJson(resolvedUrl, resolvedBody, resolvedHeaders);
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
              throw new Error(`Unsupported HTTP method: ${request.method}`);
          }

          // Save to history
          addRequestHistory({
            method: request.method,
            url: resolvedUrl,
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

          // Send progress update
          if (onProgress && typeof onProgress === 'function') {
            onProgress({
              current: i + 1,
              total: sortedRequests.length,
              requestName: request.name,
              requestId: request.id,
              status: 'completed'
            });
          }
        } catch (_error: any) {
          results.push({
            requestId: request.id!,
            requestName: request.name,
            success: false,
            error: _error.message
          });

          // Send progress update for error
          if (onProgress && typeof onProgress === 'function') {
            onProgress({
              current: i + 1,
              total: sortedRequests.length,
              requestName: request.name,
              requestId: request.id,
              status: 'error',
              error: _error.message
            });
          }
        }
      }

      return {
        success: true,
        results,
        summary: {
          total: sortedRequests.length,
          passed: results.filter(r => r.success && r.status && r.status < 400).length,
          failed: results.filter(r => !r.success || (r.status && r.status >= 400)).length
        }
      };
    } catch (_error: any) {
      return { success: false, error: _error.message };
    }
  });

  // Request History operations
  ipcMain.handle('request:history', async (_, limit = 100) => {
    const db = getDatabase();
    return db.request_history
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      })
      .slice(0, limit);
  });

  ipcMain.handle('request:deleteHistory', async (_, id) => {
    deleteRequestHistory(id);
    return { success: true };
  });

  // Settings operations
  ipcMain.handle('settings:get', async (_, key) => {
    return getSetting(key);
  });

  ipcMain.handle('settings:set', async (_, key, value) => {
    setSetting(key, value);
    return { success: true };
  });

  ipcMain.handle('settings:getAll', async () => {
    return getAllSettings();
  });

  ipcMain.handle('settings:reset', async () => {
    resetSettings();
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
    setSetting('sidebar', state);
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
    } catch (_error: any) {
      return { success: false, error: _error.message };
    }
  });

  ipcMain.handle('file:write', async (_, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (_error: any) {
      return { success: false, error: _error.message };
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
  ipcMain.handle('notification:show', async (_, options: { title: string; body: string; filePath?: string }) => {
    try {
      const notification = new Notification({
        title: options.title,
        body: options.body,
        silent: false,
      });

      // Store file path for click handler
      if (options.filePath) {
        notification.on('click', async () => {
          await shell.openPath(options.filePath!);
        });
      }

      notification.show();
      return { success: true };
    } catch (_error: any) {
      return { success: false, error: _error.message };
    }
  });

  // Unsaved Request operations
  ipcMain.handle('unsaved-request:save', async (_, request) => {
    try {
      if (request.id) {
        updateUnsavedRequest(request.id, {
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
        const id = addUnsavedRequest({
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
    } catch (_error: any) {
      return { success: false, error: _error.message };
    }
  });

  ipcMain.handle('unsaved-request:get-all', async () => {
    try {
      return getAllUnsavedRequests();
    } catch {
      return [];
    }
  });

  ipcMain.handle('unsaved-request:delete', async (_, id) => {
    try {
      deleteUnsavedRequest(id);
      return { success: true };
    } catch (_error: any) {
      return { success: false, error: _error.message };
    }
  });

  ipcMain.handle('unsaved-request:clear', async () => {
    try {
      clearUnsavedRequests();
      return { success: true };
    } catch (_error: any) {
      return { success: false, error: _error.message };
    }
  });

  ipcMain.handle('unsaved-request:promote', async (_, id, data) => {
    try {
      const savedId = promoteUnsavedRequest(id, data);
      return { success: true, id: savedId };
    } catch (_error: any) {
      return { success: false, error: _error.message };
    }
  });

  // Preset operations
  ipcMain.handle('preset:list', async (_, requestId?: number) => {
    try {
      return getAllPresets(requestId);
    } catch (error: unknown) {
      console.error('Failed to list presets:', error);
      return [];
    }
  });

  ipcMain.handle('preset:save', async (_, preset) => {
    try {
      const id = addPreset(preset);
      return { success: true, id };
    } catch (_error: any) {
      console.error('Failed to save preset:', error);
      return { success: false, error: _error.message };
    }
  });

  ipcMain.handle('preset:delete', async (_, id) => {
    try {
      deletePreset(id);
      return { success: true };
    } catch (_error: any) {
      console.error('Failed to delete preset:', error);
      return { success: false, error: _error.message };
    }
  });

  // cURL operations
  ipcMain.handle('curl:parse', async (_, command: string) => {
    try {
      const request = parseCurlCommand(command);
      return { success: true, request };
    } catch (_error: any) {
      console.error('Failed to parse cURL command:', error);
      return { success: false, error: _error.message };
    }
  });

  ipcMain.handle('curl:generate', async (_, request: any) => {
    try {
      const curlCommand = generateCurlCommand(request);
      return { success: true, command: curlCommand };
    } catch (_error: any) {
      console.error('Failed to generate cURL command:', error);
      return { success: false, error: _error.message };
    }
  });

  ipcMain.handle('curl:import-bulk', async (_, commands: string[]) => {
    try {
      const results = parseCurlCommands(commands);
      return { success: true, results };
    } catch (_error: any) {
      console.error('Failed to parse bulk cURL commands:', error);
      return { success: false, error: _error.message };
    }
  });
}
