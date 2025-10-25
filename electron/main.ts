import { app, BrowserWindow, ipcMain, nativeTheme, Notification, shell } from 'electron';
import path from 'path';
import { initDatabase } from './database';
import { registerIpcHandlers } from './ipc';
import { createLogger } from './services/logger';

const logger = createLogger('main');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let mainWindow: BrowserWindow | null = null;
let lastGeneratedFilePath: string | null = null;

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
    },
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 10, y: 10 },
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
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

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await initDatabase();
    registerIpcHandlers();
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
