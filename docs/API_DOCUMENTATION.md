# API Documentation - KKG Portal Gugus 3 Wanayasa

Base URL: `https://kkg-gugus3-wanayasa.pages.dev`

## Authentication

Semua request (kecuali yang ditandai `Public`) memerlukan session cookie yang valid.

### Headers

```
Content-Type: application/json
X-CSRF-Token: <csrf_token>  # Required for POST/PUT/DELETE
Cookie: session=<session_id>; csrf_token=<csrf_token>
```

---

## Authentication Endpoints

### Login

```
POST /api/auth/login
Rate Limit: 5 requests / 15 minutes
```

**Request Body:**
```json
{
  "email": "admin@kkg-wanayasa.id",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "nama": "Admin KKG",
      "email": "admin@kkg-wanayasa.id",
      "role": "admin",
      "sekolah": "SDN 1 Wanayasa",
      "foto_url": null
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Email atau password salah"
  }
}
```

---

### Register

```
POST /api/auth/register
Rate Limit: 5 requests / 15 minutes
```

**Request Body:**
```json
{
  "nama": "Budi Santoso",
  "email": "budi@example.com",
  "password": "Password123",
  "nip": "198501012010011001",
  "no_hp": "081234567890",
  "sekolah": "SDN 2 Wanayasa"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": 6,
      "nama": "Budi Santoso",
      "email": "budi@example.com",
      "role": "user"
    }
  }
}
```

---

### Get Current User

```
GET /api/auth/me
Auth: Required
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "nama": "Admin KKG",
      "email": "admin@kkg-wanayasa.id",
      "role": "admin",
      "nip": "198501012010011001",
      "sekolah": "SDN 1 Wanayasa",
      "mata_pelajaran": "Guru Kelas",
      "no_hp": "081234567890",
      "foto_url": null
    }
  }
}
```

---

### Logout

```
POST /api/auth/logout
Auth: Required
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

### Change Password

```
POST /api/auth/change-password
Auth: Required
```

**Request Body:**
```json
{
  "current_password": "OldPassword123",
  "new_password": "NewPassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

---

## Surat Endpoints

### Generate Surat Undangan

```
POST /api/surat/generate
Auth: Required
```

**Request Body:**
```json
{
  "jenis_kegiatan": "Rapat Bulanan KKG",
  "tanggal_kegiatan": "2025-02-15",
  "waktu_kegiatan": "09:00 - 12:00",
  "tempat_kegiatan": "SDN 1 Wanayasa",
  "agenda": "Evaluasi Program Semester Ganjil",
  "peserta": ["Guru SD", "Kepala Sekolah"],
  "penanggung_jawab": "Ketua KKG"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Surat berhasil dibuat",
  "data": {
    "id": 1,
    "isi_surat": "Dengan hormat...",
    "status": "final"
  }
}
```

---

### Get Surat History

```
GET /api/surat/history
Auth: Required
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nomor_surat": "001/KKG-G3/I/2025",
      "jenis_kegiatan": "Rapat Bulanan",
      "tanggal_kegiatan": "2025-02-15",
      "status": "final",
      "created_at": "2025-02-10T10:00:00Z"
    }
  ]
}
```

---

## Program Kerja Endpoints

### Generate Program Kerja

```
POST /api/proker/generate
Auth: Required
```

**Request Body:**
```json
{
  "tahun_ajaran": "2025/2026",
  "visi": "Mewujudkan guru profesional dan berdaya saing",
  "misi": "Meningkatkan kompetensi guru melalui pelatihan berkelanjutan",
  "kegiatan": [
    {
      "nama_kegiatan": "Workshop Kurikulum Merdeka",
      "waktu_pelaksanaan": "Januari 2025",
      "penanggung_jawab": "Ketua KKG",
      "anggaran": "Rp 5.000.000",
      "indikator": "50 guru terlatih"
    }
  ],
  "analisis_kebutuhan": "Berdasarkan analisis kebutuhan..."
}
```

---

## RPP Endpoints

### Generate RPP

```
POST /api/rpp/generate
Auth: Required
Rate Limit: 10 requests / hour (AI)
```

**Request Body:**
```json
{
  "mata_pelajaran": "Matematika",
  "kelas": "4",
  "topik": "Pecahan Sederhana",
  "alokasi_waktu": "2 x 35 menit",
  "tujuan_pembelajaran": "Siswa mampu menjumlahkan pecahan sederhana",
  "metode": "Discovery Learning"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "rpp": {
      "identitas": { ... },
      "tujuan_pembelajaran": [ ... ],
      "kegiatan_pendahuluan": "...",
      "kegiatan_inti": [ ... ],
      "kegiatan_penutup": "...",
      "penilaian": { ... }
    }
  }
}
```

---

## Absensi Endpoints

### Get Kegiatan List

```
GET /api/absensi/kegiatan
Public: Yes
```

**Query Parameters:**
- `status` - Filter by status (upcoming, ongoing, completed)
- `page` - Page number
- `limit` - Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_kegiatan": "Rapat Bulanan KKG",
      "tanggal": "2025-02-15",
      "waktu_mulai": "09:00",
      "waktu_selesai": "12:00",
      "tempat": "SDN 1 Wanayasa",
      "deskripsi": "Evaluasi program semester",
      "jumlah_hadir": 15,
      "checked_in": false
    }
  ]
}
```

---

### Check-in Absensi

```
POST /api/absensi/checkin
Auth: Required
```

**Request Body:**
```json
{
  "kegiatan_id": 1,
  "keterangan": "Hadir tepat waktu"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Check-in berhasil",
  "data": {
    "waktu_checkin": "2025-02-15T08:55:00Z"
  }
}
```

---

## Forum Endpoints

### Get Threads

```
GET /api/forum/threads
Public: Yes
```

**Query Parameters:**
- `kategori` - Filter by category
- `search` - Search in title and content
- `page` - Page number
- `limit` - Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "judul": "Sharing Best Practice: Pembelajaran Diferensiasi",
      "isi": "...",
      "kategori": "best-practice",
      "author_name": "Siti Nurhaliza",
      "reply_count": 5,
      "is_pinned": true,
      "created_at": "2025-02-01T10:00:00Z"
    }
  ]
}
```

