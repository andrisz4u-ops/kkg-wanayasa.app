-- Migration 0023: Standard Curriculum Chapters & CP Kolaboratif Likes
CREATE TABLE IF NOT EXISTS curriculum_standard_chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mata_pelajaran TEXT NOT NULL,
  jenjang_kelas TEXT NOT NULL,
  buku_judul TEXT NOT NULL,
  chapters_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_mapel_kelas ON curriculum_standard_chapters(mata_pelajaran, jenjang_kelas);
