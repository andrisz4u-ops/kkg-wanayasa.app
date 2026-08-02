-- Seed data for KKG Gugus 3 Wanayasa
-- Default admin password: admin123 (hashed with simple SHA-256 for demo)

INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
VALUES 
  (1, 'Admin KKG Gugus 3', 'admin@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', '198501012010011001', 'SDN 1 Wanayasa', 'Guru Kelas', '081234567890'),
  (2, 'Siti Nurhaliza', 'siti@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198602022011012002', 'SDN 2 Wanayasa', 'Matematika', '081234567891'),
  (3, 'Budi Santoso', 'budi@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198703032012011003', 'SDN 3 Wanayasa', 'IPA', '081234567892'),
  (4, 'Dewi Lestari', 'dewi@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198804042013012004', 'SDN 1 Wanayasa', 'Bahasa Indonesia', '081234567893'),
  (5, 'Ahmad Fauzi', 'ahmad@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198905052014011005', 'SDN 4 Wanayasa', 'IPS', '081234567894');

INSERT OR IGNORE INTO pengumuman (id, judul, isi, kategori, is_pinned, created_by)
VALUES
  (1, 'Selamat Datang di Portal Digital KKG Gugus 3 Wanayasa', 'Assalamualaikum Wr. Wb.\n\nDengan penuh rasa syukur, kami meluncurkan Portal Digital KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta. Portal ini dirancang untuk memudahkan koordinasi, komunikasi, dan kolaborasi antar guru di lingkungan KKG Gugus 3.\n\nSemoga portal ini bermanfaat bagi seluruh anggota.\n\nWassalamualaikum Wr. Wb.', 'umum', 1, 1),
  (2, 'Jadwal Rapat Rutin KKG Bulan Februari 2026', 'Diberitahukan kepada seluruh anggota KKG Gugus 3 Wanayasa bahwa rapat rutin bulanan akan dilaksanakan pada:\n\nHari/Tanggal: Sabtu, 14 Februari 2026\nWaktu: 09.00 - 12.00 WIB\nTempat: SDN 1 Wanayasa\nAgenda: Evaluasi Program Semester Ganjil dan Penyusunan Program Semester Genap\n\nDimohon kehadiran seluruh anggota tepat waktu.', 'jadwal', 1, 1),
  (3, 'Workshop Kurikulum Merdeka Belajar', 'KKG Gugus 3 Wanayasa akan menyelenggarakan Workshop Kurikulum Merdeka Belajar bekerja sama dengan Dinas Pendidikan Kabupaten Purwakarta. Kegiatan ini wajib diikuti seluruh guru anggota KKG.', 'kegiatan', 0, 1);

INSERT OR IGNORE INTO kegiatan (id, nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi, created_by)
VALUES
  (1, 'Rapat Rutin KKG Februari 2026', '2026-02-14', '09:00', '12:00', 'SDN 1 Wanayasa', 'Evaluasi Program Semester Ganjil dan Penyusunan Program Semester Genap', 1),
  (2, 'Workshop Kurikulum Merdeka', '2026-02-28', '08:00', '16:00', 'SDN 1 Wanayasa', 'Workshop implementasi Kurikulum Merdeka Belajar', 1);

INSERT OR IGNORE INTO forum_threads (id, judul, isi, kategori, user_id, reply_count)
VALUES
  (1, 'Sharing Best Practice: Pembelajaran Diferensiasi di SD', 'Assalamualaikum rekan-rekan guru.\n\nSaya ingin berbagi pengalaman tentang penerapan pembelajaran diferensiasi di kelas saya. Bagaimana pengalaman rekan-rekan?\n\nMari kita diskusikan bersama.', 'best-practice', 2, 1),
  (2, 'Tips Membuat RPP Kurikulum Merdeka', 'Bagi rekan guru yang masih bingung menyusun RPP/Modul Ajar sesuai Kurikulum Merdeka, mari kita diskusikan di thread ini.', 'kurikulum', 3, 0);

