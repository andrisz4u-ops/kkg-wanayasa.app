# Setup Error Tracking dengan Sentry

## Overview
Sentry sudah terintegrasi untuk monitoring error real-time di aplikasi KKG Portal.

## Setup Steps

### 1. Buat Project di Sentry

1. Kunjungi https://sentry.io/signup/ (atau login ke account existing)
2. Buat project baru dengan nama `kkg-portal`
3. Pilih platform: `Cloudflare Workers`
4. Copy DSN yang diberikan (format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 2. Set SENTRY_DSN Secret

```bash
npx wrangler secret put SENTRY_DSN
```

Paste DSN dari Sentry saat diminta.

### 3. Verifikasi Setup

Deploy aplikasi dan cek di dashboard Sentry untuk memastikan error tracking aktif.

## Features yang Aktif

✅ **Error Capture**: Semua exception otomatis ter-track
✅ **Context Enrichment**: Request path, method, user agent tercatat
✅ **PII Filtering**: Cookie, authorization header, token otomatis di-filter
✅ **Performance Monitoring**: 10% transaction sample rate
✅ **Release Tracking**: Commit SHA otomatis ter-track

## Configuration

File konfigurasi: `src/lib/sentry.ts`

### Environment Variables

- `SENTRY_DSN`: DSN dari Sentry dashboard (REQUIRED)
- `ENVIRONMENT`: Environment name (default: 'production')
- `CF_PAGES_COMMIT_SHA`: Auto-populated by Cloudflare Pages

### Sensitive Data Filtering

Sentry otomatis menghapus:
- Cookie headers
- Authorization headers
- CSRF tokens
- Query parameters dengan nama: password, token, key, secret

## Monitoring Dashboard

Akses dashboard Sentry untuk melihat:
- Error trends
- Performance metrics
- Release health
- User impact

## Alerting Setup (Recommended)

1. Di Sentry dashboard → Settings → Alerts
2. Buat rule baru:
   - **Condition**: Error count > 10 in 5 minutes
   - **Action**: Send email to admin@kkg-wanayasa.id
   - **Environment**: production

## Testing

Untuk test error tracking:

```javascript
// Di browser console (dev mode)
fetch('/api/test-error')
```

Atau trigger error manual di code untuk testing.

## Troubleshooting

**Sentry tidak menerima error:**
- Cek `SENTRY_DSN` sudah di-set: `npx wrangler secret list`
- Pastikan DSN valid dan project active di Sentry
- Cek browser console untuk error Sentry initialization

**Too many errors:**
- Adjust `sampleRate` di `src/lib/sentry.ts`
- Filter error yang tidak penting dengan `beforeSend`

## Cost Consideration

Sentry free tier:
- 5,000 errors/month
- 10,000 performance units/month
- 1GB attachments/month

Untuk production dengan traffic tinggi, pertimbangkan upgrade ke paid plan.

---

**Status**: ✅ Integration ready, tinggal set DSN secret
