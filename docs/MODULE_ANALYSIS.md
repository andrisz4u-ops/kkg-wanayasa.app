# Analisis Mendalam Modul KKG Portal

## 1. MODUL AUTENTIKASI (Auth)

### Arsitektur
```
┌─────────────────────────────────────────────────────────────┐
│                     AUTH MODULE                              │
├─────────────────────────────────────────────────────────────┤
│  Routes (src/routes/auth.ts)                                │
│  ├── POST /login          → Login dengan email/password      │
│  ├── POST /register       → Registrasi user baru             │
│  ├── POST /logout         → Hapus session                    │
│  ├── GET  /me             → Get current user                 │
│  ├── POST /change-password→ Ubah password                    │
│  ├── POST /forgot-password→ Request reset token              │
│  ├── POST /reset-password → Reset dengan token               │
│  └── GET  /csrf-token     → Get CSRF token                   │
├─────────────────────────────────────────────────────────────┤
│  Library (src/lib/auth.ts)                                  │
│  ├── hashPassword()       → PBKDF2 + random salt             │
│  ├── verifyPassword()     → Timing-safe comparison           │
│  ├── generateSessionId()  → Crypto random 32 bytes           │
│  └── getCurrentUser()     → Session validation               │
└─────────────────────────────────────────────────────────────┘
```

### Security Implementation

| Feature | Implementation | Status |
|---------|---------------|--------|
| Password Hashing | PBKDF2 (100k iter, SHA-256) | ✅ Strong |
| Salt | 16 bytes random per password | ✅ Strong |
| Session ID | 32 bytes crypto random | ✅ Strong |
| Session Expiry | 7 days | ⚠️ Consider shorter |
| CSRF | Double-submit cookie | ✅ Implemented |
| Rate Limiting | 5 req/15min for auth | ✅ Implemented |
| Audit Logging | All auth events logged | ✅ Implemented |

### Flow Autentikasi
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────→│  Hono    │────→│  Auth    │────→│  D1 DB   │
│  (SPA)   │     │  Routes  │     │  Lib     │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
      │               │                │                │
      │  POST /login  │                │                │
      │──────────────→│                │                │
      │               │  validate()    │                │
      │               │───────────────→│                │
      │               │                │  Find user    │
      │               │                │───────────────→│
      │               │                │←───────────────│
      │               │                │  verifyPwd()   │
      │               │                │────────┐       │
      │               │                │        │       │
      │               │                │←───────┘       │
      │               │                │  createSession │
      │               │                │───────────────→│
      │               │  Set-Cookie    │                │
      │←──────────────│  session+csrf  │                │
```

### Potensi Masalah & Rekomendasi

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Session 7 hari tidak di-refresh | Medium | Implement sliding session |
| Password reset token tidak ada table | High | Buat migration untuk password_reset_tokens |
| Tidak ada account lockout | Medium | Implement brute force protection |
| CSRF token statis 24 jam | Low | Rotate dengan setiap request |

---

## 2. MODUL AI SERVICE

### Arsitektur Multi-Provider
```
┌─────────────────────────────────────────────────────────────┐
│                     AI SERVICE                               │
├─────────────────────────────────────────────────────────────┤
│  AIService Class (src/services/ai.ts)                       │
│  ├── geminiKeys[]   → Google Gemini API keys                │
│  ├── groqKeys[]     → Groq API keys                         │
│  └── mistralKeys[]  → Mistral API keys                      │
├─────────────────────────────────────────────────────────────┤
│  Methods                                                     │
│  ├── generateText(prompt, provider, jsonMode)               │
│  ├── generateJSON(prompt, provider)                         │
│  ├── callGemini()   → gemini-2.0-flash                      │
│  ├── callGroq()     → llama-3.3-70b-versatile               │
│  └── callMistral()  → mistral-small-latest                  │
└─────────────────────────────────────────────────────────────┘
```

### Failover Logic
```
┌─────────────┐     Fail     ┌─────────────┐     Fail     ┌─────────────┐
│   Gemini    │─────────────→│    Groq     │─────────────→│   Mistral   │
│  (Primary)  │              │  (Backup)   │              │  (Backup)   │
└─────────────┘              └─────────────┘              └─────────────┘
      │                            │                            │
      │ Success                    │ Success                    │ Success
      ↓                            ↓                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Response                                      │
