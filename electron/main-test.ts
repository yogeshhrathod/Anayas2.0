import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import path from 'path';
import { initDatabase } from './database';
import { registerIpcHandlers } from './ipc';
import { createLogger } from './services/logger';

const logger = createLogger('main-test');

// Enable test mode
process.env.TEST_MODE = 'true';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const isDarkMode = nativeTheme.shouldUseDarkColors;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Enable remote debugging for Playwright
      webSecurity: false,
    },
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 10, y: 10 },
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    show: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
  });

  // In test mode, always use dev server if available, otherwise use dist
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Expose window for testing
  return mainWindow;
}

// Test utilities IPC handlers
function registerTestHandlers() {
  // Handler to get test database path
  ipcMain.handle('test:getDbPath', () => {
    return process.env.TEST_DB_PATH || '';
  });

  // Handler to reset database (for test cleanup)
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

  // Handler to check if app is ready
  ipcMain.handle('test:isReady', () => {
    return { ready: app.isReady() && mainWindow !== null };
  });
}

app.whenReady().then(async () => {
  try {
    // Initialize database with test path if provided
    const testDbPath = process.env.TEST_DB_PATH;
    await initDatabase(testDbPath);

    registerIpcHandlers();
    registerTestHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    logger.info('Test application started successfully');
  } catch (error) {
    logger.error('Failed to start test application', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // In test mode, allow app to quit even on macOS
  app.quit();
});

app.on('before-quit', () => {
  logger.info('Test application shutting down');
});
