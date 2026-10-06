export class SuratNumberConflict extends Error {
  constructor() { super('Nomor surat sudah digunakan. Gunakan nomor lain atau penomoran otomatis.'); }
}

export const suratNumberKey = (number: string) => number.trim().replace(/[ \t\r\n]/g, '').toUpperCase();

export async function reserveSuratNumbers<T extends Record<string, string>>(db: D1Database, {
  year, userId, makeNumbers, manualNumbers = [], automatic = true,
}: {
  year: number;
  userId: number;
  makeNumbers: (sequence: string) => T;
  manualNumbers?: string[];
  automatic?: boolean;
}) {
  const manualKeys = new Set(manualNumbers.filter(Boolean).map(suratNumberKey));
  for (let attempt = 0; attempt < 50; attempt++) {
    let sequence = '';
    if (automatic) {
      const row = await db.prepare(`INSERT INTO surat_number_counters(year, last_value) VALUES (?, 1)
        ON CONFLICT(year) DO UPDATE SET last_value = last_value + 1, updated_at = CURRENT_TIMESTAMP
        RETURNING last_value`).bind(year).first<{ last_value: number }>();
      if (!row) throw new Error('Penomoran surat belum tersedia.');
      sequence = String(row.last_value).padStart(3, '0');
    }
    const numbers = makeNumbers(sequence);
    const values = Object.values(numbers);
    const keys = values.map(suratNumberKey);
    if (keys.some(key => !key) || new Set(keys).size !== keys.length) throw new RangeError('Nomor setiap dokumen harus diisi dan berbeda.');
    const reservationId = crypto.randomUUID();
    try {
      await db.batch(values.map(number => db.prepare(`INSERT INTO surat_number_reservations
        (number_key, display_number, year, reservation_id, user_id) VALUES (?, ?, ?, ?, ?)`)
        .bind(suratNumberKey(number), number, year, reservationId, userId)));
      return {
        numbers,
        issueStatement: (primaryNumber: string) => db.prepare(`UPDATE surat_number_reservations
          SET state = 'issued', document_id = (SELECT id FROM surat_undangan WHERE nomor_surat = ? ORDER BY id DESC LIMIT 1)
          WHERE reservation_id = ?`).bind(primaryNumber, reservationId),
        release: () => db.prepare("DELETE FROM surat_number_reservations WHERE reservation_id = ? AND state = 'reserved'")
          .bind(reservationId).run(),
      };
    } catch (error: any) {
      if (!/UNIQUE|PRIMARY KEY|SQLITE_CONSTRAINT_(?:UNIQUE|PRIMARYKEY)/i.test(error.message || '')) throw error;
      const conflicts = await Promise.all(keys.map(key => db.prepare('SELECT number_key FROM surat_number_reservations WHERE number_key = ?').bind(key).first<{ number_key: string }>()));
      if (!automatic || conflicts.some(row => row && manualKeys.has(row.number_key))) throw new SuratNumberConflict();
    }
  }
  throw new SuratNumberConflict();
}
