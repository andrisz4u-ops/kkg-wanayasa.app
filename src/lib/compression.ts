/**
 * Compression Middleware for Cloudflare Workers
 * Note: Cloudflare automatically applies Brotli/Gzip compression
 * This module provides additional optimization utilities
 */

/**
 * Response compression check
 * Cloudflare Workers automatically compress responses, but we can
 * hint at optimal compression levels through headers.
 */

/**
 * Add compression hints to response
 */
export function addCompressionHints(c: any): void {
    // Cloudflare will handle actual compression
    // These headers hint at our preferences
    c.header('X-Content-Encoding', 'br,gzip');
}

/**
 * Check if client accepts compression
 */
export function acceptsCompression(request: Request): 'br' | 'gzip' | 'none' {
    const acceptEncoding = request.headers.get('Accept-Encoding') || '';
    
    if (acceptEncoding.includes('br')) return 'br';
    if (acceptEncoding.includes('gzip')) return 'gzip';
    return 'none';
}

/**
 * Compress JSON response (for smaller payloads)
 * Note: This is manual compression for specific use cases
 * In most cases, Cloudflare's automatic compression is sufficient
 */
export async function compressJson(data: any): Promise<string> {
    // Minify JSON (remove whitespace)
    return JSON.stringify(data);
}

/**
 * ETag generation for cache validation
 */
export async function generateETag(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return `W/"${hex.substring(0, 16)}"`;
}

/**
 * Check if ETag matches (for conditional requests)
 */
export function checkETag(request: Request, etag: string): boolean {
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (!ifNoneMatch) return false;
    
    // Handle multiple ETags
    const etags = ifNoneMatch.split(',').map(e => e.trim());
    return etags.includes(etag) || etags.includes('*');
}

/**
 * Conditional response middleware
 * Returns 304 Not Modified if ETag matches
 */
export function conditionalResponse(content: string, c: any): boolean {
    const etag = generateETag(content);
    
    if (checkETag(c.req.raw, etag)) {
        c.status(304);
        return true;
    }
    
    c.header('ETag', etag);
    return false;
}

/**
 * Response size optimizer
 */
export function optimizeResponse(data: any, request: Request): {
    data: any;
    encoding: string;
    size: number;
} {
    const jsonStr = JSON.stringify(data);
    
    return {
        data: data,
        encoding: acceptsCompression(request),
        size: new Blob([jsonStr]).size
    };
}

/**
 * Chunk large responses for better streaming
 */
export async function* chunkResponse<T>(
    items: T[],
    chunkSize: number = 100
): AsyncGenerator<T[]> {
    for (let i = 0; i < items.length; i += chunkSize) {
        yield items.slice(i, i + chunkSize);
    }
}

/**
 * Response compression statistics
 */
export interface CompressionStats {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}

export function calculateCompressionStats(
    original: string,
    compressed: string
): CompressionStats {
    return {
        originalSize: new Blob([original]).size,
        compressedSize: new Blob([compressed]).size,
        compressionRatio: 
            (1 - (new Blob([compressed]).size / new Blob([original]).size)) * 100
    };
}
