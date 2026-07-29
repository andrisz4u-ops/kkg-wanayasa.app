import { CloudflareClient, getDefaultIntegrations } from '@sentry/cloudflare';
import * as SentryCore from '@sentry/core';

// Initialize Sentry for Cloudflare Workers
export const initSentry = (env: any) => {
  const dsn = env.SENTRY_DSN;
  
  if (!dsn) {
    return null;
  }

  try {
    const client = new CloudflareClient({
      dsn,
      environment: env.ENVIRONMENT || 'production',
      release: env.CF_PAGES_COMMIT_SHA || 'unknown',
      // Performance monitoring
      tracesSampleRate: 0.1, // Sample 10% of transactions
      // Error sampling
      sampleRate: 1.0, // Capture all errors
      // Cloudflare Workers specific integrations
      integrations: getDefaultIntegrations({}),
      // Don't send PII
      sendDefaultPii: false,
      // Before send hook to filter sensitive data
      beforeSend: (event) => {
        // Filter out sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['cookie'];
          delete event.request.headers['authorization'];
          delete event.request.headers['x-csrf-token'];
        }
        
        // Filter sensitive query params
        if (event.request?.query_string) {
          const sensitiveParams = ['password', 'token', 'key', 'secret'];
          sensitiveParams.forEach(param => {
            if (event.request?.query_string?.includes(param)) {
              event.request.query_string = '[Filtered]';
            }
          });
        }
        
        return event;
      }
    });

    // Make Sentry Core use our client
    SentryCore.setCurrentClient(client);
    client.init();

    return client;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    return null;
  }
};

// Capture error helper
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (context) {
    SentryCore.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      SentryCore.captureException(error);
    });
  } else {
    SentryCore.captureException(error);
  }
};

// Capture message helper
export const captureMessage = (message: string, level: SentryCore.SeverityLevel = 'info') => {
  SentryCore.captureMessage(message, level);
};

// Set user context
export const setUserContext = (userId: string, email?: string, role?: string) => {
  SentryCore.setUser({
    id: userId,
    email,
    role
  });
};

// Clear user context
export const clearUserContext = () => {
  SentryCore.setUser(null);
};

// Export Sentry Core functions for use in other modules
export { SentryCore };