---

### Create Thread

```
POST /api/forum/threads
Auth: Required
```

**Request Body:**
```json
{
  "judul": "Diskusi Kurikulum Merdeka",
  "isi": "Bagaimana pengalaman rekan-rekan...",
  "kategori": "kurikulum"
}
```

---

### Reply to Thread

```
POST /api/forum/threads/:id/reply
Auth: Required
```

**Request Body:**
```json
{
  "isi": "Terima kasih atas sharingnya..."
}
```

---

## Materi Endpoints

### Get Materi List

```
GET /api/materi
Public: Yes
```

**Query Parameters:**
- `kategori` - Filter by category
- `jenjang` - Filter by level (SD, SMP, SMA)
- `jenis` - Filter by type (RPP, Modul, Silabus, etc)
- `search` - Search in title
- `page` - Page number
- `limit` - Items per page

---

### Upload Materi

```
POST /api/materi
Auth: Required
```

**Request Body (multipart/form-data):**
```
judul: "RPP Matematika Kelas 4"
deskripsi: "RPP Semester Ganjil"
kategori: "Matematika"
jenjang: "SD"
jenis: "RPP"
file: <file>
```

---

## Admin Endpoints

### Get Dashboard Stats

```
GET /api/admin/dashboard
Auth: Admin/Operator
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_guru": 50,
    "total_surat": 25,
    "total_proker": 5,
    "total_kegiatan": 12,
    "total_materi": 100,
    "analytics": {
      "new_users_this_month": 5,
      "active_users_today": 15,
      "user_growth": [...],
      "top_active_users": [...]
    }
  }
}
```

---

### Get Users List

```
GET /api/admin/users
Auth: Admin
```

**Query Parameters:**
- `search` - Search by name or email
- `role` - Filter by role (admin, operator, user)
- `page` - Page number
- `limit` - Items per page

---

### Create User (Admin)

```
POST /api/admin/users
Auth: Admin
Rate Limit: 20 requests / hour
```

**Request Body:**
```json
{
  "nama": "Guru Baru",
  "email": "guru@example.com",
  "password": "Password123",
  "role": "user",
  "sekolah": "SDN 3 Wanayasa",
  "nip": "199001012020011001"
}
```

---

### Update User Role

```
PUT /api/admin/users/:id/role
Auth: Admin
```

**Request Body:**
```json
{
  "role": "operator"
}
```

---

### Reset User Password

```
POST /api/admin/users/:id/reset-password
Auth: Admin
```

**Request Body:**
```json
{
  "new_password": "NewPassword123"
}
```

---

### Get Audit Logs

```
GET /api/admin/audit-logs
Auth: Admin
```

**Query Parameters:**
- `user_id` - Filter by user
- `action` - Filter by action type
- `entity_type` - Filter by entity
- `start_date` - Start date (YYYY-MM-DD)
- `end_date` - End date (YYYY-MM-DD)
- `search` - Search in details
- `page` - Page number
- `limit` - Items per page

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Session tidak valid atau expired |
| FORBIDDEN | 403 | Tidak memiliki akses ke resource |
| VALIDATION_ERROR | 400 | Input tidak valid |
| NOT_FOUND | 404 | Resource tidak ditemukan |
| DUPLICATE | 409 | Resource sudah ada (e.g., email) |
| RATE_LIMITED | 429 | Terlalu banyak request |
| INTERNAL_ERROR | 500 | Error internal server |
| AI_ERROR | 500 | Gagal generate dengan AI |
| CONFIG_ERROR | 500 | Konfigurasi tidak lengkap |

---

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Auth (login, register) | 5 requests | 15 minutes |
| AI Generation | 10 requests | 1 hour |
| General API | 120 requests | 1 minute |
| Read Operations | 300 requests | 1 minute |
| Admin Write | 30 requests | 1 minute |
| Admin User Create | 20 requests | 1 hour |

---

## Webhook Events (Future)

Currently not implemented. Planned events:
- `user.registered`
- `surat.generated`
- `kegiatan.created`
- `forum.reply`
