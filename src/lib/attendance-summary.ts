function validateDate(value?: string): void {
  if (!value) return;
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError('Tanggal harus valid dengan format YYYY-MM-DD.');
  }
}

export function attendanceSummary(startDate?: string, endDate?: string, forExport = false) {
  validateDate(startDate);
  validateDate(endDate);
  if (startDate && endDate && startDate > endDate) throw new RangeError('Tanggal awal tidak boleh melewati tanggal akhir.');
  const filters: string[] = [];
  const params: string[] = [];
  if (startDate) { filters.push('k.tanggal >= ?'); params.push(startDate); }
  if (endDate) { filters.push('k.tanggal <= ?'); params.push(endDate); }
  const names = forExport ? ['hadir', 'izin', 'sakit', 'tercatat'] : ['total_hadir', 'total_izin', 'total_sakit', 'total_tercatat'];
  return {
    params,
    sql: `WITH selected_kegiatan AS (
      SELECT k.id FROM kegiatan k ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
    )
    SELECT u.id, u.nama, u.nip, u.sekolah,
      COUNT(DISTINCT CASE WHEN a.status = 'hadir' THEN a.kegiatan_id END) AS ${names[0]},
      COUNT(DISTINCT CASE WHEN a.status = 'izin' THEN a.kegiatan_id END) AS ${names[1]},
      COUNT(DISTINCT CASE WHEN a.status = 'sakit' THEN a.kegiatan_id END) AS ${names[2]},
      COUNT(DISTINCT a.kegiatan_id) AS ${names[3]},
      (SELECT COUNT(*) FROM selected_kegiatan) AS total_kegiatan
    FROM users u
    LEFT JOIN absensi a ON u.id = a.user_id AND a.kegiatan_id IN (SELECT id FROM selected_kegiatan)
    WHERE u.role = 'user'
    GROUP BY u.id
    ORDER BY ${forExport ? 'u.nama ASC' : 'total_hadir DESC, u.nama ASC'}`,
  };
}

export function csvCell(value: unknown): string {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
