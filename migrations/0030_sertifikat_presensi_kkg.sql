-- =============================================
-- Migration: Sertifikat Presensi KKG & Dual Sign-Off
-- (Ketua KKG & Pengawas Pembina Gugus 3 Wanayasa)
-- =============================================

-- Tambah metadata sertifikat & pengesahan pada tabel kegiatan
ALTER TABLE kegiatan ADD COLUMN alokasi_jp INTEGER DEFAULT 4;
ALTER TABLE kegiatan ADD COLUMN narasumber TEXT;
ALTER TABLE kegiatan ADD COLUMN materi_struktur TEXT;
ALTER TABLE kegiatan ADD COLUMN is_locked INTEGER DEFAULT 0;
ALTER TABLE kegiatan ADD COLUMN ttd_ketua_nama TEXT;
ALTER TABLE kegiatan ADD COLUMN ttd_ketua_nip TEXT;
ALTER TABLE kegiatan ADD COLUMN ttd_ketua_at DATETIME;
ALTER TABLE kegiatan ADD COLUMN ttd_pengawas_nama TEXT;
ALTER TABLE kegiatan ADD COLUMN ttd_pengawas_nip TEXT;
ALTER TABLE kegiatan ADD COLUMN ttd_pengawas_at DATETIME;
ALTER TABLE kegiatan ADD COLUMN nomor_surat_prefix TEXT DEFAULT '421.2';

-- Tabel rekaman sertifikat presensi ber-token unik & mikro-refleksi
CREATE TABLE IF NOT EXISTS sertifikat_presensi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kegiatan_id INTEGER NOT NULL REFERENCES kegiatan(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nomor_sertifikat TEXT UNIQUE NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  refleksi_konsep TEXT,
  refleksi_tantangan TEXT,
  refleksi_rencana_aksi TEXT,
  status TEXT DEFAULT 'terbit',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kegiatan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sertifikat_kegiatan ON sertifikat_presensi(kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_sertifikat_user ON sertifikat_presensi(user_id);
CREATE INDEX IF NOT EXISTS idx_sertifikat_token ON sertifikat_presensi(token_hash);
