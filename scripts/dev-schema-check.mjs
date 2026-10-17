export const REQUIRED_LOCAL_SCHEMA = {
  users: ['id'],
  sertifikat_presensi: ['nomor_sertifikat'],
  pengumuman: ['id'],
  kegiatan: ['id'],
  calendar_events: ['id', 'kegiatan_id'],
  ai_generation_logs: ['id', 'user_id', 'user_nama', 'sekolah', 'feature_type', 'mata_pelajaran', 'topik', 'jenjang_kelas', 'ai_provider', 'duration_ms', 'classification_quality', 'created_at'],
  ai_user_admission: ['user_id', 'window_start', 'request_count'],
  file_ownership: ['key', 'owner_id', 'tenant_id', 'visibility', 'content_type', 'size', 'filename', 'created_at'],
  certificate_issuance_counter: ['singleton_id', 'next_number'],
  document_drafts: ['user_id', 'module', 'document_id', 'title', 'payload_json', 'revision', 'created_at', 'server_updated_at'],
  document_draft_checkpoints: ['user_id', 'module', 'document_id', 'revision', 'title', 'payload_json', 'created_at'],
  announcement_notification_outbox: ['announcement_id', 'author_id', 'max_recipient_id', 'cursor_recipient_id', 'is_complete', 'title', 'message', 'type', 'created_at'],
  announcement_notification_deliveries: ['announcement_id', 'recipient_id', 'created_at'],
  calendar_event_reservations: ['kegiatan_id', 'event_id', 'created_at'],
  curriculum_source_snapshots: ['digest', 'mata_pelajaran', 'fase', 'source_origin', 'regulation_label', 'locator', 'canonical_content_json', 'recorded_at'],
  document_teacher_reviews: ['id', 'user_id', 'module', 'document_id', 'revision', 'content_hash', 'status', 'mutation_id', 'created_at'],
  bank_soal: ['id', 'is_public', 'moderation_status', 'legacy_compat', 'is_hidden', 'moderation_actor_id', 'moderation_at', 'moderation_event_id', 'revision', 'content_hash', 'client_document_id', 'content_write_token', 'copy_source_id', 'copy_source_revision', 'copy_source_hash'],
  bank_soal_moderation_audit: ['id', 'bank_soal_id', 'actor_id', 'action', 'created_at'],
  assessment_image_assets: ['id', 'owner_id', 'mime', 'byte_length', 'sha256', 'bytes', 'created_at'],
  bank_soal_assets: ['bank_soal_id', 'asset_id', 'created_at'],
  bank_soal_write_tokens: ['token', 'bank_soal_id', 'revision', 'created_at'],
  assessment_generation_requests: ['owner_id', 'client_document_id', 'request_hash', 'hash_schema', 'run_token', 'state', 'package_id', 'result_json', 'failure_code', 'created_at', 'updated_at'],
};

export class MissingLocalSchemaError extends Error {
  constructor(missing) {
    super(`Skema database lokal belum siap: ${missing.join(', ')}`);
    this.name = 'MissingLocalSchemaError';
    this.missing = missing;
  }
}

export async function inspectLocalSchema(db) {
  const missing = [];
  let hasCertificateCounterTable = false;

  for (const [table, columns] of Object.entries(REQUIRED_LOCAL_SCHEMA)) {
    const tableRow = await db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name = ?")
      .bind(table)
      .first();
    if (!tableRow) {
      missing.push(`${table} (tabel)`);
      continue;
    }
    if (table === 'certificate_issuance_counter') hasCertificateCounterTable = true;

    const { results } = await db.prepare(`PRAGMA table_info('${table}')`).all();
    const existingColumns = new Set(results.map(column => column.name));
    for (const column of columns) {
      if (!existingColumns.has(column)) missing.push(`${table}.${column}`);
    }
  }

  if (hasCertificateCounterTable) {
    const counterSeed = await db.prepare('SELECT singleton_id FROM certificate_issuance_counter WHERE singleton_id = 1').first();
    if (!counterSeed) missing.push('certificate_issuance_counter singleton_id=1 (seed)');
  }

  return missing;
}

export async function assertLocalSchemaReady({ getPlatformProxy, configPath }) {
  let proxy;
  try {
    proxy = await getPlatformProxy({ configPath, remoteBindings: false, envFiles: [] });
    const db = proxy.env?.DB;
    if (!db) throw new Error('Binding D1 lokal DB tidak tersedia dari konfigurasi Wrangler.');
    const missing = await inspectLocalSchema(db);
    if (missing.length) throw new MissingLocalSchemaError(missing);
  } finally {
    await proxy?.dispose();
  }
}

export async function runIfLocalSchemaReady({ getPlatformProxy, configPath, logger = console }, startDev) {
  try {
    await assertLocalSchemaReady({ getPlatformProxy, configPath });
  } catch (error) {
    logger.error('[DEV] Pemeriksaan skema D1 lokal gagal:', error);
    logger.error('Perbaiki database lokal saja dengan `npm run db:migrate:local`, lalu jalankan ulang `npm run dev`.');
    return false;
  }

  await startDev();
  return true;
}
