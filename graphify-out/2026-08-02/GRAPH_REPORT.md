# Graph Report - .  (2026-08-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 916 nodes · 1962 edges · 66 communities (63 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- helpers.ts
- scripts
- dependencies
- AIService
- manifest.json
- validation.ts
- types/index.ts
- admin.ts
- upload.ts
- escapeHtml
- api
- state.js
- utils.js
- index.tsx
- routes/surat.ts
- a11y.js
- showToast
- EdgeCache
- ui.js
- slide.js
- lib/auth.ts
- Errors
- asesmen-docx.js
- recovered.js
- response.ts
- notifications.ts
- compilerOptions
- materi.ts
- dashboard.js
- materi.js
- skeleton.js
- theme.js
- logger.ts
- js/notifications.js
- kalender.js
- sw.js
- compression.ts
- dashboard.ts
- email.ts
- presentation.ts
- pengumuman.js
- crypto.ts
- users.js
- dev.mjs
- profile-beranda.mjs
- getCookie
- sentry.ts
- settings.js
- minified_generateRppDocx.js
- guru.js
- update_home.js

## God Nodes (most connected - your core abstractions)
1. `escapeHtml()` - 56 edges
2. `api()` - 50 edges
3. `showToast()` - 33 edges
4. `Errors` - 27 edges
5. `getCookie()` - 25 edges
6. `state` - 24 edges
7. `getCurrentUser()` - 23 edges
8. `successResponse()` - 23 edges
9. `scripts` - 16 edges
10. `AIService` - 16 edges

## Surprising Connections (you probably didn't know these)
- `callGemini()` --references--> `@google/generative-ai`  [EXTRACTED]
  src/lib/mistral.ts → package.json
- `generateQRCodePNG()` --references--> `qrcode`  [EXTRACTED]
  src/lib/qrcode.ts → package.json
- `generateQRCodeSVG()` --references--> `qrcode`  [EXTRACTED]
  src/lib/qrcode.ts → package.json
- `renderModalContent()` --calls--> `escapeHtml()`  [EXTRACTED]
  public/static/js/pages/pengumuman.js → public/static/js/utils.js
- `requireStrictAdmin()` --references--> `Errors`  [EXTRACTED]
  src/routes/admin.ts → src/lib/response.ts

## Import Cycles
- None detected.

## Communities (66 total, 3 thin omitted)

### Community 0 - "helpers.ts"
Cohesion: 0.18
Nodes (43): base64toBuffer(), base64ToBytes(), cleanMarkdownSymbols(), createAgendaTable(), createKegiatanTable(), createLampiranStruktur(), createLembarPengesahan(), createMetadataTable() (+35 more)

