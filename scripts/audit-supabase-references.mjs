import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Read-only audit: return column names and counts, never stored values or keys.
const remote = process.argv.includes('--remote');
const database = 'kkg-wanayasa-db';
const wrangler = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
function query(sql) {
    const result = spawnSync(process.execPath, [wrangler, 'd1', 'execute', database,
        remote ? '--remote' : '--local', '--command', sql, '--json'], {
        cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    });
    if (result.status !== 0) {
        process.stderr.write(result.stderr || result.stdout || result.error?.message || 'Wrangler tidak mengembalikan diagnostik.');
        throw new Error('Audit D1 gagal. Periksa autentikasi dan akses database Cloudflare.');
    }
    const responses = JSON.parse(result.stdout);
    if (!Array.isArray(responses) || responses.some(response => !response.success)) throw new Error('Respons audit D1 tidak valid.');
    return responses.flatMap(response => response.results);
}
const identifier = value => `"${value.replaceAll('"', '""')}"`;
const literal = value => `'${value.replaceAll("'", "''")}'`;
const columns = query(`SELECT m.name AS table_name, p.name AS column_name
    FROM sqlite_schema m JOIN pragma_table_info(m.name) p
    WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%' AND m.name NOT LIKE '_cf_%'
    AND (upper(p.type) LIKE '%TEXT%' OR upper(p.type) LIKE '%CHAR%' OR p.type = '')
    ORDER BY m.name, p.cid`);
const matches = [];
for (let offset = 0; offset < columns.length; offset += 10) {
    const statements = columns.slice(offset, offset + 10).map(({ table_name, column_name }) =>
        `SELECT ${literal(table_name)} AS table_name, ${literal(column_name)} AS column_name,
        COUNT(*) AS matching_rows FROM ${identifier(table_name)}
        WHERE instr(lower(CAST(${identifier(column_name)} AS TEXT)), 'supabase') > 0 HAVING COUNT(*) > 0`);
    matches.push(...query(statements.join('; ')));
}
console.log(JSON.stringify({
    audited_at: new Date().toISOString(), database, environment: remote ? 'remote' : 'local',
    tables_scanned: new Set(columns.map(column => column.table_name)).size,
    text_columns_scanned: columns.length, matches,
    scope: 'Substring supabase pada kolom teks; tidak mencakup BLOB, arsip browser, atau isi bucket eksternal.',
}, null, 2));
