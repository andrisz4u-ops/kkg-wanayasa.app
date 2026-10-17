// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import banksoal from '../src/routes/banksoal';
import assets from '../src/routes/assessment-assets';
import { getCookie, getCurrentUser } from '../src/lib/auth';

const enabled = process.env.KKG_RUN_D1_INTEGRATION === '1';
const timeoutMs = 90_000;
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64'));
const assetId = '123e4567-e89b-42d3-a456-426614174001';

describe.skipIf(!enabled)('assessment package routes on isolated Wrangler D1', () => {
  it('runs asset, package, moderation, copy, revision, and CAS regressions on real Miniflare D1', async () => {
    const tempParent = join(tmpdir(), 'opencode');
    await mkdir(tempParent, { recursive: true });
    const root = await mkdtemp(join(tempParent, 'kkg-assessment-d1-'));
    const state = join(root, 'state');
    const configPath = join(root, 'wrangler.jsonc');
    let proxy: Awaited<ReturnType<typeof getPlatformProxy>> | undefined;
    const env = () => proxy!.env as { DB: D1Database };
    const request = (route: typeof banksoal | typeof assets, path: string, method: string, session: string, body?: unknown) =>
      route.request(path, { method, headers: { Cookie: `session=${session}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, env());
    try {
      await writeFile(configPath, JSON.stringify({ name: 'assessment-d1-isolated', compatibility_date: '2026-10-17', d1_databases: [{ binding: 'DB', database_name: 'assessment-isolated', database_id: '00000000-0000-0000-0000-000000000001' }] }));
      proxy = await getPlatformProxy({ configPath, remoteBindings: false, envFiles: [], persist: { path: state } });
      const db = (proxy.env as { DB: D1Database }).DB;
      const execSql = async (file: string) => {
        const sql = await readFile(resolve('migrations', file), 'utf8');
        const executable = sql.replace(/^\s*--.*$/gm, '').replace(/CREATE TRIGGER[\s\S]*?END\s*;/gi, '');
        for (const statement of executable.split(';').map((value: string) => value.trim()).filter(Boolean)) {
          try { await db.prepare(statement).run(); } catch (error) { throw new Error(`${file}: ${statement.slice(0, 100)}`, { cause: error }); }
        }
      };
      await db.prepare('CREATE TABLE users (id INTEGER PRIMARY KEY, nama TEXT, email TEXT, password_hash TEXT, role TEXT, role_label TEXT, nip TEXT, sekolah TEXT, mata_pelajaran TEXT, no_hp TEXT, foto_url TEXT, sekolah_id INTEGER, tenant_id TEXT)').run();
      await db.prepare('CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT)').run();
      await db.prepare('CREATE TABLE sekolah (id INTEGER PRIMARY KEY, nama TEXT, kepala_sekolah TEXT, nip_kepala_sekolah TEXT, kop_surat_url TEXT, npsn TEXT, alamat TEXT)').run();
      await execSql('0018_bank_soal.sql');
      for (const file of ['0040_bank_soal_moderation.sql', '0041_assessment_image_assets.sql', '0042_assessment_package_revisions.sql', '0043_assessment_generation_requests.sql']) await execSql(file);
      await db.prepare('CREATE TABLE ai_generation_jobs (user_id INTEGER NOT NULL, job_id TEXT NOT NULL, state TEXT NOT NULL, lease_until INTEGER NOT NULL, PRIMARY KEY(user_id,job_id))').run();
      await db.prepare("INSERT INTO users(id,nama,email,password_hash,role,sekolah) VALUES(1,'Owner','owner@integration.invalid','x','user','Test School'),(2,'Recipient','recipient@integration.invalid','x','user','Test School'),(3,'Admin','admin@integration.invalid','x','admin','Test School')").run();
      await db.prepare("INSERT INTO sessions(id,user_id,expires_at) VALUES('owner',1,datetime('now','+1 day')),('owner-fresh',1,datetime('now','+1 day')),('recipient',2,datetime('now','+1 day')),('foreign',2,datetime('now','+1 day')),('admin',3,datetime('now','+1 day'))").run();
      expect(await db.prepare("SELECT u.id, u.nama, COALESCE(u.role_label,u.role) AS role FROM sessions sess JOIN users u ON sess.user_id=u.id WHERE sess.id='owner' AND sess.expires_at > datetime('now')").first()).toMatchObject({ id: 1, nama: 'Owner' });
      const rawCookieRequest = new Request('http://integration.test/', { headers: { Cookie: 'session=owner' } });
      expect(getCookie(rawCookieRequest.headers.get('Cookie'), 'session')).toBe('owner');
      expect(await getCurrentUser(db, getCookie(rawCookieRequest.headers.get('Cookie'), 'session'))).toMatchObject({ id: 1, nama: 'Owner' });

      const upload = await assets.request('/', { method: 'POST', headers: { Cookie: 'session=owner', 'Content-Type': 'image/png', 'X-Asset-Id': assetId }, body: png }, env());
      expect(upload.status).toBe(201);
      const create = await request(banksoal, '/', 'POST', 'owner', { mata_pelajaran: 'IPAS', topik: 'D1 integration', jenjang_kelas: '5', content: { pg: [{ no: 1, soal: 'Original', gambar: { assetId } }] } });
      expect(create.status, await create.clone().text()).toBe(200); const created = await create.json() as any; const id = created.data.id;
      const detail = await request(banksoal, `/${id}`, 'GET', 'owner-fresh'); const detailJson = await detail.json() as any;
      expect(detail.status).toBe(200); expect(detailJson.data.content.pg[0].gambar.url).toBe(`/api/banksoal/${id}/assets/${assetId}`);
      expect((await request(banksoal, `/${id}`, 'GET', 'foreign')).status).toBe(404);
      const privateImage = await request(banksoal, `/${id}/assets/${assetId}`, 'GET', 'owner-fresh');
      expect(privateImage.status).toBe(200); expect(new Uint8Array(await privateImage.arrayBuffer())).toEqual(png);

      expect((await request(banksoal, `/${id}/share`, 'POST', 'owner', { share: true })).status).toBe(200);
      const moderation = await db.prepare('SELECT revision FROM bank_soal WHERE id=?').bind(id).first();
      expect(moderation).not.toBeNull();
      expect((await request(banksoal, `/moderation/${id}/approve`, 'POST', 'admin', { expectedRevision: (moderation as { revision: number }).revision })).status).toBe(200);
      const publicImage = await request(banksoal, `/${id}/assets/${assetId}`, 'GET', 'foreign');
      expect(publicImage.status).toBe(200); expect(new Uint8Array(await publicImage.arrayBuffer())).toEqual(png);
      const copy = await request(banksoal, `/${id}/copy`, 'POST', 'recipient', {}); expect(copy.status).toBe(200); const copied = await copy.json() as any;
      const copiedId = copied.data.packageId; const copiedAsset = copied.data.content.pg[0].gambar.assetId;
      expect(copiedAsset).not.toBe(assetId);
      const withdrawal = await request(banksoal, `/${id}/share`, 'POST', 'owner', { share: false });
      expect(withdrawal.status).toBe(200);
      expect((await request(banksoal, `/${id}/assets/${assetId}`, 'GET', 'foreign')).status).toBe(404);
      expect((await request(banksoal, `/${id}`, 'DELETE', 'owner')).status).toBe(200);
      const copiedImage = await request(banksoal, `/${copiedId}/assets/${copiedAsset}`, 'GET', 'recipient');
      expect(copiedImage.status).toBe(200); expect(new Uint8Array(await copiedImage.arrayBuffer())).toEqual(png);

      const second = await assets.request('/', { method: 'POST', headers: { Cookie: 'session=owner', 'Content-Type': 'image/png' }, body: png }, env());
      expect(second.status).toBe(201); const secondData = await second.json() as any;
      const editSource = await request(banksoal, '/', 'POST', 'owner', { mata_pelajaran: 'IPAS', topik: 'Revision', jenjang_kelas: '5', content: { pg: [{ no: 1, soal: 'Before' }] } });
      expect(editSource.status).toBe(200); const editId = (await editSource.json() as any).data.id;
      const revision = await db.prepare('SELECT revision FROM bank_soal WHERE id=?').bind(editId).first();
      expect(revision).not.toBeNull();
      const edited = await request(banksoal, `/${editId}`, 'PUT', 'owner', { baseRevision: (revision as { revision: number }).revision, content: { pg: [{ no: 1, soal: 'After', gambar: { assetId: secondData.data.id } }] } });
      expect(edited.status).toBe(200);
      const reloaded: any = await (await request(banksoal, `/${editId}`, 'GET', 'owner-fresh')).json();
      expect(reloaded.data.content.pg[0]).toMatchObject({ soal: 'After', gambar: { assetId: secondData.data.id } });

      const casAsset = await assets.request('/', { method: 'POST', headers: { Cookie: 'session=owner', 'Content-Type': 'image/png' }, body: png }, env());
      expect(casAsset.status).toBe(201);
      const casId = (await casAsset.json() as any).data.id;
      const before: any = await db.prepare('SELECT revision FROM bank_soal WHERE id=?').bind(editId).first();
      const [winner, stale] = await Promise.all([
        request(banksoal, `/${editId}`, 'PUT', 'owner', { baseRevision: before.revision, content: { pg: [{ soal: 'Winner' }] } }),
        request(banksoal, `/${editId}`, 'PUT', 'owner', { baseRevision: before.revision, content: { pg: [{ soal: 'Stale', gambar: { assetId: casId } }] } }),
      ]);
      expect([winner.status, stale.status].sort()).toEqual([200, 409]);
      const winningContent = (await db.prepare('SELECT content FROM bank_soal WHERE id=?').bind(editId).first() as { content: string }).content;
      const winningRefs = JSON.parse(winningContent).pg.flatMap((q: any) => q.gambar?.assetId ? [q.gambar.assetId] : []).sort();
      const associations = (await db.prepare('SELECT asset_id FROM bank_soal_assets WHERE bank_soal_id=?').bind(editId).all<{ asset_id: string }>()).results.map((row: { asset_id: string }) => row.asset_id).sort();
      expect(associations).toEqual(winningRefs);
    } finally {
      try { await proxy?.dispose(); }
      finally { await rm(root, { recursive: true, force: true }); }
    }
  }, timeoutMs);
});
