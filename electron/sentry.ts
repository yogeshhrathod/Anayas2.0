/**
 * Sentry Error Tracking & Monitoring Configuration
 * 
 * This module initializes Sentry for comprehensive error tracking, performance
 * monitoring, and usage analytics in the Electron main process.
 * 
 * Configuration:
 * - In development: Sentry is DISABLED to avoid polluting production data
 * - In production: Sentry is ENABLED using DSN from environment variables
 * 
 * GitHub Secrets Required:
 * - SENTRY_DSN: Your Sentry DSN (e.g., https://xxx@xxx.ingest.sentry.io/xxx)
 */

import * as Sentry from '@sentry/electron/main';
import { app } from 'electron';

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.VITE_DEV_SERVER_URL !== undefined ||
              process.env.DEV === 'true';

// Get Sentry DSN from environment variable (set via GitHub secrets in CI/CD)
const SENTRY_DSN = process.env.SENTRY_DSN;

/**
 * Initialize Sentry for the main process
 * Only enables tracking in production builds with valid DSN
 */
export function initSentry(): void {
  // Skip Sentry in development mode
  if (isDev) {
    console.log('[Sentry] Development mode - Sentry tracking disabled');
    return;
  }

  // Skip if no DSN configured
  if (!SENTRY_DSN) {
    console.warn('[Sentry] No SENTRY_DSN configured - Sentry tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,

      // Release tracking - ties errors to specific versions
      release: `luna@${app.getVersion()}`,

      // Environment tagging
      environment: isDev ? 'development' : 'production',

      // Enable all performance monitoring features
      tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring

      // Capture breadcrumbs for better context
      // Records user actions, console logs, network requests leading to an error
      maxBreadcrumbs: 100,

      // Enable sending of default PII (Personally Identifiable Information)
      // Set to false if you want to strip user data
      sendDefaultPii: false,

      // Attach stack traces to all messages
      attachStacktrace: true,

      // Debug mode - enable only for troubleshooting Sentry itself
      debug: false,

      // Before send hook - allows filtering/modifying events
      beforeSend(event, hint) {
        // You can filter out certain errors here
        const error = hint.originalException;
        
        // Don't send expected errors (like user cancellations)
        if (error instanceof Error) {
          if (error.message.includes('cancelled') || 
              error.message.includes('user abort')) {
            return null; // Don't send this event
          }
        }

        // Add additional context
        event.tags = {
          ...event.tags,
          platform: process.platform,
          arch: process.arch,
          electron_version: process.versions.electron,
          node_version: process.versions.node,
          chrome_version: process.versions.chrome,
        };

        return event;
      },

      // Integrations for comprehensive tracking
      integrations: [
        // Capture unhandled promise rejections
        Sentry.onUnhandledRejectionIntegration(),
        
        // Capture console.error/warn messages
        Sentry.consoleIntegration(),
        
        // Capture HTTP request breadcrumbs
        Sentry.httpIntegration(),
        
        // Capture context (OS, runtime, etc.)
        Sentry.contextLinesIntegration(),
      ],
    });

    // Set initial user context (anonymous by default)
    Sentry.setUser({
      id: getAnonymousUserId(),
    });

    // Set global tags for all events
    Sentry.setTags({
      app_name: 'Luna',
      app_version: app.getVersion(),
    });

    console.log('[Sentry] Initialized successfully for production');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Generate or retrieve an anonymous user ID for session tracking
 * Stored locally, not linked to any personal information
 */
function getAnonymousUserId(): string {
  try {
    // Use a simple hash of machine info for anonymous tracking
    const crypto = require('crypto');
    const os = require('os');
    const machineId = `${os.hostname()}-${os.userInfo().username}-${os.platform()}`;
    return crypto.createHash('sha256').update(machineId).digest('hex').substring(0, 16);
  } catch {
    // Fallback if anything fails
    return `anon-${Date.now()}`;
  }
}

/**
 * Capture a custom error with context
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (isDev) {
    console.error('[Sentry Dev]', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a custom message for tracking
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (isDev) {
    console.log(`[Sentry Dev ${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(
  category: string, 
  message: string, 
  data?: Record<string, unknown>,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (isDev) return;

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track feature usage for analytics
 */
export function trackFeatureUsage(feature: string, data?: Record<string, unknown>): void {
  addBreadcrumb('feature', `User used: ${feature}`, data);
}

/**
 * Track performance of an operation
 */
export function trackPerformance(name: string, durationMs: number, data?: Record<string, unknown>): void {
  if (isDev) return;

  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${name} took ${durationMs}ms`,
    data: { ...data, duration_ms: durationMs },
    level: 'info',
  });
}

/**
 * Set user identifier for session tracking
 * Use this to track anonymous usage patterns
 */
export function setUserId(userId: string): void {
  if (isDev) return;
  
  Sentry.setUser({ id: userId });
}

/**
 * Flush all pending events before app closes
 */
export async function flushSentry(): Promise<void> {
  if (isDev) return;
  
  await Sentry.flush(2000);
}
