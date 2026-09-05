/**
 * Role-Based Access Control (RBAC) & Permissions Library
 * Enterprise Permission Matrix for KKG and School Leaders
 */

export type UserRole = 'super_admin' | 'admin' | 'operator' | 'kepala_sekolah' | 'user';

export const PERMISSIONS = {
  // Generator AI (Always preserved and locked)
  RPP_CREATE: 'rpp:create',
  KISI_CREATE: 'kisi:create',
  SLIDE_CREATE: 'slide:create',
  TTS_CREATE: 'tts:create',

  // Bank Materi & Soal
  MATERI_READ: 'materi:read',
  MATERI_UPLOAD: 'materi:upload',
  SOAL_SHARE: 'soal:share',

  // Presensi & Kegiatan
  ABSENSI_CHECKIN: 'absensi:checkin',
  ABSENSI_MANAGE: 'absensi:manage',
  KEGIATAN_MANAGE: 'kegiatan:manage',

  // Administrasi Gugus & Sekolah
  SCHOOL_MANAGE: 'school:manage',
  TEACHER_MANAGE: 'teacher:manage',
  SURAT_MANAGE: 'surat:manage',
  AUDIT_VIEW: 'audit:view',
  SETTINGS_MANAGE: 'settings:manage',
  TENANT_MANAGE: 'tenant:manage'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS),
  operator: [
    PERMISSIONS.RPP_CREATE,
    PERMISSIONS.KISI_CREATE,
    PERMISSIONS.SLIDE_CREATE,
    PERMISSIONS.TTS_CREATE,
    PERMISSIONS.MATERI_READ,
    PERMISSIONS.MATERI_UPLOAD,
    PERMISSIONS.SOAL_SHARE,
    PERMISSIONS.ABSENSI_CHECKIN,
    PERMISSIONS.ABSENSI_MANAGE,
    PERMISSIONS.KEGIATAN_MANAGE,
    PERMISSIONS.SCHOOL_MANAGE,
    PERMISSIONS.TEACHER_MANAGE,
    PERMISSIONS.SURAT_MANAGE
  ],
  kepala_sekolah: [
    PERMISSIONS.RPP_CREATE,
    PERMISSIONS.KISI_CREATE,
    PERMISSIONS.SLIDE_CREATE,
    PERMISSIONS.TTS_CREATE,
    PERMISSIONS.MATERI_READ,
    PERMISSIONS.MATERI_UPLOAD,
    PERMISSIONS.SOAL_SHARE,
    PERMISSIONS.ABSENSI_CHECKIN,
    PERMISSIONS.SCHOOL_MANAGE
  ],
  user: [
    PERMISSIONS.RPP_CREATE,
    PERMISSIONS.KISI_CREATE,
    PERMISSIONS.SLIDE_CREATE,
    PERMISSIONS.TTS_CREATE,
    PERMISSIONS.MATERI_READ,
    PERMISSIONS.MATERI_UPLOAD,
    PERMISSIONS.SOAL_SHARE,
    PERMISSIONS.ABSENSI_CHECKIN
  ]
};

/**
 * Check if a given role has a specific permission
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  const permissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.user;
  return permissions.includes(permission);
}

/**
 * Get full list of permissions for a role
 */
export function getRolePermissions(role: string | undefined | null): Permission[] {
  if (!role) return [...ROLE_PERMISSIONS.user];
  const normalizedRole = role.toLowerCase();
  return [...(ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.user)];
}