│  { content: string, provider: 'gemini'|'groq'|'mistral', model }   │
└─────────────────────────────────────────────────────────────────────┘
```

### Model Configuration

| Provider | Model | Speed | Quality | Cost |
|----------|-------|-------|---------|------|
| Gemini | gemini-2.0-flash | Fast | Medium | Free tier |
| Groq | llama-3.3-70b-versatile | Very Fast | High | Pay per use |
| Mistral | mistral-small-latest | Medium | High | Pay per use |

### Penggunaan AI di Aplikasi

| Endpoint | Provider | JSON Mode | Purpose |
|----------|----------|-----------|---------|
| /api/surat/generate | Mistral/Gemini | No | Generate surat undangan |
| /api/proker/generate | Mistral/Gemini | No | Generate program kerja |
| /api/rpp/generate | Gemini/Groq | Yes | Generate RPP + komponen |
| /api/kisi/generate | Gemini/Groq | Yes | Generate kisi-kisi |
| /api/presentation/generate | Gemini/Groq | Yes | Generate slide content |

### Potensi Masalah & Rekomendasi

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| API keys tidak terenkripsi di DB | High | Implement encryption |
| Tidak ada usage tracking | Medium | Track token usage per user |
| Failover tanpa alerting | Medium | Add error notification |
| JSON parsing bisa gagal | Medium | Better error handling |
| Tidak ada caching untuk prompt sama | Low | Implement response cache |

---

## 3. MODUL ADMIN

### Arsitektur
```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN MODULE                             │
├─────────────────────────────────────────────────────────────┤
│  Routes (src/routes/admin.ts)                               │
│  ├── GET  /dashboard         → Dashboard statistics          │
│  ├── GET  /settings          → Get KKG settings              │
│  ├── PUT  /settings          → Update settings               │
│  ├── POST /settings/logo     → Upload logo                   │
│  ├── GET  /users             → List users                    │
│  ├── POST /users             → Create user                   │
│  ├── PUT  /users/:id         → Update user                   │
│  ├── PUT  /users/:id/role    → Change user role              │
│  ├── POST /users/:id/reset   → Reset password                │
│  ├── GET  /audit-logs        → View audit logs               │
│  ├── POST /audit-logs/cleanup→ Clean old logs                │
│  └── POST /bulk-approve      → Bulk approve users            │
├─────────────────────────────────────────────────────────────┤
│  Role Access                                                 │
│  ├── admin    → Full access                                  │
│  ├── operator → Limited access (read + settings)             │
│  └── user     → No access                                    │
└─────────────────────────────────────────────────────────────┘
```

### Middleware Stack
```
Request ──→ requireAdminPanelAccess ──→ rateLimit ──→ Handler
                    │
                    ├── Check session cookie
                    ├── Validate session in DB
                    └── Check role in ['admin', 'operator']
```

### Rate Limiting Admin
| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General read | 100 req | 1 min |
| Write ops | 30 req | 1 min |
| User creation | 20 req | 1 hour |
| Bulk ops | 10 req | 1 min |

### Audit Log Events Tracked
- USER_LOGIN / USER_LOGOUT
- USER_ROLE_CHANGE
- SETTINGS_UPDATE
- KEGIATAN_CREATE / DELETE
- MATERI_UPLOAD / DELETE
- SURAT_CREATE / DELETE
- PROKER_CREATE / DELETE
- ADMIN_ACTION

### Potensi Masalah & Rekomendasi

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| API key ditampilkan (masked) | Medium | Full encryption + never show |
| Tidak ada 2FA untuk admin | High | Implement TOTP 2FA |
| Audit log bisa dihapus | Medium | Soft delete atau immutable |
| Bulk operation tanpa konfirmasi | Medium | Require confirmation step |
| Tidak ada session management | Medium | Add active sessions view |

---

## 4. INTEGRASI ANTAR MODUL

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  index.tsx (Entry Point)                                                 │
│  ├── Sentry initialization                                                │
│  ├── Secure headers middleware                                            │
│  ├── CORS middleware                                                      │
│  ├── Rate limiting middleware                                             │
│  └── CSRF middleware                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Route Handler                                                            │
│  ├── Auth check (if protected)                                            │
│  ├── Input validation (Zod)                                               │
│  ├── Business logic                                                       │
│  ├── Database operations (D1)                                             │
│  ├── AI generation (if needed)                                            │
│  ├── Audit logging                                                        │
│  └── Response formatting                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Response                                                                 │
│  { success: boolean, data?: any, error?: { code, message } }            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. REKOMENDASI PRIORITAS

### High Priority
1. **Enkripsi API Keys** - Gunakan AES-GCM untuk menyimpan API keys
2. **Implement 2FA** - Untuk akun admin
3. **Add brute force protection** - Account lockout setelah N failed attempts

### Medium Priority
1. **Sliding session expiry** - Refresh session on activity
2. **AI usage tracking** - Track token usage per user
3. **Response caching** - Cache AI responses untuk prompt sama

### Low Priority
1. **Session management UI** - View active sessions
2. **Rate limit dashboard** - Monitor rate limit usage
3. **Webhook notifications** - Alert on critical events
