-- Migration 0026: Book Structure Profiles & Publication Year Support
ALTER TABLE curriculum_standard_chapters ADD COLUMN tahun_terbit INTEGER DEFAULT 2024;
ALTER TABLE curriculum_standard_chapters ADD COLUMN penerbit TEXT;

-- Drop unique index to allow multiple book profiles for the same subject & grade
DROP INDEX IF EXISTS idx_curriculum_mapel_kelas;
DROP INDEX IF EXISTS idx_curr_mapel_kelas;

-- Re-create as non-unique index
CREATE INDEX IF NOT EXISTS idx_curr_mapel_kelas ON curriculum_standard_chapters(mata_pelajaran, jenjang_kelas);
