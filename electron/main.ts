import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase } from './database';
import { registerIpcHandlers } from './ipc';
import { createLogger } from './services/logger';

const logger = createLogger('main');



let mainWindow: BrowserWindow | null = null;
let lastGeneratedFilePath: string | null = null;

function createWindow() {
  // Force dark mode background to prevent white flash
  const backgroundColor = '#0f172a';
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 10, y: 10 },
    backgroundColor,
    show: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show immediately for the splash screen to take over
  mainWindow.show();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // Support test mode: use custom database path if provided
    const testDbPath = process.env.TEST_DB_PATH;
    await initDatabase(testDbPath);
    registerIpcHandlers();
    
    // Register test handlers if in test mode
    if (process.env.TEST_MODE === 'true') {
      // Test utilities IPC handlers
      ipcMain.handle('test:getDbPath', () => {
        return process.env.TEST_DB_PATH || '';
      });

      ipcMain.handle('test:resetDatabase', async () => {
        const { getDatabase, saveDatabase } = await import('./database');
        const db = getDatabase();
        db.environments = [];
        db.collections = [];
        db.folders = [];
        db.requests = [];
        db.request_history = [];
        db.unsaved_requests = [];
        db.presets = [];
        db.settings = {};
        saveDatabase();
        return { success: true };
      });

      ipcMain.handle('test:isReady', () => {
        return { ready: app.isReady() && mainWindow !== null };
      });
    }
    
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    logger.info('Application started successfully');
  } catch (error) {
    logger.error('Failed to start application', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info('Application shutting down');
});
