import winston from 'winston';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

const logsDir = path.join(app.getPath('userData'), 'logs');
fs.mkdirSync(logsDir, { recursive: true });

export function createLogger(module: string) {
  // Use 'debug' in development, 'info' in production
  const logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
  
  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { module },
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 2097152, // 2MB (reduced from 5MB)
        maxFiles: 3, // Keep only 3 files (reduced from 5)
        tailable: true, // Write to end of file
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 3145728, // 3MB (reduced from 5MB)
        maxFiles: 3, // Keep only 3 files (reduced from 5)
        tailable: true,
      }),
      // Only log to console in development
      ...(process.env.NODE_ENV === 'development' ? [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })
      ] : []),
    ],
  });
}
