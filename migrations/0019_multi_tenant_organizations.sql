-- =============================================
-- Migration 0019: Multi-Tenancy & Enterprise Organization Support
-- Supports multiple KKG Gugus / District clusters
-- =============================================

CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    jenjang TEXT DEFAULT 'SD',
    kecamatan TEXT NOT NULL,
    kabupaten TEXT NOT NULL,
    provinsi TEXT DEFAULT 'Jawa Barat',
    alamat_sekretariat TEXT,
    email TEXT,
    no_kontak TEXT,
    logo_url TEXT,
    kop_surat_url TEXT,
    is_active INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT 500,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed primary default tenant (Gugus 3 Wanayasa)
INSERT OR IGNORE INTO tenants (id, nama, jenjang, kecamatan, kabupaten, provinsi, alamat_sekretariat, email, is_active)
VALUES (
    'kkg-gugus-3-wanayasa',
    'KKG Gugus 3 Wanayasa',
    'SD',
    'Wanayasa',
    'Purwakarta',
    'Jawa Barat',
    'SDN 1 Wanayasa, Kec. Wanayasa, Kab. Purwakarta',
    'admin@kkg-wanayasa.id',
    1
);

-- Add tenant_id to sekolah
ALTER TABLE sekolah ADD COLUMN tenant_id TEXT DEFAULT 'kkg-gugus-3-wanayasa';

-- Add tenant_id to users
ALTER TABLE users ADD COLUMN tenant_id TEXT DEFAULT 'kkg-gugus-3-wanayasa';

-- Add tenant_id to audit_logs
ALTER TABLE audit_logs ADD COLUMN tenant_id TEXT DEFAULT 'kkg-gugus-3-wanayasa';

CREATE INDEX IF NOT EXISTS idx_sekolah_tenant ON sekolah(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);
