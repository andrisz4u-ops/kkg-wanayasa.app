-- Migration: Add status field to absensi for izin/sakit/hadir tracking
-- Also add export capabilities

-- Columns status/latitude/longitude/photo_url are now included in 0001 schema.
-- Keep this migration focused on indexes/views/tables for compatibility.

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_absensi_status ON absensi(status);

-- Create view for rekap by status
CREATE VIEW IF NOT EXISTS v_rekap_absensi_status AS
SELECT 
    u.id as user_id,
    u.nama,
    u.nip,
    u.sekolah,
    COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) as total_hadir,
    COUNT(CASE WHEN a.status = 'izin' THEN 1 END) as total_izin,
    COUNT(CASE WHEN a.status = 'sakit' THEN 1 END) as total_sakit,
    COUNT(CASE WHEN a.status = 'alpha' THEN 1 END) as total_alpha,
    COUNT(a.id) as total_tercatat,
    (SELECT COUNT(*) FROM kegiatan WHERE tanggal <= date('now')) as total_kegiatan
FROM users u
LEFT JOIN absensi a ON u.id = a.user_id
WHERE u.role != 'admin'
GROUP BY u.id;

-- Notification table for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
