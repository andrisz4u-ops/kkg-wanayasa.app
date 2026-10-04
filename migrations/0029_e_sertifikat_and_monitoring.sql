-- Migration 0029: E-Sertifikat KKG dan Monitoring Keterlaksanaan Program Sekolah (7 KAIH & 7 Poe Atikan)

-- 1. Tabel E-Sertifikat KKG Otomatis untuk Bukti Dukung PMM
CREATE TABLE IF NOT EXISTS e_sertifikat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nomor_sertifikat TEXT UNIQUE NOT NULL,
  kegiatan_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  nama_peserta TEXT NOT NULL,
  nip_peserta TEXT,
  unit_kerja TEXT,
  nama_kegiatan TEXT NOT NULL,
  tanggal_kegiatan TEXT NOT NULL,
  materi_pokok TEXT,
  alokasi_jp INTEGER DEFAULT 4,
  peran TEXT DEFAULT 'Peserta Aktif',
  status_kehadiran TEXT DEFAULT 'hadir',
  uuid TEXT UNIQUE NOT NULL,
  qr_verify_url TEXT,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(kegiatan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sertifikat_uuid ON e_sertifikat(uuid);
CREATE INDEX IF NOT EXISTS idx_sertifikat_user ON e_sertifikat(user_id);
CREATE INDEX IF NOT EXISTS idx_sertifikat_kegiatan ON e_sertifikat(kegiatan_id);

-- 2. Tabel Monitoring & Checklist Keterlaksanaan Program Sekolah (7 KAIH & 7 Poe Atikan Purwakarta)
CREATE TABLE IF NOT EXISTS program_monitoring_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sekolah TEXT NOT NULL,
  kategori TEXT NOT NULL, -- '7poe_atikan' | '7kaih' | 'kokurikuler'
  item_kode TEXT NOT NULL,
  item_nama TEXT NOT NULL,
  deskripsi TEXT,
  hari_pelaksanaan TEXT,
  status TEXT DEFAULT 'belum' CHECK(status IN ('belum', 'berjalan', 'tercapai')),
  catatan TEXT,
  tanggal_evaluasi TEXT,
  penilai TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sekolah, item_kode)
);

CREATE INDEX IF NOT EXISTS idx_monitoring_sekolah ON program_monitoring_checklist(sekolah);
CREATE INDEX IF NOT EXISTS idx_monitoring_kategori ON program_monitoring_checklist(kategori);
