/** Shared visibility contract for every bank-soal writer and reader. */
export const BANK_SOAL_PUBLIC_PREDICATE = `(
  bs.is_hidden = 0 AND (
    bs.is_public = 1 AND (bs.moderation_status = 'approved' OR bs.legacy_compat = 1)
  )
)`;

export const BANK_SOAL_ACCESS_PREDICATE = `(${BANK_SOAL_PUBLIC_PREDICATE} OR bs.user_id = ?)`;

/** Values every new bank-soal writer (including generator auto-save) must use. */
export const BANK_SOAL_PRIVATE_VISIBILITY = Object.freeze({
  is_public: 0,
  moderation_status: 'private' as const,
  legacy_compat: 0,
  is_hidden: 0,
});

export function bankSoalCreationVisibility() {
  return { ...BANK_SOAL_PRIVATE_VISIBILITY };
}

/** Idempotent runtime parity. Does not backfill legacy status; migration owns that one-time action. */
export async function ensureBankSoalModerationSchema(db: D1Database): Promise<void> {
  const create = async (sql: string) => { await db.prepare(sql).run(); };
  await create(`CREATE TABLE IF NOT EXISTS bank_soal (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, user_nama TEXT NOT NULL, sekolah TEXT,
    mata_pelajaran TEXT NOT NULL, topik TEXT NOT NULL, jenjang_kelas TEXT NOT NULL, semester TEXT,
    jenis_ujian TEXT, capaian_pembelajaran TEXT, jumlah_pg INTEGER DEFAULT 0, jumlah_isian INTEGER DEFAULT 0,
    jumlah_uraian INTEGER DEFAULT 0, isian_type TEXT DEFAULT 'Standard', hots_ratio TEXT DEFAULT '30:40:30',
    content TEXT NOT NULL, is_public INTEGER DEFAULT 0, use_count INTEGER DEFAULT 0, avg_rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0, ai_provider TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, moderation_status TEXT NOT NULL DEFAULT 'private',
    legacy_compat INTEGER NOT NULL DEFAULT 0, is_hidden INTEGER NOT NULL DEFAULT 0,
    moderation_actor_id INTEGER, moderation_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  const info = await db.prepare('PRAGMA table_info(bank_soal)').all();
  const existing = new Set((info.results || []).map((col: any) => col.name));
  const columns: Array<[string, string]> = [
    ['moderation_status', "TEXT NOT NULL DEFAULT 'private'"],
    ['legacy_compat', 'INTEGER NOT NULL DEFAULT 0'],
    ['is_hidden', 'INTEGER NOT NULL DEFAULT 0'],
    ['moderation_actor_id', 'INTEGER'],
    ['moderation_at', 'DATETIME'],
    ['moderation_event_id', 'TEXT'],
  ];
  for (const [name, definition] of columns) if (!existing.has(name)) await create(`ALTER TABLE bank_soal ADD COLUMN ${name} ${definition}`);
  await create(`CREATE TABLE IF NOT EXISTS bank_soal_moderation_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT, bank_soal_id INTEGER NOT NULL, actor_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('approved','hidden','unhidden','share_withdrawn')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_soal_id) REFERENCES bank_soal(id) ON DELETE CASCADE
  )`);
  await create('CREATE INDEX IF NOT EXISTS idx_bank_soal_moderation_public ON bank_soal(is_public, moderation_status, is_hidden)');
  await create('CREATE INDEX IF NOT EXISTS idx_bank_soal_legacy ON bank_soal(legacy_compat)');
}
