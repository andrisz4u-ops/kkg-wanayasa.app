import { canonicalSchoolKey, formatStandardSchoolName } from './school-normalizer';

export type ResolvedSchool = { sekolah: string | null; sekolah_id: number | null };

/** Resolve only a unique normalized catalog match; never retain a stale relation. */
export async function resolveProfileSchool(db: D1Database, input: unknown): Promise<ResolvedSchool> {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (!trimmed) return { sekolah: null, sekolah_id: null };

  const normalizedText = formatStandardSchoolName(trimmed);
  const key = canonicalSchoolKey(trimmed);
  const { results = [] } = await db.prepare('SELECT id, nama FROM sekolah').all();
  const matches = (results as { id: number; nama: string }[])
    .filter(school => canonicalSchoolKey(school.nama) === key);

  if (matches.length === 1) {
    return { sekolah: matches[0].nama, sekolah_id: matches[0].id };
  }
  return { sekolah: normalizedText, sekolah_id: null };
}
