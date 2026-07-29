/**
 * Caching Utilities for Cloudflare Workers
 * Implements cache strategies for API responses
 */

export interface CacheOptions {
    ttl: number;
    staleWhileRevalidate?: number;
    tags?: string[];
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    tags?: string[];
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * In-memory cache for edge workers
 * Note: This is per-worker instance, not shared across edge locations
 * For distributed caching, use Cloudflare KV or Durable Objects
 */
export class EdgeCache {
    private static instance: EdgeCache;
    private cache: Map<string, CacheEntry<any>>;
    private cleanupInterval: number = 60000; // 1 minute

    private constructor() {
        this.cache = new Map();
        this.startCleanup();
    }

    static getInstance(): EdgeCache {
        if (!EdgeCache.instance) {
            EdgeCache.instance = new EdgeCache();
        }
        return EdgeCache.instance;
    }

    /**
     * Get value from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now > entry.timestamp + entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set value in cache
     */
    set<T>(key: string, data: T, options: CacheOptions): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: options.ttl,
            tags: options.tags
        });
    }

    /**
     * Get or set cache value with stale-while-revalidate pattern
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions
    ): Promise<T> {
        const entry = this.cache.get(key);
        const now = Date.now();

        // Return cached if valid
        if (entry && now <= entry.timestamp + entry.ttl) {
            // Check if stale but within stale-while-revalidate window
            if (options.staleWhileRevalidate && 
                now > entry.timestamp + entry.ttl && 
                now <= entry.timestamp + entry.ttl + options.staleWhileRevalidate) {
                // Revalidate in background
                this.revalidate(key, fetcher, options);
            }
            return entry.data as T;
        }

        // Fetch fresh data
        const data = await fetcher();
        this.set(key, data, options);
        return data;
    }

    /**
     * Revalidate cache in background
     */
    private async revalidate<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions
    ): Promise<void> {
        try {
            const data = await fetcher();
            this.set(key, data, options);
        } catch (e) {
            console.error('Cache revalidation failed:', e);
        }
    }

    /**
     * Delete cache entry
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Invalidate cache by tags
     */
    invalidateTags(tags: string[]): number {
        let count = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags?.some(t => tags.includes(t))) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    stats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Start automatic cleanup of expired entries
     */
    private startCleanup(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.cache.entries()) {
                if (now > entry.timestamp + entry.ttl) {
                    this.cache.delete(key);
                }
            }
        }, this.cleanupInterval);
    }
}

/**
 * Cache key generator
 */
export function generateCacheKey(
    prefix: string,
    params: Record<string, any>
): string {
    const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}=${JSON.stringify(params[k])}`)
        .join('&');
    return `${prefix}:${sortedParams}`;
}

/**
 * Cache middleware for Hono
 */
export function cacheMiddleware(options: CacheOptions) {
    const cache = EdgeCache.getInstance();
    
    return async (c: any, next: () => Promise<void>) => {
        // Only cache GET requests
        if (c.req.method !== 'GET') {
            return next();
        }

        const key = generateCacheKey('api', {
            path: c.req.path,
            query: c.req.query()
        });

        const cached = cache.get(key);
        if (cached) {
            c.header('X-Cache', 'HIT');
            return c.json(cached);
        }

        await next();
        
        // Cache successful responses
        if (c.res.status === 200) {
            try {
                const body = await c.res.clone().json();
                cache.set(key, body, options);
                c.header('X-Cache', 'MISS');
            } catch (e) {
                // Not JSON, skip caching
            }
        }
    };
}

/**
 * Predefined cache configurations
 */
export const CACHE_CONFIGS = {
    settings: { ttl: 5 * 60 * 1000, staleWhileRevalidate: 60 * 1000 },      // 5 min
    guruList: { ttl: 2 * 60 * 1000, staleWhileRevalidate: 30 * 1000 },      // 2 min
    pengumuman: { ttl: 1 * 60 * 1000, staleWhileRevalidate: 30 * 1000 },    // 1 min
    forumThreads: { ttl: 30 * 1000, staleWhileRevalidate: 15 * 1000 },      // 30 sec
    dashboard: { ttl: 60 * 1000 },                                           // 1 min
    materiList: { ttl: 5 * 60 * 1000, staleWhileRevalidate: 60 * 1000 },    // 5 min
};
