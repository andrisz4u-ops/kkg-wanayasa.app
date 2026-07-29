# Code Review Report - KKG Portal

## Executive Summary

**Date**: 18 Februari 2026  
**Scope**: Full codebase review with focus on security, performance, and maintainability  
**Overall Score**: 7.5/10

---

## 1. SECURITY ISSUES

### 1.1 API Keys Storage (HIGH)

**Location**: `src/routes/admin.ts:245-247`

```typescript
// Handle API key separately (only if not masked)
if (validatedData.mistral_api_key && !validatedData.mistral_api_key.includes('****')) {
    updates.push({ key: 'mistral_api_key', value: validatedData.mistral_api_key });
}
```

**Issue**: API keys stored in plain text in database.

**Fix**: Use encryption from `src/lib/crypto.ts`:
```typescript
import { encrypt, decrypt } from '../lib/crypto';

// When saving
const encrypted = await encrypt(validatedData.mistral_api_key, c.env);
updates.push({ key: 'mistral_api_key', value: encrypted });

// When reading
const decrypted = await decrypt(settings.mistral_api_key, c.env);
```

---

### 1.2 Missing Password Reset Token Table (HIGH)

**Location**: `src/routes/auth.ts:398-405`

```typescript
await c.env.DB.prepare(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
).bind(user.id, token, expiresAt).run();
```

**Issue**: Table `password_reset_tokens` doesn't exist in migrations.

**Fix**: Add migration file `0012_password_reset_tokens.sql`:
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
```

---

### 1.3 Error Stack Trace Exposure (MEDIUM)

**Location**: `src/routes/auth.ts:129-136`

```typescript
return c.json({
    success: false,
    error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Login system error: ' + (e.message || 'Unknown error'),
        details: e.stack // SECURITY RISK: Exposes stack trace
    }
}, 500);
```

**Issue**: Stack trace exposed to client in production.

**Fix**: Remove stack trace in production:
```typescript
const isDev = c.env.ENVIRONMENT !== 'production';
return c.json({
    success: false,
    error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Login gagal. Silakan coba lagi.',
        ...(isDev && { details: e.stack })
    }
}, 500);
```

---

### 1.4 Session Not Refreshed (MEDIUM)

**Location**: `src/lib/auth.ts:147-158`

**Issue**: Session expiry is fixed at 7 days with no sliding window.

**Fix**: Implement session refresh on activity:
```typescript
export async function refreshSession(db: D1Database, sessionId: string): Promise<void> {
    const newExpiry = getSessionExpiry();
    await db.prepare(
        'UPDATE sessions SET expires_at = ? WHERE id = ?'
    ).bind(newExpiry, sessionId).run();
}
```

---

## 2. PERFORMANCE ISSUES

### 2.1 N+1 Query Pattern (MEDIUM)

**Location**: `src/routes/admin.ts` - Dashboard stats

```typescript
const [guru, surat, proker, kegiatan, materi, pengumuman, threads, ...] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM surat_undangan').first(),
    // ... more queries
]);
```

**Issue**: Multiple separate queries instead of a single optimized query.

**Fix**: Consider combining into a single query or using a materialized view for stats.

---

### 2.2 Missing Database Indexes (MEDIUM)

**Location**: `migrations/0001_initial_schema.sql`

Missing indexes on frequently queried columns:
- `users.sekolah` (for filtering by school)
- `kegiatan.tanggal` (for date range queries)
- `materi.uploaded_by` (for user's uploads)

**Fix**: Add migration:
```sql
CREATE INDEX IF NOT EXISTS idx_users_sekolah ON users(sekolah);
CREATE INDEX IF NOT EXISTS idx_kegiatan_tanggal ON kegiatan(tanggal);
CREATE INDEX IF NOT EXISTS idx_materi_uploader ON materi(uploaded_by);
```

---

### 2.3 No Response Caching (LOW)

**Location**: All route handlers

**Issue**: No caching for public read-only data.

**Fix**: Use cache middleware from `src/lib/cache.ts`:
```typescript
import { cacheMiddleware, CACHE_CONFIGS } from '../lib/cache';

