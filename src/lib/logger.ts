/**
 * Renderer-side logger that forwards logs to the main process via IPC.
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    window.electronAPI.logger.info(message, ...args);
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Renderer] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    window.electronAPI.logger.error(message, ...args);
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Renderer] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    window.electronAPI.logger.warn(message, ...args);
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Renderer] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    window.electronAPI.logger.debug(message, ...args);
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Renderer] ${message}`, ...args);
    }
  },
};

export default logger;
