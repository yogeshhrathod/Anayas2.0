/**
 * Sentry Error Tracking & Monitoring Configuration
 *
 * This module initializes Sentry for comprehensive error tracking, performance
 * monitoring, and usage analytics in the Electron main process.
 *
 * Configuration:
 * - In development: Sentry is DISABLED to avoid polluting production data
 * - In production: Sentry is ENABLED using DSN from environment variables
 * - User can disable telemetry in Settings → Privacy & Data
 *
 * GitHub Secrets Required:
 * - SENTRY_DSN: Your Sentry DSN (e.g., https://xxx@xxx.ingest.sentry.io/xxx)
 */

import * as Sentry from '@sentry/electron/main';
import crypto from 'crypto';
import { app } from 'electron';
import os from 'os';
import { createLogger } from './services/logger';

const logger = createLogger('sentry');

// Check if we're in development mode
const isDev =
  process.env.NODE_ENV === 'development' ||
  process.env.VITE_DEV_SERVER_URL !== undefined ||
  process.env.DEV === 'true';

// Get Sentry DSN from environment variable (set via GitHub secrets in CI/CD)
const SENTRY_DSN = process.env.SENTRY_DSN;

// Track if Sentry is initialized and enabled
let sentryInitialized = false;
// Globals for telemetry
let telemetryEnabled = true;
let hasCheckedTelemetry = false;

/**
 * Update telemetry state from DB once it's available
 */
export async function updateTelemetryState(): Promise<void> {
  try {
    const { getDatabase } = await import('./database');
    const db = getDatabase();
    if (db.settings && db.settings.telemetryEnabled !== undefined) {
      telemetryEnabled = db.settings.telemetryEnabled !== false;
    }
    hasCheckedTelemetry = true;
  } catch (error) {
    logger.warn('[Sentry] Could not read telemetry setting, defaulting to enabled');
    hasCheckedTelemetry = true;
  }
}

/**
 * Initialize Sentry for the main process
 * MUST be called SYNCHRONOUSLY before app.whenReady() because @sentry/electron
 * needs to register the sentry-ipc:// protocol privileges.
 */
export function initSentry(): void {
  // Skip Sentry in development mode
  if (isDev) {
    logger.info('[Sentry] Development mode - Sentry tracking disabled');
    return;
  }

  // Skip if no DSN configured
  if (!SENTRY_DSN) {
    logger.warn('[Sentry] No SENTRY_DSN configured - Sentry tracking disabled');
    return;
  }

  // Kick off asynchronous check, defaults to true while loading
  updateTelemetryState();

  try {
    Sentry.init({
      dsn: SENTRY_DSN,

      // Release tracking - ties errors to specific versions
      release: `luna@${app.getVersion()}`,

      // Environment tagging
      environment: 'production',

      // Enable all performance monitoring features
      tracesSampleRate: 0.2, // Capture 20% of transactions

      // Capture breadcrumbs for better context
      maxBreadcrumbs: 100,

      // Enable sending of default PII
      sendDefaultPii: false,

      // Drop events if telemetry is disabled by the user
      beforeSend(event, hint) {
        if (hasCheckedTelemetry && !telemetryEnabled) {
          return null;
        }

        // You can filter out certain errors here
        const error = hint.originalException;

        // Don't send expected errors (like user cancellations)
        if (error instanceof Error) {
          if (
            error.message.includes('cancelled') ||
            error.message.includes('user abort')
          ) {
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
      beforeSendTransaction(event) {
        if (hasCheckedTelemetry && !telemetryEnabled) {
          return null;
        }
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

    sentryInitialized = true;
    logger.info('[Sentry] Initialized successfully for production');
  } catch (error) {
    logger.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Update telemetry enabled state (called when user changes setting)
 */
export function setTelemetryEnabled(enabled: boolean): void {
  telemetryEnabled = enabled;
  logger.info(`[Sentry] Telemetry ${enabled ? 'enabled' : 'disabled'} by user`);

  if (!enabled && sentryInitialized) {
    // Close Sentry when user disables telemetry
    Sentry.close();
    sentryInitialized = false;
  }
}

/**
 * Check if telemetry is currently enabled
 */
export function isTelemetryCurrentlyEnabled(): boolean {
  return telemetryEnabled && !isDev;
}

/**
 * Generate or retrieve an anonymous user ID for session tracking
 * Stored locally, not linked to any personal information
 */
function getAnonymousUserId(): string {
  try {
    // Dynamically import to get data from initialized database
    // This is called after initDatabase in main.ts
    const { getDatabase } = require('./database');
    const db = getDatabase();
    if (db.settings && db.settings.telemetryId) {
      return db.settings.telemetryId;
    }

    // Fallback if not found in DB yet
    const machineId = `${os.hostname()}-${os.userInfo().username}-${os.platform()}`;
    return crypto
      .createHash('sha256')
      .update(machineId)
      .digest('hex')
      .substring(0, 16);
  } catch {
    // Fallback if anything fails
    return `anon-${Date.now()}`;
  }
}

/**
 * Check if Sentry should be active (initialized + telemetry enabled)
 */
function isSentryActive(): boolean {
  return sentryInitialized && telemetryEnabled && !isDev;
}

/**
 * Capture a custom error with context
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (!isSentryActive()) {
    if (isDev) logger.error('[Sentry Dev]', { error, context });
    return;
  }

  Sentry.withScope(scope => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a custom message for tracking
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (!isSentryActive()) {
    if (isDev) logger.info(`[Sentry Dev ${level}]`, message);
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
  if (!isSentryActive()) return;

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
export function trackFeatureUsage(
  feature: string,
  data?: Record<string, unknown>
): void {
  addBreadcrumb('feature', `User used: ${feature}`, data);
}

/**
 * Track performance of an operation
 */
export function trackPerformance(
  name: string,
  durationMs: number,
  data?: Record<string, unknown>
): void {
  if (!isSentryActive()) return;

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
  if (!isSentryActive()) return;

  Sentry.setUser({ id: userId });
}

/**
 * Flush all pending events before app closes
 */
export async function flushSentry(): Promise<void> {
  if (!isSentryActive()) return;

  await Sentry.flush(2000);
}
