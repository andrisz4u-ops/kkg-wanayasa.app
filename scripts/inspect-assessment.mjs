#!/usr/bin/env node
/**
 * Laporan hasil generate asesmen: jumlah butir PG, gambar SVG, raster tersimpan,
 * butir yang gagal, serta verifikasi bahwa setiap assetId benar-benar ada di D1.
 *
 * Pemakaian:
 *   npm run inspect:assessment
 *   npm run inspect:assessment -- --id 9
 *   npm run inspect:assessment -- --limit 3 --remote
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const idIndex = args.indexOf('--id');
const limitIndex = args.indexOf('--limit');
const packageId = idIndex >= 0 ? Number(args[idIndex + 1]) : null;
const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : 5;

const scope = packageId ? `WHERE bs.id = ${packageId}` : '';
const limitClause = packageId ? '' : `LIMIT ${limit}`;

const sql = `
SELECT bs.id AS package_id, bs.topik, bs.created_at, bs.revision,
  (SELECT COUNT(*) FROM json_each(bs.content,'$.pg')) AS pg_total,
  (SELECT COUNT(*) FROM json_each(bs.content,'$.pg') WHERE json_extract(value,'$.gambar.type') = 'svg') AS svg_count,
  (SELECT COUNT(*) FROM json_each(bs.content,'$.pg') WHERE json_extract(value,'$.gambar.assetId') IS NOT NULL) AS raster_count,
  (SELECT COUNT(*) FROM json_each(bs.content,'$.pg') WHERE json_extract(value,'$.gambar.imageUnavailable') = 1) AS unavailable_count,
  (SELECT COUNT(*) FROM json_each(bs.content,'$.pg') WHERE lower(COALESCE(json_extract(value,'$.gambar.url'),'')) LIKE '%x-amz-expires%') AS presigned_count
FROM bank_soal bs ${scope} ORDER BY bs.id DESC ${limitClause};

SELECT bs.id AS package_id, json_extract(value,'$.no') AS no,
  json_extract(value,'$.gambar.imageUnavailableReason') AS reason
FROM bank_soal bs, json_each(bs.content,'$.pg')
WHERE json_extract(value,'$.gambar.imageUnavailable') = 1
${packageId ? `AND bs.id = ${packageId}` : ''}
ORDER BY bs.id DESC, no;

SELECT bs.id AS package_id, json_extract(value,'$.gambar.assetId') AS asset_id
FROM bank_soal bs, json_each(bs.content,'$.pg')
WHERE json_extract(value,'$.gambar.assetId') IS NOT NULL
${packageId ? `AND bs.id = ${packageId}` : ''};

SELECT id FROM assessment_image_assets;

SELECT COUNT(*) AS assets, COALESCE(SUM(byte_length),0) AS bytes FROM assessment_image_assets;
`;

function runQuery(text) {
  const dir = mkdtempSync(join(tmpdir(), 'opencode', 'kkg-inspect-'));
  const file = join(dir, 'inspect.sql');
  try {
    writeFileSync(file, text, 'utf8');
    const out = execFileSync(
      process.execPath,
      ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'kkg-wanayasa-db', remote ? '--remote' : '--local', `--file=${file}`, '--json'],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    );
    const start = out.indexOf('[');
    if (start < 0) throw new Error('Wrangler tidak mengembalikan JSON.');
    return JSON.parse(out.slice(start, out.lastIndexOf(']') + 1));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

let result;
try {
  result = runQuery(sql);
} catch (error) {
  console.error(`Gagal membaca database: ${error.message}`);
  process.exitCode = 1;
  process.exit();
}

const packages = result[0]?.results ?? [];
const failures = result[1]?.results ?? [];
const references = result[2]?.results ?? [];
const storedAssets = result[3]?.results ?? [];
const assetTotals = result[4]?.results?.[0] ?? { assets: 0, bytes: 0 };

if (!packages.length) {
  console.log('Tidak ada paket asesmen untuk diperiksa.');
  process.exit();
}

console.log(`${remote ? 'REMOTE' : 'LOKAL'} · ${packages.length} paket · ${assetTotals.assets} aset (${assetTotals.bytes} byte)\n`);

let brokenReferences = 0;
const stored = new Set(storedAssets.map(row => String(row.id)));

for (const pkg of packages) {
  const failed = failures.filter(row => row.package_id === pkg.package_id);
  const numeric = Number(pkg.raster_count) || 0;
  const name = String(pkg.topik ?? '(tanpa topik)');
  console.log(`Paket ${pkg.package_id} · ${name} · ${pkg.created_at} · rev ${pkg.revision}`);
  console.log(`  PG ${pkg.pg_total} | SVG ${pkg.svg_count ?? 0} | raster tersimpan ${numeric} | gagal ${pkg.unavailable_count ?? 0}`);
  if (Number(pkg.presigned_count) > 0) {
    console.log(`  ! ${pkg.presigned_count} gambar memakai URL presigned (kedaluwarsa) - akan ditandai saat dibuka`);
  }

  if (failed.length) {
    const grouped = new Map();
    for (const row of failed) {
      const reason = row.reason || 'unknown';
      const list = grouped.get(reason) ?? [];
      list.push(row.no ?? '?');
      grouped.set(reason, list);
    }
    for (const [reason, numbers] of grouped) {
      const hint = {
        expired_or_missing: 'URL presigned kedaluwarsa -> generate ulang atau ganti gambar',
        required_image_missing: 'soal menuntut gambar tetapi tidak ada sumber -> ganti soal',
        image_search_unavailable: 'provider gambar tidak aktif / tanpa key',
        quota_count: 'kuota jumlah aset per pengguna penuh',
        quota_bytes: 'kuota byte aset per pengguna penuh',
        package_image_count_limit: 'batas 8 gambar per paket',
        package_image_byte_limit: 'batas 4 MB gambar per paket',
        invalid_image: 'berkas gambar tidak valid (bukan PNG/JPEG/WebP)',
        image_not_selected: 'butir tidak terpilih dalam kuota gambar',
      }[reason];
      console.log(`  ! ${reason}: soal ${numbers.join(', ')}${hint ? ` - ${hint}` : ''}`);
    }
  }

  const refs = references.filter(row => row.package_id === pkg.package_id);
  if (refs.length) {
    const missing = refs.filter(row => !stored.has(String(row.asset_id)));
    if (missing.length) {
      brokenReferences += missing.length;
      console.log(`  ! ${missing.length} aset dirujuk tetapi tidak ada di tabel aset`);
    }
  }
  console.log('');
}

if (brokenReferences) {
  console.log(`HASIL: ${brokenReferences} rujukan aset rusak.`);
  process.exitCode = 1;
} else {
  console.log('HASIL: semua rujukan aset konsisten.');
}
