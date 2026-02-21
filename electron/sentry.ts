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

// Check if we're in development mode
const isDev =
  process.env.NODE_ENV === 'development' ||
  process.env.VITE_DEV_SERVER_URL !== undefined ||
  process.env.DEV === 'true';

// Get Sentry DSN from environment variable (set via GitHub secrets in CI/CD)
const SENTRY_DSN = process.env.SENTRY_DSN;

// Track if Sentry is initialized and enabled
let sentryInitialized = false;
let telemetryEnabled = true; // Default to enabled

/**
 * Check if telemetry is enabled from settings database
 */
async function isTelemetryEnabled(): Promise<boolean> {
  try {
    // Dynamically import to avoid circular dependencies
    const { getDatabase } = await import('./database');
    const db = getDatabase();

    // Check settings for telemetryEnabled
    if (db.settings && db.settings.telemetryEnabled !== undefined) {
      return db.settings.telemetryEnabled !== false;
    }

    // Default to enabled if setting doesn't exist
    return true;
  } catch (error) {
    console.log(
      '[Sentry] Could not read telemetry setting, defaulting to enabled'
    );
    return true;
  }
}

/**
 * Initialize Sentry for the main process
 * Only enables tracking in production builds with valid DSN and user consent
 */
export async function initSentry(): Promise<void> {
  // Skip Sentry in development mode
  if (isDev) {
    console.log('[Sentry] Development mode - Sentry tracking disabled');
    return;
  }

  // Skip if no DSN configured
  if (!SENTRY_DSN) {
    console.warn(
      '[Sentry] No SENTRY_DSN configured - Sentry tracking disabled'
    );
    return;
  }

  // Check if user has disabled telemetry
  telemetryEnabled = await isTelemetryEnabled();
  if (!telemetryEnabled) {
    console.log(
      '[Sentry] User has disabled telemetry - Sentry tracking disabled'
    );
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
      tracesSampleRate: 0.2, // Capture 20% of transactions (reduced from 100% for privacy and billing)

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
        // Check if telemetry is still enabled (user might have disabled it after init)
        if (!telemetryEnabled) {
          return null; // Don't send if user has disabled telemetry
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
    console.log('[Sentry] Initialized successfully for production');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Update telemetry enabled state (called when user changes setting)
 */
export function setTelemetryEnabled(enabled: boolean): void {
  telemetryEnabled = enabled;
  console.log(`[Sentry] Telemetry ${enabled ? 'enabled' : 'disabled'} by user`);

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
    if (isDev) console.error('[Sentry Dev]', error, context);
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
    if (isDev) console.log(`[Sentry Dev ${level}]`, message);
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
