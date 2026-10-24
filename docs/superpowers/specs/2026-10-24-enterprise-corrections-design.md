# Desain koreksi enterprise — 24 Oktober 2026

Dasar persetujuan: pengguna meminta roadmap lama diperbaiki dan diterapkan sesuai audit ulang. Rencana kanonis: [Roadmap enterprise](../../ROADMAP_ENTERPRISE.md).

## Pendekatan yang dipilih

Koreksi bertahap pada batas request, konfigurasi, autentikasi dan transaksi administratif. Alternatif penulisan ulang framework ditunda karena lazy loading, admission D1 dan idempotensi sudah tersedia. Alternatif menambah KV/DO/queue ditunda sampai pengukuran atau kebutuhan durabilitas memerlukannya.

## Unit implementasi

1. Transport HTTP browser bersama, dengan facade kompatibel `api()` dan `apiFetch()`.
2. Middleware CSRF tanpa aturan khusus tes; kontrak pengaturan dan visual eksplisit.
3. Validator environment dan error enkripsi bertipe, tanpa rotasi key otomatis.
4. Toolchain lokal, scanner path-aware, budget artefak dan tes kontrak.
5. Autentikasi segar, upgrade password CAS, admission fail-closed, batch audit administratif.
6. Pemeriksaan migrasi terisolasi dan runbook operasional.

Setiap unit diverifikasi sebelum regresi penuh. Data produksi tidak diperlukan untuk pengujian: gunakan SQLite/Miniflare dan fixture kredensial sintetis. Tidak ada perubahan skema atau rename migrasi historis yang diperlukan oleh desain ini.

## Pemeriksaan desain

- Kontrak JSON tetap kompatibel; ekspor menerima Response asli, bukan envelope JSON.
- CSRF retry dibatasi dan tidak menggandakan operasi yang sudah diterima handler.
- Binding non-string tidak hilang saat environment dinormalisasi.
- Error dekripsi tidak boleh direkonsiliasi sebagai key kosong.
- CAS login dan batch audit diperiksa melalui kegagalan/konkurensi, bukan hanya happy path.
- Keberhasilan lokal dan pekerjaan operator produksi diberi status terpisah.
