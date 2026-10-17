export const LAPORAN_STATUSES = ['draft', 'final'] as const;
export type LaporanStatus = typeof LAPORAN_STATUSES[number];

export function isLaporanStatus(value: unknown): value is LaporanStatus {
  return typeof value === 'string' && (LAPORAN_STATUSES as readonly string[]).includes(value);
}

export function canAccessLaporan(user: { id: number | string; role: string }, ownerId: number | string): boolean {
  return user.role === 'admin' || user.role === 'operator' || String(user.id) === String(ownerId);
}

export function canListAllLaporan(user: { role: string }): boolean {
  return user.role === 'admin' || user.role === 'operator';
}
