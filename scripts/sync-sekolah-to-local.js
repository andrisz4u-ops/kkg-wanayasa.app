import { execSync } from 'child_process';
import fs from 'fs';

console.log('[SYNC] Fetching remote sekolah data from Cloudflare D1...');
const raw = execSync('npx wrangler d1 execute kkg-wanayasa-db --remote --command "SELECT * FROM sekolah" --json', {
  encoding: 'utf-8',
  maxBuffer: 20 * 1024 * 1024
});

const parsed = JSON.parse(raw);
const schools = parsed[0].results;
console.log(`[SYNC] Retrieved ${schools.length} schools from remote database.`);

const statements = [];

for (const s of schools) {
  const escapeSql = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    return "'" + String(val).replace(/'/g, "''") + "'";
  };

  const sql = `INSERT INTO sekolah (id, nama, npsn, tipe, alamat, kepala_sekolah, nip_kepala_sekolah, jumlah_guru, is_sekretariat, is_sekolah_penggerak, keterangan, kop_surat_url, tenant_id, created_at, updated_at) 
VALUES (${s.id}, ${escapeSql(s.nama)}, ${escapeSql(s.npsn)}, ${escapeSql(s.tipe)}, ${escapeSql(s.alamat)}, ${escapeSql(s.kepala_sekolah)}, ${escapeSql(s.nip_kepala_sekolah)}, ${s.jumlah_guru ?? 'NULL'}, ${s.is_sekretariat ? 1 : 0}, ${s.is_sekolah_penggerak ? 1 : 0}, ${escapeSql(s.keterangan)}, ${escapeSql(s.kop_surat_url)}, ${escapeSql(s.tenant_id)}, ${escapeSql(s.created_at)}, ${escapeSql(s.updated_at)})
ON CONFLICT(id) DO UPDATE SET 
  nama = excluded.nama,
  npsn = excluded.npsn,
  tipe = excluded.tipe,
  alamat = excluded.alamat,
  kepala_sekolah = excluded.kepala_sekolah,
  nip_kepala_sekolah = excluded.nip_kepala_sekolah,
  jumlah_guru = excluded.jumlah_guru,
  is_sekretariat = excluded.is_sekretariat,
  is_sekolah_penggerak = excluded.is_sekolah_penggerak,
  keterangan = excluded.keterangan,
  kop_surat_url = excluded.kop_surat_url,
  tenant_id = excluded.tenant_id,
  updated_at = excluded.updated_at;`;
  statements.push(sql);
}

const sqlFile = 'temp_sync_sekolah.sql';
fs.writeFileSync(sqlFile, statements.join('\n'), 'utf-8');
console.log(`[SYNC] Generated ${statements.length} SQL statements in ${sqlFile}. Executing into local D1...`);

execSync(`npx wrangler d1 execute kkg-wanayasa-db --local --file=${sqlFile}`, {
  stdio: 'inherit'
});

fs.unlinkSync(sqlFile);
console.log('[SYNC] Successfully synced remote sekolah data to local D1 database!');