INSERT OR IGNORE INTO forum_replies (id, thread_id, user_id, isi)
VALUES
  (1, 1, 3, 'Waalaikumsalam Bu Siti.\n\nSaya sudah mencoba pembelajaran diferensiasi dengan membagi murid berdasarkan gaya belajar. Hasilnya cukup positif, murid lebih antusias mengikuti pembelajaran.');

INSERT OR IGNORE INTO settings (key, value)
VALUES
  ('mistral_api_key', ''),
  ('nama_ketua', 'Admin KKG Gugus 3'),
  ('nip_ketua', '198501012010011001'),
  ('alamat_sekretariat', 'SDN 1 Wanayasa, Jl. Raya Wanayasa No. 1, Kec. Wanayasa, Kab. Purwakarta'),
  ('tahun_ajaran', '2025/2026');

-- Data Kalender Pendidikan SDN 2 Nangerang 2026-2027

INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Awal Semester', 'holiday', '2026-07-01', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Awal Semester', 'holiday', '2026-07-06', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Masa Pengenalan Lingkungan Sekolah', 'other', '2026-07-13', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Jadi Purwakarta', 'holiday', '2026-07-20', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Pramuka / Pahlawan', 'other', '2026-08-14', 1, '#10B981', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2026-08-17', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2026-08-25', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Peringatan Hari Besar Islam', 'holiday', '2026-08-28', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Udara Bersih', 'other', '2026-09-07', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Bambu Sedunia', 'other', '2026-09-18', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Sumatif Tengah Semester', 'deadline', '2026-09-21', 1, '#F59E0B', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Kesaktian Pancasila', 'other', '2026-10-01', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Sumpah Pemuda', 'other', '2026-10-28', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Pramuka / Pahlawan', 'other', '2026-11-10', 1, '#10B981', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Guru Nasional dan HUT PGRI', 'other', '2026-11-25', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Disabilitas Internasional', 'other', '2026-12-03', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Anti Korupsi', 'other', '2026-12-09', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Sumatif Akhir Semester', 'deadline', '2026-12-14', 1, '#F59E0B', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Tanggal Penetapan Rapot', 'deadline', '2026-12-21', 1, '#F59E0B', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Pembagian Rapot', 'other', '2026-12-23', 1, '#10B981', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2026-12-24', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Peringatan Hari Besar Islam', 'holiday', '2026-12-25', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2026-12-28', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2027-01-01', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2027-01-04', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2027-02-07', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Awal Ramadhan', 'holiday', '2027-02-08', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Pesantren Kilat', 'training', '2027-02-17', 1, '#10B981', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Pesantren Kilat', 'training', '2027-02-22', 1, '#10B981', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Pesantren Kilat', 'training', '2027-02-29', 1, '#10B981', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Pesantren Kilat', 'training', '2027-03-01', 1, '#10B981', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Simulasi', 'other', '2027-03-04', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2027-03-08', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Idul Fitri', 'holiday', '2027-03-09', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('HAS', 'other', '2027-03-22', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2027-03-26', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Buruh', 'holiday', '2027-04-22', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Bambu Sedunia', 'other', '2027-04-23', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('TKA Susulan', 'deadline', '2027-04-26', 1, '#F59E0B', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2027-05-01', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2027-05-06', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Asesmen Sumatif Akhir Jenjang', 'deadline', '2027-05-10', 1, '#F59E0B', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('IA', 'other', '2027-05-17', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2027-05-20', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('OSN', 'other', '2027-05-24', 1, '#10B981', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Nasional', 'holiday', '2027-06-01', 1, '#EF4444', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Hari Lingkungan Hidup', 'other', '2027-06-05', 1, '#3B82F6', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Asesmen Sumatif Akhir Tahun', 'deadline', '2027-06-07', 1, '#F59E0B', 1);
INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('Libur Akhir Tahun', 'holiday', '2027-06-28', 1, '#EF4444', 1);