surat.get('/history', cacheMiddleware(CACHE_CONFIGS.settings), async (c) => {
    // ...
});
```

---

## 3. CODE QUALITY ISSUES

### 3.1 Inconsistent Error Handling (MEDIUM)

**Location**: Multiple files

**Issue**: Mix of try/catch patterns and error responses.

Example from `src/routes/surat.ts:117-132`:
```typescript
try {
    isiSurat = await callMistral(apiKey, prompt);
    logger.ai('generate_surat', true, Date.now() - startTime, { userId: user.id });
} catch (aiError: any) {
    logger.ai('generate_surat', false, Date.now() - startTime, {
        userId: user.id,
        error: aiError.message
    });
    return c.json({
        success: false,
        error: {
            code: ErrorCodes.AI_ERROR,
            message: 'Gagal menghasilkan surat. Silakan coba lagi.',
        }
    }, 500);
}
```

**Recommendation**: Create a standardized error handler:
```typescript
// src/lib/errors.ts
export function handleRouteError(c: any, error: any, context: string) {
    logger.error(context, error);
    
    if (error instanceof ValidationError) {
        return Errors.validation(c, error.message);
    }
    if (error instanceof AIError) {
        return c.json({
            success: false,
            error: { code: ErrorCodes.AI_ERROR, message: error.userMessage }
        }, 500);
    }
    
    return Errors.internal(c);
}
```

---

### 3.2 Magic Numbers (LOW)

**Location**: `src/lib/ratelimit.ts`

```typescript
export const RATE_LIMITS = {
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    api: { windowMs: 60 * 1000, maxRequests: 120 },
    // ...
};
```

**Issue**: Numbers without explanation.

**Fix**: Add comments or extract to config:
```typescript
export const RATE_LIMITS = {
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,            // 5 login attempts per window
        keyPrefix: 'auth'
    },
    // ...
};
```

---

### 3.3 Long Prompts in Code (LOW)

**Location**: `src/lib/mistral.ts:88-475`

**Issue**: 400+ line prompt string embedded in code.

**Recommendation**: Extract prompts to separate files:
```
src/prompts/
├── surat.ts
├── proker.ts
├── laporan.ts
└── rpp.ts
```

---

## 4. MISSING FEATURES

### 4.1 No Brute Force Protection

**Issue**: No account lockout after failed login attempts.

**Fix**: Implement lockout:
```typescript
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

async function checkLockout(db: D1Database, email: string): Promise<boolean> {
    const result = await db.prepare(`
        SELECT failed_attempts, locked_until FROM users 
        WHERE email = ?
    `).bind(email).first();
    
    if (!result) return false;
    if (result.locked_until && new Date(result.locked_until) > new Date()) {
        return true; // Still locked
    }
    return false;
}
```

---

### 4.2 No Audit Log for Sensitive Operations

**Issue**: Password changes, role changes not consistently logged.

**Fix**: Add audit logs to all sensitive operations.

---

### 4.3 No Request Validation Size Limit

**Issue**: No limit on request body size.

**Fix**: Add body size limit middleware:
```typescript
app.use('/api/*', async (c, next) => {
    const contentLength = c.req.header('Content-Length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
        return c.json({ error: 'Request too large' }, 413);
    }
    await next();
});
```

---

## 5. RECOMMENDATIONS SUMMARY

### High Priority (Fix Immediately)
| Issue | File | Line | Risk |
|-------|------|------|------|
| API keys plaintext | admin.ts | 245 | Data Breach |
| Missing reset tokens table | migrations | - | Feature Broken |
| Stack trace exposure | auth.ts | 134 | Info Leak |

### Medium Priority (Fix This Sprint)
| Issue | File | Line | Risk |
|-------|------|------|------|
| No brute force protection | auth.ts | - | Account Takeover |
| Session not refreshed | auth.ts | - | Session Hijack |
| Missing indexes | migrations | - | Performance |

### Low Priority (Technical Debt)
| Issue | File | Line | Risk |
|-------|------|------|------|
| No caching | routes/* | - | Performance |
| Long prompts | mistral.ts | 88 | Maintainability |
| Magic numbers | ratelimit.ts | 24 | Readability |

---

## 6. FILES MODIFIED/CREATED

### New Files Created
1. `src/lib/crypto.ts` - Encryption utilities
2. `src/lib/cache.ts` - Caching utilities
3. `src/lib/compression.ts` - Compression utilities
4. `public/static/js/lazy-load.js` - Lazy loading utilities
5. `docs/MODULE_ANALYSIS.md` - Module analysis
6. `docs/API_DOCUMENTATION.md` - API documentation

### Tests Added
1. `tests/crypto.test.ts` - Crypto utilities tests
2. `tests/ai.test.ts` - AI service tests
3. `tests/validation.test.ts` - Extended validation tests

---

## 7. NEXT STEPS

1. **Deploy migration** for password_reset_tokens table
2. **Enable encryption** for API keys (requires ENCRYPTION_KEY env var)
3. **Remove stack traces** from production error responses
4. **Implement brute force** protection for login
5. **Add database indexes** for performance

---

*Report generated by automated code review*
