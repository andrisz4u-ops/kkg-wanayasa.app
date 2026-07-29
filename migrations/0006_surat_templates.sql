-- Migration: Ensure surat_templates table exists with current schema

CREATE TABLE IF NOT EXISTS surat_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL CHECK(jenis IN ('undangan', 'tugas', 'keterangan', 'edaran', 'permohonan', 'lainnya')),
    deskripsi TEXT,
    konten TEXT NOT NULL,
    variables TEXT,
    is_active INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_templates_jenis ON surat_templates(jenis);
CREATE INDEX IF NOT EXISTS idx_templates_active ON surat_templates(is_active);

-- Seed defaults only when table is empty
INSERT INTO surat_templates (nama, jenis, deskripsi, konten, variables, is_active, created_by)
SELECT
  'Undangan Rapat Rutin',
  'undangan',
  'Template undangan untuk rapat rutin bulanan KKG',
  'Dengan hormat,\n\nSehubungan dengan agenda kegiatan Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa, kami mengundang Bapak/Ibu Guru untuk hadir pada:\n\nHari/Tanggal : {{tanggal}}\nWaktu        : {{waktu}}\nTempat       : {{tempat}}\nAcara        : {{acara}}\n\nMengingat pentingnya acara ini, kami mohon kehadiran Bapak/Ibu tepat pada waktunya.',
  '["tanggal", "waktu", "tempat", "acara"]',
  1,
  NULL
WHERE NOT EXISTS (SELECT 1 FROM surat_templates LIMIT 1);
