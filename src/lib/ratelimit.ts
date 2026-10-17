// Rate limiting middleware for Cloudflare Workers
// Uses in-memory store with automatic cleanup
import { Errors } from './response';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory rate limit store (per worker instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    keyPrefix?: string;    // Key prefix for different endpoints
}

/**
 * Default configurations for different endpoint types
 */
export const RATE_LIMITS = {
    // Auth endpoints
    auth: {
        windowMs: 30 * 1000, // 30 seconds
        maxRequests: 10,
        keyPrefix: 'auth'
    },
    // AI generation (expensive operations)
    ai: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10,
        keyPrefix: 'ai'
    },
    // General API
    api: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 120,         // Increased for admin panel
        keyPrefix: 'api'
    },
    // Read operations
    read: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 300,         // Increased for admin panel data loading
        keyPrefix: 'read'
    }
};

/**
 * Reset all rate limits (for testing)
 */
export function resetRateLimits(): void {
    rateLimitStore.clear();
}

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
    // Cloudflare provides CF-Connecting-IP header
    const cfIP = request.headers.get('CF-Connecting-IP');
    if (cfIP) return cfIP;

    // Fallback to X-Forwarded-For
    const forwarded = request.headers.get('X-Forwarded-For');
    if (forwarded) return forwarded.split(',')[0].trim();

    // Fallback to X-Real-IP
    const realIP = request.headers.get('X-Real-IP');
    if (realIP) return realIP;

    // Default fallback
    return 'unknown';
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Check rate limit for a given key
 * Returns: { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
    ip: string,
    config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; retryAfter: number } {
    const key = `${config.keyPrefix || 'default'}:${ip}`;
    const now = Date.now();

    // Cleanup occasionally (1% chance per request)
    if (Math.random() < 0.01) {
        cleanupExpiredEntries();
    }

    let entry = rateLimitStore.get(key);

    // If no entry or expired, create new one
    if (!entry || now > entry.resetTime) {
        entry = {
            count: 1,
            resetTime: now + config.windowMs
        };
        rateLimitStore.set(key, entry);
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: entry.resetTime,
            retryAfter: 0
        };
    }

    // Increment count
    entry.count++;

    // Check if over limit
    if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter
        };
    }

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
        retryAfter: 0
    };
}

/**
 * Rate limit middleware factory for Hono
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
    return async (c: any, next: () => Promise<void>) => {
        // Batas berlaku seragam untuk semua peran (termasuk admin/operator):
        // akun istimewa yang dikompromikan tetap harus dibatasi, dan pemeriksaan
        // sesi di sini menambah 1 query DB di setiap request.
        // Kunci per-user bila sesi sudah terisi, fallback ke IP.
        let key = `ip:${getClientIP(c.req.raw)}`;
        try {
            const user = c.get?.('user');
            if (user?.id) key = `user:${user.id}`;
        } catch (_) {
            // Abaikan dan tetap gunakan kunci IP.
        }
        const result = checkRateLimit(key, config);

        // Set rate limit headers
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', result.remaining.toString());
        c.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

        if (!result.allowed) {
            return Errors.rateLimited(c, result.retryAfter);
        }

        await next();
    };
}

/**
 * Simple rate limit check (for use inside route handlers)
 */
export function isRateLimited(request: Request, config: RateLimitConfig): boolean {
    const ip = getClientIP(request);
    const result = checkRateLimit(ip, config);
    return !result.allowed;
}
