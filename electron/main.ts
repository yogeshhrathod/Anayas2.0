import { app, BrowserWindow, ipcMain, Menu, nativeTheme } from 'electron';
import path from 'path';

// Set application name early
app.name = 'Luna';


// Import Sentry functions (initialization happens after database is ready)
import { addBreadcrumb, flushSentry, initSentry } from './sentry';

import { initDatabase } from './database';
import { registerIpcHandlers } from './ipc';
import { createLogger } from './services/logger';

const logger = createLogger('main');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Detect system dark mode and set appropriate background
  const isDarkMode = nativeTheme.shouldUseDarkColors;
  const backgroundColor = isDarkMode ? '#020817' : '#ffffff';

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

    // Initialize Sentry after database (so it can check telemetry settings)
    await initSentry();
    addBreadcrumb('app', 'Application starting', { version: app.getVersion() });

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

    // Set About panel options for macOS
    if (process.platform === 'darwin') {
      app.setAboutPanelOptions({
        applicationName: 'Luna',
        applicationVersion: app.getVersion(),
        version: app.getVersion(),
        copyright: 'Copyright © 2026 Luna',
        credits: 'Luna Team',
      });
    }

    // Create a basic menu to ensure "Luna" is shown instead of "Electron"
    const template: any[] = [
      ...(process.platform === 'darwin'
        ? [
            {
              label: app.name,
              submenu: [
                { role: 'about' },
                { type: 'separator' },
                {
                  label: 'Restart Luna',
                  accelerator: 'CmdOrCtrl+Alt+R',
                  click: () => {
                    app.relaunch();
                    app.exit();
                  },
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
              ],
            },
          ]
        : []),
      {
        label: 'File',
        submenu: [
          ...(process.platform !== 'darwin'
            ? [
                {
                  label: 'Restart App',
                  accelerator: 'Ctrl+Alt+R',
                  click: () => {
                    app.relaunch();
                    app.exit();
                  },
                },
                { type: 'separator' },
                { role: 'quit' },
              ]
            : [{ role: 'close' }]),
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        role: 'window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(process.platform === 'darwin'
            ? [
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' },
              ]
            : []),
        ],
      },
    ];


    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

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

app.on('before-quit', async () => {
  logger.info('Application shutting down');
  // Flush any pending Sentry events before quitting
  await flushSentry();
});
