/**
 * Sentry Configuration for Renderer Process (React Frontend)
 *
 * This module initializes Sentry for the Electron renderer process,
 * providing error tracking and performance monitoring for the React UI.
 *
 * In development: Disabled to keep console clean
 * In production: Enabled for comprehensive error tracking (unless user opts out)
 */

import * as Sentry from '@sentry/electron/renderer';

// Check if we're in development mode (Vite injects these at build time)
const isDev =
  (import.meta as any).env?.DEV ||
  (import.meta as any).env?.MODE === 'development';

// Get Sentry DSN from environment variable (Vite injects at build time)
const SENTRY_DSN = (import.meta as any).env?.VITE_SENTRY_DSN;

// Track telemetry state
let sentryInitialized = false;
let telemetryEnabled = true;

/**
 * Check if telemetry is enabled from store/localStorage
 */
function checkTelemetryEnabled(): boolean {
  try {
    // Check localStorage for cached settings (zustand persist)
    const stored = localStorage.getItem('luna-store');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.settings?.telemetryEnabled !== undefined) {
        return parsed.state.settings.telemetryEnabled !== false;
      }
    }
    // Default to enabled
    return true;
  } catch {
    return true;
  }
}

/**
 * Initialize Sentry for the renderer process
 * Should be called early in the app initialization (before React renders)
 */
export async function initSentryRenderer(): Promise<void> {
  // Skip Sentry in development mode
  if (isDev) {
    console.log('[Sentry Renderer] Development mode - tracking disabled');
    return;
  }

  // Skip if no DSN configured
  if (!SENTRY_DSN) {
    console.warn(
      '[Sentry Renderer] No VITE_SENTRY_DSN configured - tracking disabled'
    );
    return;
  }

  // Check if user has disabled telemetry
  telemetryEnabled = checkTelemetryEnabled();
  if (!telemetryEnabled) {
    console.log(
      '[Sentry Renderer] User has disabled telemetry - tracking disabled'
    );
    return;
  }

  try {
    const appVersion = await window.electronAPI.app
      .getVersion()
      .catch(() => '0.0.1');

    Sentry.init({
      dsn: SENTRY_DSN,

      // Release tracking
      release: `luna@${appVersion}`,

      // Environment
      environment: isDev ? 'development' : 'production',

      // Performance monitoring
      tracesSampleRate: 1.0,

      // Breadcrumbs for context
      maxBreadcrumbs: 100,

      // No PII by default
      sendDefaultPii: false,

      // Stack traces on all messages
      attachStacktrace: true,

      // React-specific integrations
      integrations: [
        // Capture React component errors
        Sentry.browserTracingIntegration(),

        // Capture React error boundaries (replay for context)
        Sentry.replayIntegration({
          // Mask all text for privacy
          maskAllText: true,
          // Block media elements
          blockAllMedia: true,
        }),
      ],

      // Replay sample rates
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Filter events before sending
      beforeSend(event, hint) {
        // Check if telemetry is still enabled
        if (!telemetryEnabled) {
          return null;
        }

        const error = hint.originalException;

        // Filter out common non-actionable errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();

          // Network errors that are usually user's connection issues
          if (
            message.includes('network error') ||
            message.includes('failed to fetch') ||
            message.includes('load failed')
          ) {
            return null;
          }

          // User-initiated cancellations
          if (message.includes('aborted') || message.includes('cancelled')) {
            return null;
          }
        }

        return event;
      },

      // Filter breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // Don't log XHR/fetch to avoid noise
        if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
          // Only keep failed requests
          if (
            breadcrumb.data?.status_code &&
            breadcrumb.data.status_code < 400
          ) {
            return null;
          }
        }
        return breadcrumb;
      },
    });

    sentryInitialized = true;
    console.log('[Sentry Renderer] Initialized successfully for production');
  } catch (error) {
    console.error('[Sentry Renderer] Failed to initialize:', error);
  }
}

/**
 * Update telemetry enabled state (called when user changes setting)
 */
export function setRendererTelemetryEnabled(enabled: boolean): void {
  telemetryEnabled = enabled;
  console.log(
    `[Sentry Renderer] Telemetry ${enabled ? 'enabled' : 'disabled'} by user`
  );

  // When disabled, we just set the flag - the beforeSend hook will prevent events from being sent
  // Note: Sentry SDK doesn't have a close() method in renderer, so we rely on beforeSend filtering
  if (!enabled) {
    sentryInitialized = false;
  }
}

/**
 * Check if Sentry is active
 */
function isSentryActive(): boolean {
  return sentryInitialized && telemetryEnabled && !isDev;
}

/**
 * Set React Error Boundary handler
 * Call this to capture React component errors
 */
export function captureReactError(
  error: Error,
  errorInfo: { componentStack?: string }
): void {
  if (!isSentryActive()) {
    if (isDev) console.error('[Sentry Dev] React Error:', error, errorInfo);
    return;
  }

  Sentry.withScope(scope => {
    scope.setExtras({
      componentStack: errorInfo.componentStack,
    });
    Sentry.captureException(error);
  });
}

/**
 * Track user action for analytics
 */
export function trackUserAction(
  action: string,
  data?: Record<string, unknown>
): void {
  if (!isSentryActive()) {
    if (isDev) console.log(`[Sentry Dev] User action: ${action}`, data);
    return;
  }

  Sentry.addBreadcrumb({
    category: 'user-action',
    message: action,
    data,
    level: 'info',
  });
}

/**
 * Track page navigation
 */
export function trackPageNavigation(page: string): void {
  if (!isSentryActive()) return;

  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${page}`,
    level: 'info',
  });
}

/**
 * Track API request for debugging
 */
export function trackApiRequest(
  method: string,
  url: string,
  status?: number,
  duration?: number
): void {
  if (!isSentryActive()) return;

  Sentry.addBreadcrumb({
    category: 'api',
    message: `${method} ${url}`,
    data: { status, duration_ms: duration },
    level: status && status >= 400 ? 'error' : 'info',
  });
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
 * Capture a message
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

// Export Sentry for advanced usage
export { Sentry };
