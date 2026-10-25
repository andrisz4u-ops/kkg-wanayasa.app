import { z } from 'zod';

const optionalText = z.preprocess(value => value === '' ? undefined : value, z.string().optional());
const optionalUrl = z.preprocess(value => value === '' ? undefined : value, z.string().url().optional());
const optionalKey = z.preprocess(value => value === '' ? undefined : value,
    z.string().refine(value => value.trim().length >= 16, 'Kunci enkripsi minimal 16 karakter non-spasi').optional());

const envSchema = z.object({
    ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('production'),
    REGION_PROFILE: z.enum(['purwakarta', 'custom']).optional(),
    APP_NAME: optionalText,
    APP_URL: optionalUrl,
    ENCRYPTION_KEY: optionalKey,
    SECRET_KEY: optionalKey,
    SENTRY_DSN: optionalUrl,
    CORS_ORIGINS: optionalText,
    CF_PAGES_COMMIT_SHA: optionalText,
    QR_SIGNING_SECRET: optionalText,
    R2_PUBLIC_URL: optionalUrl,
});

export type ValidatedEnv = z.infer<typeof envSchema>;
export type EnvValidationResult =
    | { ok: true; env: ValidatedEnv; warnings: string[] }
    | { ok: false; errors: string[]; warnings: string[] };

// The caller retains bindings and provider-specific fields. Never log values.
export function validateEnv(raw: Record<string, unknown>): EnvValidationResult {
    const result = envSchema.safeParse(raw);
    if (!result.success) {
        return { ok: false, errors: [...new Set(result.error.issues.map(issue => String(issue.path[0] || 'environment')))], warnings: [] };
    }
    const warnings: string[] = [];
    // Credential encryption is feature-scoped. Public pages, authentication and
    // storage must not fail merely because provider management is not configured.
    // encrypt()/decrypt() still fail closed at their actual operation boundary.
    if (!result.data.ENCRYPTION_KEY && !result.data.SECRET_KEY) warnings.push('Kunci enkripsi kredensial provider belum tersedia; operasi enkripsi dibatasi.');
    if (result.data.ENVIRONMENT !== 'development' && !result.data.SENTRY_DSN) warnings.push('SENTRY_DSN belum dikonfigurasi.');
    return { ok: true, env: result.data, warnings };
}

const reported = new Set<string>();
export function reportEnvIssue(message: string): void {
    if (!reported.has(message)) {
        reported.add(message);
        console.warn(`[ENV] ${message}`);
    }
}
