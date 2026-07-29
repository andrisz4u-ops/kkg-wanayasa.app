# Setup Uptime Monitoring

## Overview
Aplikasi sudah memiliki endpoint health check untuk monitoring uptime dan kesehatan sistem.

## Health Check Endpoints

### 1. Public Health Check
**URL**: `GET /api/health`

Response sukses (200):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": true,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "2.0.0",
    "environment": "production"
  },
  "message": "OK"
}
```

Response gagal (503):
```json
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "database": false,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "message": "Service unhealthy"
}
```

### 2. Detailed Health Check (Admin Only)
**URL**: `GET /api/health/detailed`

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "checks": {
      "database": { "status": true, "latency": 45 },
      "sentry": { "status": true, "configured": true }
    },
    "totalLatency": 50,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Setup Monitoring

### Option 1: UptimeRobot (Recommended - Free)

1. Daftar di https://uptimerobot.com/
2. Dashboard → "Add New Monitor"
3. Konfigurasi:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: KKG Portal
   - **URL**: `https://kkg-gugus3-wanayasa.pages.dev/api/health`
   - **Monitoring Interval**: 5 minutes
   - **Alert When**: Down
4. Setup alert notification (Email/WhatsApp/Telegram)

### Option 2: Cloudflare Analytics (Built-in)

1. Login ke Cloudflare Dashboard
2. Pilih domain Workers/Pages
3. Tab "Analytics" → "Workers & Pages"
4. Monitor:
   - Request volume
   - Error rate
   - CPU time
   - Subrequests

### Option 3: Better Uptime (Free tier)

1. Daftar di https://betteruptime.com/
2. "Create Monitor"
3. Konfigurasi:
   - **URL**: `https://kkg-gugus3-wanayasa.pages.dev/api/health`
   - **Monitor Type**: HTTP
   - **Expected Status Code**: 200
   - **Request Timeout**: 30s
   - **Confirmation Period**: 2 minutes
4. Connect incident alerting (Slack/Email/SMS)

## Status Page (Optional)

Setup status page publik dengan Better Uptime atau UptimeRobot:
- URL: `status.kkg-wanayasa.pages.dev` (custom domain)
- Menampilkan uptime history 90 hari
- Incident reports

## Recommended Alert Thresholds

### Critical (Immediate action)
- Endpoint down > 2 minutes
- Error rate > 5%
- Database unavailable

### Warning (Monitor closely)
- Response time > 2 seconds
- CPU time > 100ms consistently

## Manual Health Check

Test endpoint kapan saja:

```bash
curl https://kkg-gugus3-wanayasa.pages.dev/api/health
```

Atau di browser:
```
https://kkg-gugus3-wanayasa.pages.dev/api/health
```

## Troubleshooting

**Health check returning 503:**
1. Cek D1 database connection
2. Review logs di Cloudflare Dashboard
3. Cek rate limiting (mungkin health check terkena rate limit)

**False positives:**
1. Naikkan timeout threshold
2. Cek network connectivity
3. Verifikasi URL benar

## SLA Target

Rekomendasi SLA untuk aplikasi KKG:
- **Uptime**: 99.5% (≤3.6 jam downtime/bulan)
- **Response Time**: < 500ms (p95)
- **Error Rate**: < 1%

---

**Status**: ✅ Health check endpoints ready, tinggal setup monitor external