### Community 1 - "scripts"
Cohesion: 0.04
Nodes (47): autoprefixer, @cloudflare/workers-types, concurrently, happy-dom, @hono/vite-build, @hono/vite-dev-server, devDependencies, autoprefixer (+39 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (43): @aws-sdk/client-s3, cheerio, docx, file-saver, @google/generative-ai, groq-sdk, hono, @hono/vite-cloudflare-pages (+35 more)

### Community 3 - "AIService"
Cohesion: 0.08
Nodes (13): CrosswordGenerator, CrosswordResult, generateCrossword(), Placement, kisi, AIProvider, AIResponse, AIService (+5 more)

### Community 4 - "manifest.json"
Cohesion: 0.06
Nodes (30): background_color, categories, description, dir, display, icons, lang, name (+22 more)

### Community 5 - "validation.ts"
Cohesion: 0.09
Nodes (29): baseSlideSchema, changePasswordSchema, checkinSchema, createKegiatanSchema, createMateriSchema, createPengumumanSchema, createReplySchema, createThreadSchema (+21 more)

### Community 6 - "types/index.ts"
Cohesion: 0.09
Nodes (27): createNotification(), Bindings, Bindings, forum, Absensi, AbsensiWithUser, AuthResponse, CreateKegiatanRequest (+19 more)

### Community 7 - "admin.ts"
Cohesion: 0.09
Nodes (27): AuditAction, AuditLogEntry, AuditLogWithUser, cleanOldAuditLogs(), formatAuditAction(), getAuditActionTypes(), getAuditEntityTypes(), getAuditLogs() (+19 more)

### Community 8 - "upload.ts"
Cohesion: 0.10
Nodes (18): ALL_ALLOWED_EXTENSIONS, ALL_ALLOWED_MIME_TYPES, FileMetadata, fileUploadSchema, formatFileSize(), generateFileKey(), getFileCategory(), getFileExtension() (+10 more)

### Community 9 - "escapeHtml"
Cohesion: 0.13
Nodes (24): alert(), button(), pageHeader(), renderFooter(), renderNavbar(), searchInput(), statCard(), tabs() (+16 more)

### Community 10 - "api"
Cohesion: 0.13
Nodes (19): api(), apiDelete(), ApiError, apiGet(), apiPost(), apiPut(), clearFormErrors(), showFormErrors() (+11 more)

### Community 11 - "state.js"
Cohesion: 0.20
Nodes (15): renderAdminLayout(), renderForum(), renderHome(), laporanList, renderLaporan(), renderLaporanGrid(), renderProker(), fetchLetterSettings() (+7 more)

### Community 12 - "utils.js"
Cohesion: 0.14
Nodes (11): onQRScanSuccess(), renderAbsensi(), renderAdmin(), avatar(), copyToClipboard(), debounce(), formatDate(), formatRelativeTime() (+3 more)

### Community 13 - "index.tsx"
Cohesion: 0.13
Nodes (15): app, Bindings, Variables, successResponse(), absensi, auth, Bindings, files (+7 more)

### Community 14 - "routes/surat.ts"
Cohesion: 0.16
Nodes (17): checkRateLimit(), cleanupExpiredEntries(), getClientIP(), isRateLimited(), RATE_LIMITS, RateLimitConfig, RateLimitEntry, rateLimitMiddleware() (+9 more)

### Community 15 - "a11y.js"
Cohesion: 0.15
Nodes (13): accessibleInput(), accessibleTextarea(), announce(), announceAssertive(), generateId(), getAnimationDuration(), getContrastRatio(), getLuminance() (+5 more)

### Community 16 - "showToast"
Cohesion: 0.23
Nodes (17): renderLockedFeature(), containsSundaneseScript(), hasSundaneseInCanvas(), initKisi(), _lastFormData, _lastGeneratedData, renderKisi(), renderResult() (+9 more)

### Community 17 - "EdgeCache"
Cohesion: 0.13
Nodes (7): cache, CACHE_CONFIGS, CacheEntry, cacheMiddleware(), CacheOptions, EdgeCache, generateCacheKey()

### Community 18 - "ui.js"
Cohesion: 0.13
Nodes (10): applyAdminModeUI(), closeAdminModal(), initModalAccessibility(), isOperatorMode(), pendingApprovalState, sekolahSelectionState, setControlButtonState(), slaPendingThreshold (+2 more)

### Community 19 - "slide.js"
Cohesion: 0.22
Nodes (17): attachCurrentViewEvents(), exportToPPTX(), generateSlideHTML(), getColorScheme(), goToEditorSlide(), initSlide(), loadScript(), navigateEditor() (+9 more)

### Community 20 - "lib/auth.ts"
Cohesion: 0.24
Nodes (12): generateCSRFToken(), generateSessionId(), getSessionExpiry(), hashPassword(), timingSafeEqual(), validatePassword(), verifyPassword(), logger (+4 more)

### Community 21 - "Errors"
Cohesion: 0.17
Nodes (12): requireAdminOnly(), getCurrentUser(), cpData, asyncHandler(), Errors, requireAdminPanelAccess(), Bindings, checkLaporanAccess() (+4 more)

### Community 22 - "asesmen-docx.js"
Cohesion: 0.29
Nodes (14): CM(), fetchSafeImageBuffer(), generateAsesmenDocx(), LINE_BORDER, LINE_BORDERS, makeCell(), makeOpsiTable(), makePara() (+6 more)

### Community 23 - "recovered.js"
Cohesion: 0.18
Nodes (6): EV(), He(), jV(), lA(), PV(), TV()

### Community 24 - "response.ts"
Cohesion: 0.18
Nodes (10): createAuditLog(), ApiResponse, ErrorCodes, validateRequired(), Bindings, calendar, CalendarEvent, Variables (+2 more)

### Community 25 - "notifications.ts"
Cohesion: 0.18
Nodes (12): createBulkNotifications(), deleteNotification(), getUserNotifications(), markAllNotificationsAsRead(), markNotificationAsRead(), Bindings, notifications, Variables (+4 more)

### Community 26 - "compilerOptions"
Cohesion: 0.14
Nodes (13): @cloudflare/workers-types/2023-07-01, ESNext, vite/client, compilerOptions, jsx, jsxImportSource, lib, module (+5 more)

### Community 27 - "materi.ts"
Cohesion: 0.21
Nodes (10): deleteFile(), StorageBindings, uploadFile(), Bindings, guru, Bindings, materi, CreateMateriRequest (+2 more)

### Community 28 - "dashboard.js"
Cohesion: 0.29
Nodes (11): formatActivityTime(), getActionIcon(), loadAdminDashboard(), loadDashboardActivity(), loadDashboardTaskList(), loadPendingUsersWidget(), refreshDashboardData(), setMetricValue() (+3 more)

### Community 29 - "materi.js"
Cohesion: 0.27
Nodes (11): getCsrfToken(), refreshCsrfToken(), loadMateriList(), loadReviews(), processSelectedFile(), renderMateri(), renderMateriCard(), updateRatingStars() (+3 more)

### Community 30 - "skeleton.js"
Cohesion: 0.29
Nodes (9): showSkeleton(), skeleton, skeletonCards(), skeletonForm(), skeletonList(), skeletonPage(), skeletonProfile(), skeletonStats() (+1 more)

### Community 31 - "theme.js"
Cohesion: 0.35
Nodes (11): applyTheme(), getEffectiveTheme(), getSavedTheme(), getSystemTheme(), initTheme(), renderThemeSelector(), renderThemeToggle(), saveTheme() (+3 more)

### Community 32 - "logger.ts"
Cohesion: 0.21
Nodes (8): createRequestContext(), errorLoggingMiddleware(), generateRequestId(), LOG_LEVELS, LogContext, LogEntry, loggingMiddleware(), LogLevel

### Community 33 - "js/notifications.js"
Cohesion: 0.25
Nodes (6): closeNotifications(), closeNotificationsOutside(), fetchUnreadCount(), formatTimeAgo(), loadNotifications(), updateNotificationBadge()

### Community 34 - "kalender.js"
Cohesion: 0.29
Nodes (9): currentDate, events, getEventTypeLabel(), initKalender(), loadEvents(), renderCalendar(), renderListView(), renderMonthView() (+1 more)

### Community 35 - "sw.js"
Cohesion: 0.18
Nodes (4): CACHE_FIRST_PATTERNS, NETWORK_FIRST_PATTERNS, PRECACHE_RESOURCES, STALE_REVALIDATE_PATTERNS

### Community 36 - "compression.ts"
Cohesion: 0.24
Nodes (6): acceptsCompression(), checkETag(), CompressionStats, conditionalResponse(), generateETag(), optimizeResponse()

### Community 37 - "dashboard.ts"
Cohesion: 0.18
Nodes (9): errorResponse(), ActivityItem, AIUsageStats, dashboard, DashboardEnv, MemberStats, QuickStats, TrendData (+1 more)

### Community 38 - "email.ts"
Cohesion: 0.24
Nodes (5): EmailConfig, EmailMessage, sendEmail(), sendViaResend(), sendViaSendGrid()

### Community 39 - "presentation.ts"
Cohesion: 0.20
Nodes (5): presentationGenerateSchema, presentationResponseSchema, PresentationSlide, Bindings, presentation

### Community 40 - "pengumuman.js"
Cohesion: 0.39
Nodes (7): currentPengumumanList, getModalFocusableElements(), handlePengumumanModalKeydown(), openPengumumanModal(), renderModalContent(), renderPengumuman(), nl2br()

### Community 41 - "crypto.ts"
Cohesion: 0.32
Nodes (3): decrypt(), encrypt(), getEncryptionKey()

### Community 42 - "users.js"
Cohesion: 0.38
Nodes (4): renderAdminUsersTable(), renderPendingApprovalsTable(), updatePendingSelectionUI(), updateUsersSelectionUI()

### Community 43 - "dev.mjs"
Cohesion: 0.33
Nodes (6): cssCli, initialCss, processes, root, shutdown(), start()

### Community 44 - "profile-beranda.mjs"
Cohesion: 0.62
Nodes (6): average(), checkServerReady(), main(), measureRun(), rating(), wait()

### Community 45 - "getCookie"
Cohesion: 0.52
Nodes (6): getCookie(), CSRF_IGNORE_PATHS, csrfMiddleware(), getOrCreateCSRFToken(), setCSRFCookie(), shouldIgnorePath()

### Community 47 - "settings.js"
Cohesion: 0.50
Nodes (3): adminUsersPagination, loadAdminSettings(), setVal()

### Community 50 - "guru.js"
Cohesion: 0.83
Nodes (3): renderGuru(), renderGuruCard(), renderGuruGroups()

## Knowledge Gaps
- **204 isolated node(s):** `name`, `type`, `dev`, `build`, `build:css` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `@google/generative-ai` connect `dependencies` to `AIService`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `name`, `type`, `dev` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04995374653098982 - nodes in this community are weakly interconnected._
- **Should `AIService` be split into smaller, more focused modules?**
  _Cohesion score 0.07948717948717948 - nodes in this community are weakly interconnected._
- **Should `manifest.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._