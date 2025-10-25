import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import {
  getDatabase,
  saveDatabase,
  addEnvironment,
  updateEnvironment,
  deleteEnvironment,
  addCollection,
  updateCollection,
  deleteCollection,
  addRequest,
  updateRequest,
  deleteRequest,
  addRequestHistory,
  deleteRequestHistory,
  setSetting,
  getSetting,
  getAllSettings,
  resetSettings,
} from '../database';
import { apiService } from '../services/api';
import fs from 'fs';

export function registerIpcHandlers() {

  // Environment operations
  ipcMain.handle('env:list', async () => {
    const db = getDatabase();
    return db.environments.sort((a, b) => {
      const aTime = a.last_used ? new Date(a.last_used).getTime() : 0;
      const bTime = b.last_used ? new Date(b.last_used).getTime() : 0;
      return bTime - aTime;
    });
  });

  ipcMain.handle('env:save', async (_, env) => {
    if (env.id) {
      updateEnvironment(env.id, {
        name: env.name,
        display_name: env.displayName,
        variables: env.variables || {},
        is_default: env.isDefault ? 1 : 0,
      });
      return { success: true, id: env.id };
    } else {
      const id = addEnvironment({
        name: env.name,
        display_name: env.displayName,
        variables: env.variables || {},
        is_default: env.isDefault ? 1 : 0,
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
    } catch (error: any) {
      return { success: false, message: error.message };
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
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('env:getCurrent', async () => {
    const db = getDatabase();
    const defaultEnv = db.environments.find((e) => e.is_default === 1);
    if (!defaultEnv && db.environments.length > 0) {
      return db.environments[0];
    }
    return defaultEnv || null;
  });

  ipcMain.handle('env:setCurrent', async (_, id) => {
    const db = getDatabase();
    db.environments.forEach((env) => {
      env.is_default = env.id === id ? 1 : 0;
      if (env.id === id) {
        env.last_used = new Date().toISOString();
      }
    });
    saveDatabase();
    return { success: true };
  });

  // Collection operations
  ipcMain.handle('collection:list', async () => {
    const db = getDatabase();
    return db.collections.sort((a, b) => {
      const aTime = a.last_used ? new Date(a.last_used).getTime() : 0;
      const bTime = b.last_used ? new Date(b.last_used).getTime() : 0;
      return bTime - aTime;
    });
  });

  ipcMain.handle('collection:save', async (_, collection) => {
    if (collection.id) {
      updateCollection(collection.id, {
        name: collection.name,
        description: collection.description,
        variables: collection.variables || {},
        is_favorite: collection.isFavorite ? 1 : 0,
      });
      return { success: true, id: collection.id };
    } else {
      const id = addCollection({
        name: collection.name,
        description: collection.description,
        variables: collection.variables || {},
        is_favorite: collection.isFavorite ? 1 : 0,
      });
      return { success: true, id };
    }
  });

  ipcMain.handle('collection:delete', async (_, id) => {
    deleteCollection(id);
    return { success: true };
  });

  ipcMain.handle('collection:toggleFavorite', async (_, id) => {
    const db = getDatabase();
    const collection = db.collections.find((c) => c.id === id);
    if (collection) {
      collection.is_favorite = collection.is_favorite ? 0 : 1;
      saveDatabase();
    }
    return { success: true };
  });

  // Request operations
  ipcMain.handle('request:list', async (_, collectionId) => {
    const db = getDatabase();
    return db.requests.filter(r => !collectionId || r.collection_id === collectionId);
  });

  ipcMain.handle('request:save', async (_, request) => {
    if (request.id) {
      updateRequest(request.id, {
        name: request.name,
        method: request.method,
        url: request.url,
        headers: request.headers || {},
        body: request.body || null,
        auth: request.auth || null,
        collection_id: request.collectionId,
        is_favorite: request.isFavorite ? 1 : 0,
      });
      return { success: true, id: request.id };
    } else {
      const id = addRequest({
        name: request.name,
        method: request.method,
        url: request.url,
        headers: request.headers || {},
        body: request.body || null,
        auth: request.auth || null,
        collection_id: request.collectionId,
        is_favorite: request.isFavorite ? 1 : 0,
      });
      return { success: true, id };
    }
  });

  ipcMain.handle('request:delete', async (_, id) => {
    deleteRequest(id);
    return { success: true };
  });

  ipcMain.handle('request:send', async (_, options) => {
    try {
      const db = getDatabase();
      const env = db.environments.find((e) => e.is_default === 1) || db.environments[0];

      if (!env) {
        throw new Error('No environment selected');
      }

      // Execute HTTP request using apiService
      const startTime = Date.now();
      const result = await apiService.getJson(options.url, options.headers);
      const responseTime = Date.now() - startTime;

      // Save to history
      addRequestHistory({
        method: options.method || 'GET',
        url: options.url,
        status: 200, // Assuming success for now
        response_time: responseTime,
        response_body: JSON.stringify(result),
        headers: JSON.stringify(options.headers || {}),
        created_at: new Date().toISOString(),
      });

      return { success: true, data: result, responseTime };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Request History operations
  ipcMain.handle('request:history', async (_, limit = 100) => {
    const db = getDatabase();
    return db.request_history
      .sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
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
  ipcMain.handle('notification:show', async (_, options: { title: string; body: string; filePath?: string }) => {
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
  });
}
