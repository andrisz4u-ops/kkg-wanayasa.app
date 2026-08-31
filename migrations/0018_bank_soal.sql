-- =============================================
-- Migration: Bank Soal Kolaboratif
-- Server-side persistent question bank with ratings
-- =============================================

-- Main table: 1 row = 1 paket soal yang di-generate
CREATE TABLE IF NOT EXISTS bank_soal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_nama TEXT NOT NULL,
    sekolah TEXT,

    -- Metadata soal
    mata_pelajaran TEXT NOT NULL,
    topik TEXT NOT NULL,
    jenjang_kelas TEXT NOT NULL,
    semester TEXT,
    jenis_ujian TEXT,
    capaian_pembelajaran TEXT,

    -- Konfigurasi generate
    jumlah_pg INTEGER DEFAULT 0,
    jumlah_isian INTEGER DEFAULT 0,
    jumlah_uraian INTEGER DEFAULT 0,
    isian_type TEXT DEFAULT 'Standard',
    hots_ratio TEXT DEFAULT '30:40:30',

    -- Konten soal (JSON lengkap dari hasil generate)
    content TEXT NOT NULL,

    -- Statistik & visibilitas
    is_public INTEGER DEFAULT 1,
    use_count INTEGER DEFAULT 0,
    avg_rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,

    -- AI metadata
    ai_provider TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Review/rating table
CREATE TABLE IF NOT EXISTS bank_soal_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_soal_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    komentar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(bank_soal_id, user_id)
);

-- Indexes for performant queries
CREATE INDEX IF NOT EXISTS idx_bank_soal_user ON bank_soal(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_soal_mapel ON bank_soal(mata_pelajaran);
CREATE INDEX IF NOT EXISTS idx_bank_soal_kelas ON bank_soal(jenjang_kelas);
CREATE INDEX IF NOT EXISTS idx_bank_soal_public ON bank_soal(is_public);
CREATE INDEX IF NOT EXISTS idx_bank_soal_rating ON bank_soal(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_bank_soal_created ON bank_soal(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bank_soal_reviews_bs ON bank_soal_reviews(bank_soal_id);

-- Trigger: auto-update rating cache on INSERT review
CREATE TRIGGER IF NOT EXISTS update_bank_soal_rating_insert
AFTER INSERT ON bank_soal_reviews
BEGIN
    UPDATE bank_soal SET
        avg_rating = (SELECT AVG(rating) FROM bank_soal_reviews WHERE bank_soal_id = NEW.bank_soal_id),
        total_reviews = (SELECT COUNT(*) FROM bank_soal_reviews WHERE bank_soal_id = NEW.bank_soal_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.bank_soal_id;
END;

-- Trigger: auto-update rating cache on DELETE review
CREATE TRIGGER IF NOT EXISTS update_bank_soal_rating_delete
AFTER DELETE ON bank_soal_reviews
BEGIN
    UPDATE bank_soal SET
        avg_rating = COALESCE((SELECT AVG(rating) FROM bank_soal_reviews WHERE bank_soal_id = OLD.bank_soal_id), 0),
        total_reviews = (SELECT COUNT(*) FROM bank_soal_reviews WHERE bank_soal_id = OLD.bank_soal_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.bank_soal_id;
END;
