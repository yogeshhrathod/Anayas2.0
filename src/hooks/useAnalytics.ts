/**
 * Analytics & Usage Tracking Hooks
 *
 * Provides React hooks for tracking user actions, page views, and feature usage.
 * All tracking is sent to Sentry for analysis (disabled in development).
 */

import { useCallback, useEffect, useRef } from 'react';
import {
    captureMessage,
    trackApiRequest,
    trackPageNavigation,
    trackUserAction,
} from '../lib/sentry-renderer';

/**
 * Track page/view changes
 * Automatically logs when the component mounts
 */
export function usePageTracking(pageName: string): void {
  useEffect(() => {
    trackPageNavigation(pageName);
  }, [pageName]);
}

/**
 * Track feature usage with automatic timing
 * Returns a function to call when the feature is used
 */
export function useFeatureTracking(featureName: string) {
  const startTimeRef = useRef<number>(0);

  const startTracking = useCallback(() => {
    startTimeRef.current = performance.now();
    trackUserAction(`${featureName}_started`);
  }, [featureName]);

  const endTracking = useCallback(
    (success: boolean = true, data?: Record<string, unknown>) => {
      const duration = startTimeRef.current
        ? Math.round(performance.now() - startTimeRef.current)
        : undefined;

      trackUserAction(`${featureName}_${success ? 'completed' : 'failed'}`, {
        ...data,
        duration_ms: duration,
      });
    },
    [featureName]
  );

  return { startTracking, endTracking };
}

/**
 * Track API request lifecycle
 * Wraps a fetch/request function with automatic tracking
 */
export function useApiTracking() {
  const trackRequest = useCallback(
    async <T>(
      method: string,
      url: string,
      requestFn: () => Promise<T>
    ): Promise<T> => {
      const startTime = performance.now();

      try {
        const result = await requestFn();
        const duration = Math.round(performance.now() - startTime);
        trackApiRequest(method, url, 200, duration);
        return result;
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        trackApiRequest(method, url, 500, duration);
        throw error;
      }
    },
    []
  );

  return { trackRequest };
}

/**
 * Track user engagement metrics
 * Call specific functions when users perform actions
 */
export function useEngagementTracking() {
  const trackClick = useCallback(
    (element: string, data?: Record<string, unknown>) => {
      trackUserAction('click', { element, ...data });
    },
    []
  );

  const trackInput = useCallback(
    (field: string, data?: Record<string, unknown>) => {
      trackUserAction('input', { field, ...data });
    },
    []
  );

  const trackSubmit = useCallback(
    (form: string, success: boolean, data?: Record<string, unknown>) => {
      trackUserAction('form_submit', { form, success, ...data });
    },
    []
  );

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackUserAction('search', {
      query_length: query.length,
      results_count: resultsCount,
    });
  }, []);

  return { trackClick, trackInput, trackSubmit, trackSearch };
}

/**
 * Track session metrics
 * Records session start/end and duration
 */
export function useSessionTracking() {
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    // Track session start
    trackUserAction('session_start', {
      timestamp: sessionStartRef.current,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
    });

    // Track session end on unmount/page close
    const handleUnload = () => {
      const duration = Math.round(
        (Date.now() - sessionStartRef.current) / 1000
      );
      trackUserAction('session_end', {
        duration_seconds: duration,
      });
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);
}

/**
 * Track error occurrences that aren't caught by ErrorBoundary
 */
export function useErrorTracking() {
  const trackError = useCallback((error: Error, context?: string) => {
    captureMessage(
      `Error in ${context || 'unknown'}: ${error.message}`,
      'error'
    );
  }, []);

  const trackWarning = useCallback((message: string, context?: string) => {
    captureMessage(`Warning in ${context || 'unknown'}: ${message}`, 'warning');
  }, []);

  return { trackError, trackWarning };
}

/**
 * Track request builder usage (specific to Luna_)
 */
export function useRequestBuilderTracking() {
  const trackMethodChange = useCallback((method: string) => {
    trackUserAction('request_method_change', { method });
  }, []);

  const trackUrlInput = useCallback((hasUrl: boolean) => {
    trackUserAction('request_url_input', { has_url: hasUrl });
  }, []);

  const trackHeadersCount = useCallback((count: number) => {
    trackUserAction('request_headers', { count });
  }, []);

  const trackBodyType = useCallback((type: string) => {
    trackUserAction('request_body_type', { type });
  }, []);

  const trackAuthType = useCallback((type: string) => {
    trackUserAction('request_auth_type', { type });
  }, []);

  const trackRequestSent = useCallback(
    (method: string, status?: number, duration?: number) => {
      trackUserAction('request_sent', {
        method,
        status,
        duration_ms: duration,
        success: status ? status < 400 : undefined,
      });
    },
    []
  );

  return {
    trackMethodChange,
    trackUrlInput,
    trackHeadersCount,
    trackBodyType,
    trackAuthType,
    trackRequestSent,
  };
}

/**
 * Track collection and folder operations
 */
export function useCollectionTracking() {
  const trackCollectionCreate = useCallback(() => {
    trackUserAction('collection_create');
  }, []);

  const trackCollectionDelete = useCallback(() => {
    trackUserAction('collection_delete');
  }, []);

  const trackFolderCreate = useCallback(() => {
    trackUserAction('folder_create');
  }, []);

  const trackRequestSave = useCallback((isNew: boolean) => {
    trackUserAction('request_save', { is_new: isNew });
  }, []);

  const trackImport = useCallback((format: string, itemCount: number) => {
    trackUserAction('import', { format, item_count: itemCount });
  }, []);

  const trackExport = useCallback((format: string, itemCount: number) => {
    trackUserAction('export', { format, item_count: itemCount });
  }, []);

  return {
    trackCollectionCreate,
    trackCollectionDelete,
    trackFolderCreate,
    trackRequestSave,
    trackImport,
    trackExport,
  };
}
