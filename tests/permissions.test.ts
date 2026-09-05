import { describe, it, expect } from 'vitest';
import { PERMISSIONS, hasPermission, getRolePermissions } from '../src/lib/permissions';

describe('RBAC & Enterprise Permissions Matrix', () => {
  it('should grant full administrative permissions to super_admin and admin', () => {
    const superAdminPerms = getRolePermissions('super_admin');
    const adminPerms = getRolePermissions('admin');

    expect(superAdminPerms).toContain(PERMISSIONS.AUDIT_VIEW);
    expect(superAdminPerms).toContain(PERMISSIONS.TENANT_MANAGE);
    expect(superAdminPerms).toContain(PERMISSIONS.RPP_CREATE);

    expect(hasPermission('admin', PERMISSIONS.SCHOOL_MANAGE)).toBe(true);
    expect(hasPermission('admin', PERMISSIONS.TEACHER_MANAGE)).toBe(true);
    expect(hasPermission('admin', PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
  });

  it('should grant operational permissions to operator without tenant management', () => {
    expect(hasPermission('operator', PERMISSIONS.RPP_CREATE)).toBe(true);
    expect(hasPermission('operator', PERMISSIONS.ABSENSI_MANAGE)).toBe(true);
    expect(hasPermission('operator', PERMISSIONS.TEACHER_MANAGE)).toBe(true);
    expect(hasPermission('operator', PERMISSIONS.SCHOOL_MANAGE)).toBe(true);
    expect(hasPermission('operator', PERMISSIONS.TENANT_MANAGE)).toBe(false);
  });

  it('should grant headmaster permissions to kepala_sekolah', () => {
    expect(hasPermission('kepala_sekolah', PERMISSIONS.SCHOOL_MANAGE)).toBe(true);
    expect(hasPermission('kepala_sekolah', PERMISSIONS.RPP_CREATE)).toBe(true);
    expect(hasPermission('kepala_sekolah', PERMISSIONS.MATERI_UPLOAD)).toBe(true);
    expect(hasPermission('kepala_sekolah', PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
  });

  it('should always allow core AI generators for standard users', () => {
    expect(hasPermission('user', PERMISSIONS.RPP_CREATE)).toBe(true);
    expect(hasPermission('user', PERMISSIONS.KISI_CREATE)).toBe(true);
    expect(hasPermission('user', PERMISSIONS.SLIDE_CREATE)).toBe(true);
    expect(hasPermission('user', PERMISSIONS.TTS_CREATE)).toBe(true);
    expect(hasPermission('user', PERMISSIONS.MATERI_READ)).toBe(true);
    expect(hasPermission('user', PERMISSIONS.ABSENSI_CHECKIN)).toBe(true);
  });

  it('should disallow administrative permissions for standard users', () => {
    expect(hasPermission('user', PERMISSIONS.SCHOOL_MANAGE)).toBe(false);
    expect(hasPermission('user', PERMISSIONS.AUDIT_VIEW)).toBe(false);
    expect(hasPermission('user', PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
    expect(hasPermission('user', PERMISSIONS.TENANT_MANAGE)).toBe(false);
  });

  it('should safely handle undefined or null role', () => {
    expect(hasPermission(undefined, PERMISSIONS.RPP_CREATE)).toBe(false);
    expect(hasPermission(null, PERMISSIONS.RPP_CREATE)).toBe(false);
    expect(getRolePermissions(undefined)).toHaveLength(getRolePermissions('user').length);
  });
});
