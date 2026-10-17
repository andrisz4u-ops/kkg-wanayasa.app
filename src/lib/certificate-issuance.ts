type D1 = D1Database;

const SUFFIX = '/KKG-G3.WNY/';
const DRAFT_PREFIX = 'DRAFT-';

export function hasCompleteReflections(row: any): boolean {
  return ['refleksi_konsep', 'refleksi_tantangan', 'refleksi_rencana_aksi']
    .every((key) => typeof row?.[key] === 'string' && row[key].trim().length > 0);
}

export function isValidCertificateDate(date: unknown): boolean {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(date)) return false;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return false;
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
}

function parseLegacyNumber(value: unknown): number | null {
  if (typeof value !== 'string' || value.startsWith(DRAFT_PREFIX)) return null;
  const match = value.match(/^.+\/(\d+)\/KKG-G3\.WNY\/(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\/\d{4}$/);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

/** Upgrade only an eligible draft (or eligible legacy terbit placeholder), atomically. */
export async function issueCertificate(db: D1, activityId: number, userId: number): Promise<{ issued: boolean; certificate: any | null }> {
  const [activity, eligibility, existing, counter] = await Promise.all([
    db.prepare(`SELECT id, tanggal, nomor_surat_prefix, ttd_ketua_at, ttd_pengawas_at FROM kegiatan WHERE id = ?`).bind(activityId).first() as Promise<any>,
    db.prepare(`SELECT a.status AS attendance_status, s.refleksi_konsep, s.refleksi_tantangan, s.refleksi_rencana_aksi, s.status AS certificate_status, s.nomor_sertifikat
      FROM absensi a LEFT JOIN sertifikat_presensi s ON s.kegiatan_id = a.kegiatan_id AND s.user_id = a.user_id
      WHERE a.kegiatan_id = ? AND a.user_id = ?`).bind(activityId, userId).first() as Promise<any>,
    db.prepare(`SELECT id, nomor_sertifikat, token_hash, status FROM sertifikat_presensi WHERE kegiatan_id = ? AND user_id = ?`).bind(activityId, userId).first() as Promise<any>,
    db.prepare(`SELECT singleton_id FROM certificate_issuance_counter WHERE singleton_id = 1`).first() as Promise<any>
  ]);
  if (!counter) throw new Error('Certificate issuance counter is not configured; apply migration 0034.');
  const validDate = isValidCertificateDate(activity?.tanggal);
  const date = validDate ? new Date(activity.tanggal) : null;
  const prefix = typeof activity?.nomor_surat_prefix === 'string' && activity.nomor_surat_prefix.trim()
    ? activity.nomor_surat_prefix.trim() : '421.2';
  if (!activity || !date || !eligibility || eligibility.attendance_status !== 'hadir' ||
      !hasCompleteReflections(eligibility) || !activity.ttd_ketua_at || !activity.ttd_pengawas_at ||
      !existing || !['draft', 'terbit'].includes(existing.status) ||
      !existing.nomor_sertifikat?.startsWith(DRAFT_PREFIX)) {
    return { issued: false, certificate: existing || null };
  }

  const legacy = await db.prepare(`SELECT nomor_sertifikat FROM sertifikat_presensi WHERE nomor_sertifikat IS NOT NULL`).all();
  let seed = 0;
  for (const row of legacy.results || []) {
    const number = parseLegacyNumber((row as any).nomor_sertifikat);
    if (number === null && !(row as any).nomor_sertifikat?.startsWith(DRAFT_PREFIX)) {
      console.error('Malformed legacy certificate number ignored during counter seeding:', (row as any).nomor_sertifikat);
    } else if (number !== null) seed = Math.max(seed, number);
  }

  const batch = await db.batch([
    db.prepare(`UPDATE certificate_issuance_counter SET next_number = MAX(next_number, ?)
      WHERE singleton_id = 1`).bind(seed),
    db.prepare(`UPDATE certificate_issuance_counter SET next_number = next_number + 1
      WHERE singleton_id = 1
        AND EXISTS (SELECT 1 FROM kegiatan k JOIN absensi a ON a.kegiatan_id = k.id
          JOIN sertifikat_presensi s ON s.kegiatan_id = a.kegiatan_id AND s.user_id = a.user_id
          WHERE k.id = ? AND a.user_id = ? AND a.status = 'hadir'
            AND length(trim(COALESCE(s.refleksi_konsep, ''))) > 0
            AND length(trim(COALESCE(s.refleksi_tantangan, ''))) > 0
            AND length(trim(COALESCE(s.refleksi_rencana_aksi, ''))) > 0
            AND k.ttd_ketua_at = ? AND k.ttd_pengawas_at = ?
            AND k.tanggal = ? AND COALESCE(k.nomor_surat_prefix, '421.2') = ?
            AND s.status IN ('draft', 'terbit')
            AND s.nomor_sertifikat LIKE 'DRAFT-%')`).bind(activityId, userId, activity.ttd_ketua_at, activity.ttd_pengawas_at, activity.tanggal, activity.nomor_surat_prefix ?? '421.2'),
    db.prepare(`UPDATE sertifikat_presensi SET
        nomor_sertifikat = (SELECT ? || '/' || printf('%03d', next_number) || '/KKG-G3.WNY/' || ? || '/' || ? FROM certificate_issuance_counter WHERE singleton_id = 1),
        status = 'terbit'
      WHERE kegiatan_id = ? AND user_id = ? AND status IN ('draft', 'terbit')
        AND nomor_sertifikat LIKE 'DRAFT-%'
        AND EXISTS (SELECT 1 FROM kegiatan k JOIN absensi a ON a.kegiatan_id = k.id
          WHERE k.id = ? AND a.user_id = ? AND a.status = 'hadir'
            AND length(trim(COALESCE(sertifikat_presensi.refleksi_konsep, ''))) > 0
            AND length(trim(COALESCE(sertifikat_presensi.refleksi_tantangan, ''))) > 0
            AND length(trim(COALESCE(sertifikat_presensi.refleksi_rencana_aksi, ''))) > 0
            AND k.ttd_ketua_at = ? AND k.ttd_pengawas_at = ?
            AND k.tanggal = ? AND COALESCE(k.nomor_surat_prefix, '421.2') = ?)`) 
      .bind(prefix, ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][date.getUTCMonth()], String(date.getUTCFullYear()), activityId, userId, activityId, userId, activity.ttd_ketua_at, activity.ttd_pengawas_at, activity.tanggal, activity.nomor_surat_prefix ?? '421.2'),
    db.prepare(`SELECT id, nomor_sertifikat, token_hash, status FROM sertifikat_presensi WHERE kegiatan_id = ? AND user_id = ?`).bind(activityId, userId)
  ]);
  const updated = (batch[2] as any)?.meta?.changes > 0;
  const winner = (batch[3] as any)?.results?.[0] || null;
  return { issued: updated, certificate: winner };
}

export async function issueForActivity(db: D1, activityId: number): Promise<number> {
  const attendees = await db.prepare(`SELECT user_id FROM absensi WHERE kegiatan_id = ? AND status = 'hadir'`).bind(activityId).all();
  let count = 0;
  for (const row of attendees.results || []) {
    if ((await issueCertificate(db, activityId, Number((row as any).user_id))).issued) count++;
  }
  return count;
}

export const READY_CERTIFICATE_SQL = `s.status = 'terbit'
  AND s.nomor_sertifikat IS NOT NULL AND s.nomor_sertifikat NOT LIKE 'DRAFT-%'
  AND a.status = 'hadir'
  AND length(trim(COALESCE(s.refleksi_konsep, ''))) > 0
  AND length(trim(COALESCE(s.refleksi_tantangan, ''))) > 0
  AND length(trim(COALESCE(s.refleksi_rencana_aksi, ''))) > 0
  AND k.ttd_ketua_at IS NOT NULL AND k.ttd_pengawas_at IS NOT NULL`;
