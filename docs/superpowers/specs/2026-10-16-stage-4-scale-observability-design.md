# Stage 4 — Skala, Observabilitas, UX (Desain, 2026-10-16)

## Prinsip (otorisasi berdiri: tahap 2→3→4 sekuensial, tanpa commit/prod/deploy/migrasi/secret)

- Pertahankan semua perilaku Stage 1–3 yang sudah terverifikasi; tidak ada perubahan skema D1 baru.
- Tenant tetap fail-closed (satu tenant). Multitenan HANYA setelah uji isolasi — di luar scope.
- Jujur soal batas: rate limit in-memory per-Worker instance (tidak terdistribusi lintas isolate
  tanpa KV/Durable Objects). Tidak mengklaim distributed limiting.

## 1. Rate limit seragam + per-user key (src/lib/ratelimit.ts)

- Hapus bypass admin/operator di `rateLimitMiddleware` (baris 150–160 lama). Alasan: akun
  istimewa yang dikompromikan tetap harus dibatasi; bypass juga menambah 1 query DB
  (`getCurrentUser`) di SETIAP request → latensi.
- Key: `user:<id>` bila `c.get('user')` sudah terisi (route sesudah `requireSession`),
  fallback `ip:<ip>` seperti sebelumnya. Tidak mengubah bentuk respons 429/headers.
- Tidak ada perubahan limit angka (auth 10/30s, ai 10/jam, api 120/mnt, read 300/mnt).

## 2. Header Retry-After konsisten (src/lib/response.ts + ai-admission.ts)

- `Errors.rateLimited` menyetel header HTTP `Retry-After` selain body `retryAfter`,
  agar klien non-JSON (SSE/EventSource) bisa mundur otomatis.
- `requireAIAdmission` menyetel header `X-Admission-Limit`/`X-Admission-Remaining`? TIDAK —
  menjaga minimal: hanya Retry-After via response helper. Tidak ada kolom D1 baru.

## 3. Observabilitas (tanpa PII)

- Tidak ada penambahan log ber-PII. Penolakan 429 sudah membawa `retryAfter` di body;
  korelasi memakai request ID logger yang sudah ada (Stage 1).
- Metrik per-user cost/kuota: di luar scope (butuh KV/DO untuk lintas-isolate yang akurat).
  Admission D1 (`ai_user_admission`) tetap sumber kuota AI per-user yang benar.

## 4. Aksesibilitas/mobile — checklist manual (tidak ada browser di CI)

- Tidak ada klaim lolos a11y otomatis. Frontend Stage 3 (badge status bank soal, antrian
  moderasi, sinkronisasi draf) memakai elemen button/div yang sudah ada; audit keyboard/
  kontras/layar-kecil manual oleh operator sebelum rilis.

## 5. Verifikasi

- Baru: `tests/rate-limit.test.ts` — unit `checkRateLimit`, middleware seragam (admin TIDAK
  bypass), key per-user vs IP terpisah, bentuk 429 + header Retry-After.
- Gate: full `npm test -- --run`, `npm run check:secrets`, `git diff --check`, `npm run build`
  (backup+restore aset generated seperti Stage 2/3).
