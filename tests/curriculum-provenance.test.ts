import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SqliteD1 } from './helpers/sqlite-d1';
import { attachCurriculumProvenance, recordCurriculumSnapshot, sha256Canonical } from '../src/lib/curriculum-provenance';
import { getDynamicCP, getDynamicCPWithSource, getOfficialCP } from '../src/lib/cp-data';
import { buildRppPrompt } from '../src/routes/rpp';

const databases: SqliteD1[] = [];
function dbWithMigration() {
  const db = new SqliteD1();
  databases.push(db);
  db.sqlite.exec(readFileSync('migrations/0038_curriculum_source_provenance.sql', 'utf8'));
  return db;
}
afterEach(() => { while (databases.length) databases.pop()!.close(); });

describe('curriculum provenance snapshots', () => {
  it('canonical hashes are deterministic and change when component content changes', async () => {
    expect(await sha256Canonical({ b: 2, a: 1 })).toBe(await sha256Canonical({ a: 1, b: 2 }));
    expect(await sha256Canonical('CP A')).not.toBe(await sha256Canonical('CP B'));
  });

  it('records D1, static, user-input, and mixed component origins with honest snapshot status', async () => {
    const db = dbWithMigration();
    const d1 = await recordCurriculumSnapshot({ db, subject: 'IPAS', phase: 'Fase C', components: { cp: { text: 'D1 CP', origin: 'd1' } } });
    const statik = await recordCurriculumSnapshot({ db, subject: 'IPAS', phase: 'Fase C', components: { cp: { text: 'Static CP', origin: 'static' } } });
    const user = await recordCurriculumSnapshot({ db, subject: 'IPAS', phase: 'Fase C', components: { cp: { text: 'Guru supplied CP', origin: 'user-input' } } });
    const mixed = await recordCurriculumSnapshot({ db, subject: 'IPAS', phase: 'Fase C', components: { cp: { text: 'D1 CP', origin: 'd1' }, elements: { text: 'static element', origin: 'static' } } });
    expect(d1).toMatchObject({ source: 'd1', status: 'recorded', reviewed: false });
    expect(statik).toMatchObject({ source: 'static', status: 'recorded' });
    expect(user).toMatchObject({ source: 'user-input', status: 'recorded' });
    expect(mixed).toMatchObject({ source: 'mixed', status: 'recorded', components: { cp: { origin: 'd1' }, elements: { origin: 'static' } } });

    const unavailable = await recordCurriculumSnapshot({ subject: 'IPAS', phase: 'Fase C', components: { cp: { text: 'CP', origin: 'user-input' } } });
    expect(unavailable.status).toBe('not-recorded');
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM curriculum_source_snapshots').get()).toMatchObject({ count: 4 });
  });

  it('uses immutable digest snapshots under concurrent/repeated writes and prevents mutation', async () => {
    const db = dbWithMigration();
    const args = { db, subject: 'IPAS', phase: 'Fase C', components: { cp: { text: 'Exact CP', origin: 'd1' as const } } };
    const [first, retry] = await Promise.all([recordCurriculumSnapshot(args), recordCurriculumSnapshot(args)]);
    expect(first.digest).toBe(retry.digest);
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM curriculum_source_snapshots').get()).toMatchObject({ count: 1 });
    expect(() => db.sqlite.prepare('UPDATE curriculum_source_snapshots SET canonical_content_json = ?').run('{}')).toThrow();
    expect(() => db.sqlite.prepare('DELETE FROM curriculum_source_snapshots').run()).toThrow();
  });

  it('uses a distinct immutable identity when identical text has different origins or stored source facts', async () => {
    const db = dbWithMigration();
    const shared = { subject: 'IPAS', phase: 'Fase C', components: { cp: { text: 'Same exact CP', origin: 'static' as const } } };
    const original = await recordCurriculumSnapshot({ ...shared, db, regulationLabel: 'Label A', locator: 'catalogue-a' });
    const originChanged = await recordCurriculumSnapshot({
      ...shared, db,
      components: { cp: { text: 'Same exact CP', origin: 'd1' } },
      regulationLabel: 'Label A', locator: 'catalogue-a',
    });
    const labelChanged = await recordCurriculumSnapshot({ ...shared, db, regulationLabel: 'Label B', locator: 'catalogue-a' });
    const locatorChanged = await recordCurriculumSnapshot({ ...shared, db, regulationLabel: 'Label A', locator: 'catalogue-b' });

    expect(new Set([original.digest, originChanged.digest, labelChanged.digest, locatorChanged.digest]).size).toBe(4);
    expect([original, originChanged, labelChanged, locatorChanged].every(row => row.status === 'recorded')).toBe(true);
    const stored: any = db.sqlite.prepare('SELECT source_origin, regulation_label, locator FROM curriculum_source_snapshots WHERE digest = ?').get(originChanged.digest);
    expect(stored).toEqual({ source_origin: 'd1', regulation_label: 'Label A', locator: 'catalogue-a' });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS count FROM curriculum_source_snapshots').get()).toMatchObject({ count: 4 });
  });

  it('keeps legacy CP string lookup unchanged while source-aware lookup distinguishes D1 and static', async () => {
    const expected = getOfficialCP('IPAS', 'Kelas 5');
    expect(await getDynamicCP(undefined, 'IPAS', 'Kelas 5')).toBe(expected);
    const statik = await getDynamicCPWithSource(undefined, 'IPAS', 'Kelas 5');
    expect(statik).toMatchObject({ text: expected, origin: 'static' });

    const d1 = { prepare: () => ({ bind: () => ({ all: async () => ({ results: [{ mata_pelajaran: 'IPAS', fase: 'Fase C', teks_cp: 'D1 CP snapshot', regulasi: 'Existing label' }] }) }) }) };
    expect(await getDynamicCPWithSource(d1, 'IPAS', 'Kelas 5')).toMatchObject({ text: 'D1 CP snapshot', origin: 'd1', regulationLabel: 'Existing label' });
  });

  it('attaches server metadata without replacing output or rewriting older content', async () => {
    const db = dbWithMigration();
    const snapshot = await recordCurriculumSnapshot({ db, subject: 'IPAS', phase: 'Fase C', components: { cp: { text: 'Old prompt CP', origin: 'static' } } });
    const oldOutput = { body: 'Generated using old prompt CP', _provenance: { unrelated: true } };
    const generated = attachCurriculumProvenance(oldOutput, snapshot);
    function hasCurriculumMetadata(value: typeof generated): value is typeof generated & { _provenance: { curriculum: { digest: string }; unrelated?: boolean } } {
      const metadata = value._provenance;
      return typeof metadata === 'object' && metadata !== null
        && 'curriculum' in metadata && typeof metadata.curriculum === 'object' && metadata.curriculum !== null
        && 'digest' in metadata.curriculum && typeof metadata.curriculum.digest === 'string';
    }
    expect(hasCurriculumMetadata(generated)).toBe(true);
    if (!hasCurriculumMetadata(generated)) throw new Error('Curriculum provenance metadata was not attached');
    expect(generated.body).toBe(oldOutput.body);
    expect(generated._provenance.curriculum.digest).toBe(snapshot.digest);
    expect(generated._provenance.unrelated).toBe(true);
    const savedJson = JSON.stringify(generated);
    expect(JSON.parse(savedJson)._provenance.curriculum.digest).toBe(snapshot.digest);
  });

  it('keeps the exact caller CP text in the RPP prompt and hashes that same prompt input', async () => {
    const db = dbWithMigration();
    const exactCp = 'Guru input: “Murid menafsirkan data setempat.”  '; // whitespace and punctuation are part of the supplied string
    const prompt = buildRppPrompt({ mataPelajaran: 'IPAS', topik: 'Data', jenjangKelas: 'Kelas 5' }, exactCp, {}, 70, { origin: 'user-input' });
    expect(prompt).toContain(`"${exactCp}"`);
    expect(prompt).toContain('masukan guru (belum ditinjau)');
    expect(prompt).not.toContain('Capaian Pembelajaran resmi BSKAP');
    const snapshot = await recordCurriculumSnapshot({
      db, subject: 'IPAS', phase: 'Fase C',
      components: { cp: { text: exactCp, origin: 'user-input' } },
    });
    expect(snapshot.source).toBe('user-input');
    expect(snapshot.components.cp.digest).toBe(await sha256Canonical(exactCp));
    expect(snapshot.digest).toBeTruthy();
  });

  it('does not assign a regulation or official-status wording when RPP source is unreviewed static catalogue', () => {
    const prompt = buildRppPrompt({ mataPelajaran: 'Matematika', topik: 'Bilangan', jenjangKelas: 'Kelas 5' }, 'CP statis', {}, 70, { origin: 'static' });
    expect(prompt).toContain('fallback katalog statis aplikasi yang belum ditinjau');
    expect(prompt).not.toContain('BSKAP No. 046 Tahun 2025');
  });
});
