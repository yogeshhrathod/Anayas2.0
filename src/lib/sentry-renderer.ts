/**
 * Sentry Configuration for Renderer Process (React Frontend)
 * 
 * This module initializes Sentry for the Electron renderer process,
 * providing error tracking and performance monitoring for the React UI.
 * 
 * In development: Disabled to keep console clean
 * In production: Enabled for comprehensive error tracking
 */

import * as Sentry from '@sentry/electron/renderer';

// Check if we're in development mode
// @ts-expect-error - Vite injects import.meta.env
const isDev = import.meta.env?.DEV || 
              // @ts-expect-error - Vite injects import.meta.env
              import.meta.env?.MODE === 'development' ||
              process.env.NODE_ENV === 'development';

// Get Sentry DSN from environment variable
// @ts-expect-error - Vite injects import.meta.env
const SENTRY_DSN = import.meta.env?.VITE_SENTRY_DSN || process.env.VITE_SENTRY_DSN;

// @ts-expect-error - Vite injects import.meta.env
const APP_VERSION = import.meta.env?.VITE_APP_VERSION || '0.0.1';

/**
 * Initialize Sentry for the renderer process
 * Should be called early in the app initialization (before React renders)
 */
export function initSentryRenderer(): void {
  // Skip Sentry in development mode
  if (isDev) {
    console.log('[Sentry Renderer] Development mode - tracking disabled');
    return;
  }

  // Skip if no DSN configured
  if (!SENTRY_DSN) {
    console.warn('[Sentry Renderer] No VITE_SENTRY_DSN configured - tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,

      // Release tracking
      release: `luna@${APP_VERSION}`,

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
        const error = hint.originalException;

        // Filter out common non-actionable errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          
          // Network errors that are usually user's connection issues
          if (message.includes('network error') ||
              message.includes('failed to fetch') ||
              message.includes('load failed')) {
            return null;
          }

          // User-initiated cancellations
          if (message.includes('aborted') ||
              message.includes('cancelled')) {
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
          if (breadcrumb.data?.status_code && breadcrumb.data.status_code < 400) {
            return null;
          }
        }
        return breadcrumb;
      },
    });

    console.log('[Sentry Renderer] Initialized successfully for production');
  } catch (error) {
    console.error('[Sentry Renderer] Failed to initialize:', error);
  }
}

/**
 * Set React Error Boundary handler
 * Call this to capture React component errors
 */
export function captureReactError(error: Error, errorInfo: { componentStack?: string }): void {
  if (isDev) {
    console.error('[Sentry Dev] React Error:', error, errorInfo);
    return;
  }

  Sentry.withScope((scope) => {
    scope.setExtras({
      componentStack: errorInfo.componentStack,
    });
    Sentry.captureException(error);
  });
}

/**
 * Track user action for analytics
 */
export function trackUserAction(action: string, data?: Record<string, unknown>): void {
  if (isDev) {
    console.log(`[Sentry Dev] User action: ${action}`, data);
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
  if (isDev) return;

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
  if (isDev) return;

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
 * Capture a message
 */
export function captureMessage(
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (isDev) {
    console.log(`[Sentry Dev ${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

// Export Sentry for advanced usage
export { Sentry };
