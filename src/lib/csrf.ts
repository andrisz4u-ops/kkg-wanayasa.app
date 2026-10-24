// CSRF Protection Middleware
// Uses double-submit cookie pattern

import { generateCSRFToken, getCookie } from './auth';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

// Exact pre-auth endpoints only. Multipart, exports, logout and maintenance
// use the same token rule as other state-changing requests.
const CSRF_IGNORE_PATHS = new Set([
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
]);

/**
 * Generate and set CSRF token cookie
 */
export function setCSRFCookie(c: any): string {
    const token = generateCSRFToken();
    c.header(
        'Set-Cookie',
        `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Lax; Max-Age=${CSRF_EXPIRY_SECONDS}${new URL(c.req.url).protocol === 'https:' ? '; Secure' : ''}`,
        { append: true }
    );
    return token;
}

/**
 * Check if a path should be ignored for CSRF validation
 */
function shouldIgnorePath(path: string): boolean {
    return CSRF_IGNORE_PATHS.has(path);
}

/**
 * CSRF protection middleware for Hono
 * Should be applied to all state-changing routes (POST, PUT, DELETE, PATCH)
 */
export function csrfMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
        const method = c.req.method.toUpperCase();
        const path = new URL(c.req.url).pathname;

        // Skip for safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            await next();
            return;
        }

        // Skip for ignored paths (auth endpoints, etc.)
        if (shouldIgnorePath(path)) {
            await next();
            return;
        }

        // Get token from cookie (Hono normalizes header names to lower-case on iteration,
        // but c.req.header() is case-insensitive via Headers.get)
        const cookieHeader = c.req.header('Cookie') ?? c.req.header('cookie');
        const cookieToken = getCookie(cookieHeader, CSRF_COOKIE_NAME);

        // Get token from header (case-insensitive)
        const headerToken = c.req.header(CSRF_HEADER_NAME) ?? c.req.header(CSRF_HEADER_NAME.toLowerCase());

        // Validate tokens exist and match
        if (!cookieToken || !headerToken) {
            return c.json({
                success: false,
                error: {
                    message: 'CSRF token tidak ditemukan',
                    code: 'CSRF_MISSING'
                }
            }, 403);
        }

        if (cookieToken !== headerToken) {
            return c.json({
                success: false,
                error: {
                    message: 'CSRF token tidak valid',
                    code: 'CSRF_INVALID'
                }
            }, 403);
        }

        await next();
    };
}

/**
 * Get or create CSRF token
 */
export function getOrCreateCSRFToken(c: any): string {
    const cookieHeader = c.req.header('Cookie');
    const existingToken = getCookie(cookieHeader, CSRF_COOKIE_NAME);

    if (existingToken) {
        return existingToken;
    }

    return setCSRFCookie(c);
}
