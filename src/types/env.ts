/**
 * Centralized Environment Bindings
 * Single source of truth for all Cloudflare Workers environment bindings.
 * Import this type in route files instead of defining local Bindings types.
 */

import type { R2Bucket } from '../lib/upload';

export type AppBindings = {
    // ─── Core Services ───────────────────────────
    DB: D1Database;
    STORAGE?: R2Bucket;
    AI?: any;
    R2_PUBLIC_URL?: string;

    // ─── Security & Encryption ───────────────────
    ENCRYPTION_KEY?: string;
    SECRET_KEY?: string;

    // ─── Monitoring & Environment ────────────────
    SENTRY_DSN?: string;
    ENVIRONMENT?: string;
    CF_PAGES_COMMIT_SHA?: string;

    // ─── Legacy AI Keys (from env vars, now managed via DB providers) ──
    MISTRAL_API_KEY?: string;
    Z_AI_API_KEY?: string;
    GEMINI_API_KEY?: string;
    BEDROCK_API_KEY?: string;
    BEDROCK_REGION?: string;
    VERTEX_API_KEY?: string;
    AI_BACKEND_KEY?: string;

    // ─── External Services ───────────────────────
    SUPABASE_URL?: string;
    SUPABASE_KEY?: string;
    SUPABASE_BUCKET?: string;
    UNSPLASH_ACCESS_KEY?: string;
    UNSPLASH_SECRET_KEY?: string;
};

export type AppVariables = {
    user: any;
    sentry: any;
    requestId?: string;
};
